import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSession, setSessionCookie } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, locals, cookies, platform }) => {
	const { displayName, bootstrapKey } = await request.json();

	const requiredKey = platform?.env.BOOTSTRAP_ADMIN_KEY;
	if (requiredKey && bootstrapKey !== requiredKey) {
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
	const normalizedName =
		typeof displayName === 'string' && displayName.trim().length > 0
			? displayName.trim()
			: '初期管理者';

	await locals.db.batch([
		locals.db
			.prepare('INSERT INTO users (id, email, phone, created_at) VALUES (?1, ?2, ?3, ?4)')
			.bind(userId, email, null, now),
		locals.db
			.prepare('INSERT INTO profiles (id, display_name, role, created_at) VALUES (?1, ?2, ?3, ?4)')
			.bind(userId, normalizedName, 'admin', now)
	]);

	const { sessionId, expiresAt } = await createSession(locals.db, userId);
	setSessionCookie(cookies, sessionId, expiresAt);

	return json({ success: true });
};
