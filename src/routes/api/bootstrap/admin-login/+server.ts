import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSession, setSessionCookie } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, locals, cookies, platform }) => {
	const { bootstrapKey } = await request.json();

	const requiredKey = platform?.env.BOOTSTRAP_ADMIN_KEY;
	if (!requiredKey) {
		return json({ error: 'サーバー側で BOOTSTRAP_ADMIN_KEY が未設定です' }, { status: 503 });
	}
	if (bootstrapKey !== requiredKey) {
		return json({ error: '管理者キーが正しくありません' }, { status: 403 });
	}

	const admin = (await locals.db
		.prepare(
			`SELECT profiles.id AS id
			 FROM profiles
			 WHERE profiles.role = 'admin'
			 ORDER BY profiles.created_at ASC
			 LIMIT 1`
		)
		.first()) as { id: string } | null;

	if (!admin) {
		return json({ error: '管理者ユーザーが見つかりません' }, { status: 404 });
	}

	const { sessionId, expiresAt } = await createSession(locals.db, admin.id);
	setSessionCookie(cookies, sessionId, expiresAt);

	return json({ success: true });
};
