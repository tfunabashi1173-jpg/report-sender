import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSession, setSessionCookie } from '$lib/server/auth';

export const GET: RequestHandler = async ({ params, locals }) => {
	const data = (await locals.db
		.prepare(
			`SELECT id, display_name AS displayName, expires_at AS expiresAt, used_at AS usedAt
			 FROM invites
			 WHERE token = ?1`
		)
		.bind(params.token)
		.first()) as { id: number; displayName: string | null; expiresAt: string; usedAt: string | null } | null;

	if (!data) return json({ error: '招待リンクが無効です' }, { status: 404 });
	if (data.usedAt) return json({ error: 'この招待リンクは使用済みです' }, { status: 410 });
	if (new Date(data.expiresAt) < new Date()) return json({ error: '招待リンクの有効期限が切れています' }, { status: 410 });

	return json({ valid: true, displayName: data.displayName });
};

export const POST: RequestHandler = async ({ params, request, locals, cookies }) => {
	const { displayName } = await request.json();
	if (!displayName) return json({ error: '名前は必須です' }, { status: 400 });

	const invite = (await locals.db
		.prepare(
			`SELECT id, expires_at AS expiresAt, used_at AS usedAt
			 FROM invites
			 WHERE token = ?1`
		)
		.bind(params.token)
		.first()) as { id: number; expiresAt: string; usedAt: string | null } | null;

	if (!invite) return json({ error: '招待リンクが無効です' }, { status: 404 });
	if (invite.usedAt) return json({ error: 'この招待リンクは使用済みです' }, { status: 410 });
	if (new Date(invite.expiresAt) < new Date()) return json({ error: '有効期限切れです' }, { status: 410 });

	const userId = crypto.randomUUID();
	const placeholderEmail = `${crypto.randomUUID()}@report-sender.local`;
	const now = new Date().toISOString();

	await locals.db.batch([
		locals.db
			.prepare('INSERT INTO users (id, email, phone, created_at) VALUES (?1, ?2, ?3, ?4)')
			.bind(userId, placeholderEmail, null, now),
		locals.db
			.prepare('INSERT INTO profiles (id, display_name, role, created_at) VALUES (?1, ?2, ?3, ?4)')
			.bind(userId, displayName, 'member', now),
		locals.db
			.prepare('UPDATE invites SET used_at = ?1 WHERE id = ?2')
			.bind(now, invite.id)
	]);

	const { sessionId, expiresAt } = await createSession(locals.db, userId);
	setSessionCookie(cookies, sessionId, expiresAt);

	return json({ success: true });
};
