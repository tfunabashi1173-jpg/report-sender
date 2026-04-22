import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hashPassword } from '$lib/server/password';
import { createSession, isSecureRequest, setSessionCookie } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, locals, cookies, url }) => {
	const { displayName, password } = await request.json();

	if (typeof displayName !== 'string' || displayName.trim().length === 0) {
		return json({ error: '管理者名は必須です' }, { status: 400 });
	}
	if (typeof password !== 'string' || password.length < 8) {
		return json({ error: 'パスワードは8文字以上で入力してください' }, { status: 400 });
	}

	const normalizedName = displayName.trim();
	const passwordHash = await hashPassword(password);
	const now = new Date().toISOString();

	const adminPasskeyCountRow = (await locals.db
		.prepare(
			`SELECT COUNT(*) AS count
			 FROM passkey_credentials
			 WHERE user_id IN (SELECT id FROM profiles WHERE role = 'admin')`
		)
		.first()) as { count: number | string } | null;
	const adminPasskeyCount = Number(adminPasskeyCountRow?.count ?? 0);

	if (adminPasskeyCount > 0) {
		return json({ error: '管理者パスキーが存在するため復旧はできません。通常ログインしてください。' }, { status: 409 });
	}

	const existingAdmin = (await locals.db
		.prepare(
			`SELECT users.id AS id
			 FROM users
			 JOIN profiles ON profiles.id = users.id
			 WHERE profiles.role = 'admin' AND profiles.display_name = ?1`
		)
		.bind(normalizedName)
		.first()) as { id: string } | null;

	let adminUserId: string;

	if (existingAdmin) {
		adminUserId = existingAdmin.id;
		await locals.db
			.prepare('UPDATE users SET password_hash = ?1 WHERE id = ?2')
			.bind(passwordHash, adminUserId)
			.run();
	} else {
		const adminCountRow = (await locals.db
			.prepare("SELECT COUNT(*) AS count FROM profiles WHERE role = 'admin'")
			.first()) as { count: number | string } | null;
		const adminCount = Number(adminCountRow?.count ?? 0);

		if (adminCount > 0) {
			return json({ error: '指定した管理者名が見つかりません' }, { status: 404 });
		}

		adminUserId = crypto.randomUUID();
		const email = `admin-${crypto.randomUUID()}@report-sender.local`;

		const hasLegacyLoginIdColumn = Boolean(
			await locals.db
				.prepare("SELECT 1 FROM pragma_table_info('users') WHERE name = 'login_id' LIMIT 1")
				.first()
		);

		await locals.db.batch([
			locals.db
				.prepare(
					hasLegacyLoginIdColumn
						? 'INSERT INTO users (id, email, phone, login_id, password_hash, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
						: 'INSERT INTO users (id, email, phone, password_hash, created_at) VALUES (?1, ?2, ?3, ?4, ?5)'
				)
				.bind(
					...(hasLegacyLoginIdColumn
						? [adminUserId, email, null, normalizedName, passwordHash, now]
						: [adminUserId, email, null, passwordHash, now])
				),
			locals.db
				.prepare('INSERT INTO profiles (id, display_name, role, created_at) VALUES (?1, ?2, ?3, ?4)')
				.bind(adminUserId, normalizedName, 'admin', now)
		]);
	}

	const { sessionId, expiresAt } = await createSession(locals.db, adminUserId);
	setSessionCookie(cookies, sessionId, expiresAt, isSecureRequest(url));
	return json({ success: true });
};
