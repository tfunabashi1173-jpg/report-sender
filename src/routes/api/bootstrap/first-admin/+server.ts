import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSession, setSessionCookie } from '$lib/server/auth';
import { hashPassword } from '$lib/server/password';

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const { displayName, password } = await request.json();

	if (typeof displayName !== 'string' || displayName.trim().length === 0) {
		return json({ error: '管理者名は必須です' }, { status: 400 });
	}
	if (typeof password !== 'string' || password.length < 8) {
		return json({ error: 'ログインパスワードは8文字以上で入力してください' }, { status: 400 });
	}

	const adminCountRow = (await locals.db
		.prepare("SELECT COUNT(*) AS count FROM profiles WHERE role = 'admin'")
		.first()) as { count: number | string } | null;

	const adminCount = Number(adminCountRow?.count ?? 0);
	if (adminCount > 0) {
		return json({ error: '既に管理者が存在します' }, { status: 409 });
	}

	const userId = crypto.randomUUID();
	const now = new Date().toISOString();
	const email = `admin-${crypto.randomUUID()}@report-sender.local`;
	const normalizedName = displayName.trim();
	const passwordHash = await hashPassword(password);

	const exists = (await locals.db
		.prepare('SELECT id FROM profiles WHERE display_name = ?1')
		.bind(normalizedName)
		.first()) as { id: string } | null;
	if (exists) {
		return json({ error: 'その名前は既に使用されています' }, { status: 409 });
	}

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
					? [userId, email, null, normalizedName, passwordHash, now]
					: [userId, email, null, passwordHash, now])
			),
		locals.db
			.prepare('INSERT INTO profiles (id, display_name, role, created_at) VALUES (?1, ?2, ?3, ?4)')
			.bind(userId, normalizedName, 'admin', now)
	]);

	const { sessionId, expiresAt } = await createSession(locals.db, userId);
	setSessionCookie(cookies, sessionId, expiresAt);

	return json({ success: true });
};
