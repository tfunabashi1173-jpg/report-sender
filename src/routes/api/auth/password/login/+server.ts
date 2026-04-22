import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSession, isSecureRequest, setSessionCookie } from '$lib/server/auth';
import { verifyPassword } from '$lib/server/password';

export const POST: RequestHandler = async ({ request, locals, cookies, url }) => {
	const { displayName, password } = await request.json();

	if (typeof displayName !== 'string' || displayName.trim().length === 0) {
		return json({ error: '名前は必須です' }, { status: 400 });
	}
	if (typeof password !== 'string' || password.length === 0) {
		return json({ error: 'パスワードは必須です' }, { status: 400 });
	}

	const user = (await locals.db
		.prepare(
			`SELECT users.id AS id, users.password_hash AS passwordHash
			 FROM users
			 LEFT JOIN profiles ON profiles.id = users.id
			 WHERE profiles.display_name = ?1
			    OR users.login_id = ?1`
		)
		.bind(displayName.trim())
		.first()) as { id: string; passwordHash: string | null } | null;

	if (!user?.passwordHash) {
		return json({ error: '名前またはパスワードが正しくありません' }, { status: 401 });
	}

	const valid = await verifyPassword(password, user.passwordHash);
	if (!valid) {
		return json({ error: '名前またはパスワードが正しくありません' }, { status: 401 });
	}

	const { sessionId, expiresAt } = await createSession(locals.db, user.id);
	setSessionCookie(cookies, sessionId, expiresAt, isSecureRequest(url));
	return json({ success: true });
};
