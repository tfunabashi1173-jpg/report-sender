import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSession, setSessionCookie } from '$lib/server/auth';
import { verifyPassword } from '$lib/server/password';

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const { loginId, password } = await request.json();

	if (typeof loginId !== 'string' || loginId.trim().length === 0) {
		return json({ error: 'ログインIDは必須です' }, { status: 400 });
	}
	if (typeof password !== 'string' || password.length === 0) {
		return json({ error: 'パスワードは必須です' }, { status: 400 });
	}

	const user = (await locals.db
		.prepare('SELECT id, password_hash AS passwordHash FROM users WHERE login_id = ?1')
		.bind(loginId.trim())
		.first()) as { id: string; passwordHash: string | null } | null;

	if (!user?.passwordHash) {
		return json({ error: 'ログインIDまたはパスワードが正しくありません' }, { status: 401 });
	}

	const valid = await verifyPassword(password, user.passwordHash);
	if (!valid) {
		return json({ error: 'ログインIDまたはパスワードが正しくありません' }, { status: 401 });
	}

	const { sessionId, expiresAt } = await createSession(locals.db, user.id);
	setSessionCookie(cookies, sessionId, expiresAt);
	return json({ success: true });
};
