import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const profile = (await locals.db
		.prepare('SELECT role FROM profiles WHERE id = ?1')
		.bind(user.id)
		.first()) as { role: string } | null;

	if (profile?.role !== 'admin') {
		return json({ error: '管理者のみ招待リンクを作成できます' }, { status: 403 });
	}

	const { displayName, phone } = await request.json();
	const token = crypto.randomUUID();
	const now = new Date();
	const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

	await locals.db
		.prepare(
			`INSERT INTO invites (token, display_name, phone, created_by, expires_at, created_at)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
		)
		.bind(token, displayName || null, phone || null, user.id, expiresAt.toISOString(), now.toISOString())
		.run();

	return json({ url: `${url.origin}/invite/${token}` });
};
