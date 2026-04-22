import type { Handle } from '@sveltejs/kit';
import { safeGetSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const db = event.platform?.env.DB;
	if (!db) {
		throw new Error('D1 binding `DB` is not configured');
	}

	event.locals.db = db;
	const { session, user } = await safeGetSession(db, event.cookies);
	event.locals.session = session;
	event.locals.user = user;
	event.locals.safeGetSession = async () => ({ session: event.locals.session, user: event.locals.user });

	return resolve(event);
};
