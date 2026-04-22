import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSession, setSessionCookie } from '$lib/server/auth';
import { hashPassword } from '$lib/server/password';

export const POST: RequestHandler = async ({ request, locals, cookies, platform }) => {
	const { displayName, bootstrapKey, loginId, password } = await request.json();

	const requiredKey = platform?.env.BOOTSTRAP_ADMIN_KEY;
	if (!requiredKey) {
		return json({ error: 'サーバー側で BOOTSTRAP_ADMIN_KEY が未設定です' }, { status: 503 });
	}

	if (typeof displayName !== 'string' || displayName.trim().length === 0) {
		return json({ error: '管理者名は必須です' }, { status: 400 });
	}
	if (typeof loginId !== 'string' || loginId.trim().length === 0) {
		return json({ error: 'ログインIDは必須です' }, { status: 400 });
	}
	if (typeof password !== 'string' || password.length < 8) {
		return json({ error: 'ログインパスワードは8文字以上で入力してください' }, { status: 400 });
	}

	if (typeof bootstrapKey !== 'string' || bootstrapKey.trim().length === 0) {
		return json({ error: '管理者パスワードは必須です' }, { status: 400 });
	}

	if (bootstrapKey !== requiredKey) {
		return json({ error: '初期化キーが正しくありません' }, { status: 403 });
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
	const normalizedLoginId = loginId.trim();
	const passwordHash = await hashPassword(password);

	const exists = (await locals.db
		.prepare('SELECT id FROM users WHERE login_id = ?1')
		.bind(normalizedLoginId)
		.first()) as { id: string } | null;
	if (exists) {
		return json({ error: 'そのログインIDは既に使用されています' }, { status: 409 });
	}

	await locals.db.batch([
		locals.db
			.prepare(
				'INSERT INTO users (id, email, phone, login_id, password_hash, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
			)
			.bind(userId, email, null, normalizedLoginId, passwordHash, now),
		locals.db
			.prepare('INSERT INTO profiles (id, display_name, role, created_at) VALUES (?1, ?2, ?3, ?4)')
			.bind(userId, normalizedName, 'admin', now)
	]);

	const { sessionId, expiresAt } = await createSession(locals.db, userId);
	setSessionCookie(cookies, sessionId, expiresAt);

	return json({ success: true });
};
