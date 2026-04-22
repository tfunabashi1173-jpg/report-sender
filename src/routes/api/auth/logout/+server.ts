import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { destroySession } from '$lib/server/auth';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	await destroySession(locals.db, cookies);
	return json({ success: true });
};
