import type { D1Database } from '@cloudflare/workers-types';

const SESSION_COOKIE_NAME = 'report_sender_session';
const AUTH_CHALLENGE_COOKIE_NAME = 'report_sender_auth_challenge';
const SESSION_TTL_DAYS = 30;
const CHALLENGE_TTL_MINUTES = 5;

export type AppSession = {
	id: string;
	userId: string;
	expiresAt: string;
};

export type AppUser = {
	id: string;
	email: string | null;
	phone: string | null;
	displayName: string | null;
	organization: string | null;
};

export function isSecureRequest(url: URL) {
	return url.protocol === 'https:';
}

function addDays(date: Date, days: number) {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

function addMinutes(date: Date, minutes: number) {
	const result = new Date(date);
	result.setMinutes(result.getMinutes() + minutes);
	return result;
}

export async function createSession(db: D1Database, userId: string) {
	const now = new Date();
	const expiresAt = addDays(now, SESSION_TTL_DAYS);
	const sessionId = crypto.randomUUID();

	await db
		.prepare(
			`INSERT INTO sessions (id, user_id, expires_at, created_at)
			 VALUES (?1, ?2, ?3, ?4)`
		)
		.bind(sessionId, userId, expiresAt.toISOString(), now.toISOString())
		.run();

	return {
		sessionId,
		expiresAt: expiresAt.toISOString()
	};
}

export function setSessionCookie(
	cookies: import('@sveltejs/kit').Cookies,
	sessionId: string,
	expiresAt: string,
	secure: boolean
) {
	cookies.set(SESSION_COOKIE_NAME, sessionId, {
		httpOnly: true,
		secure,
		sameSite: 'lax',
		path: '/',
		expires: new Date(expiresAt)
	});
}

export function clearSessionCookie(cookies: import('@sveltejs/kit').Cookies) {
	cookies.delete(SESSION_COOKIE_NAME, {
		httpOnly: true,
		sameSite: 'lax',
		path: '/'
	});
}

export async function destroySession(db: D1Database, cookies: import('@sveltejs/kit').Cookies) {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);
	if (sessionId) {
		await db.prepare('DELETE FROM sessions WHERE id = ?1').bind(sessionId).run();
	}
	clearSessionCookie(cookies);
}

export async function safeGetSession(
	db: D1Database,
	cookies: import('@sveltejs/kit').Cookies
): Promise<{ session: AppSession | null; user: AppUser | null }> {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);
	if (!sessionId) {
		return { session: null, user: null };
	}

	const session = (await db
		.prepare(
			`SELECT id, user_id AS userId, expires_at AS expiresAt
			 FROM sessions
			 WHERE id = ?1`
		)
		.bind(sessionId)
		.first()) as AppSession | null;

	if (!session) {
		clearSessionCookie(cookies);
		return { session: null, user: null };
	}

	if (new Date(session.expiresAt) <= new Date()) {
		await db.prepare('DELETE FROM sessions WHERE id = ?1').bind(sessionId).run();
		clearSessionCookie(cookies);
		return { session: null, user: null };
	}

	const user = (await db
		.prepare(
			`SELECT users.id, users.email, users.phone,
			        profiles.display_name AS displayName, profiles.organization
			 FROM users
			 LEFT JOIN profiles ON profiles.id = users.id
			 WHERE users.id = ?1`
		)
		.bind(session.userId)
		.first()) as AppUser | null;

	if (!user) {
		await db.prepare('DELETE FROM sessions WHERE id = ?1').bind(sessionId).run();
		clearSessionCookie(cookies);
		return { session: null, user: null };
	}

	return { session, user };
}

export function setAuthChallengeCookie(
	cookies: import('@sveltejs/kit').Cookies,
	challengeId: string,
	secure: boolean
) {
	cookies.set(AUTH_CHALLENGE_COOKIE_NAME, challengeId, {
		httpOnly: true,
		secure,
		sameSite: 'lax',
		path: '/',
		expires: addMinutes(new Date(), CHALLENGE_TTL_MINUTES)
	});
}

export function getAuthChallengeCookie(cookies: import('@sveltejs/kit').Cookies) {
	return cookies.get(AUTH_CHALLENGE_COOKIE_NAME) ?? null;
}

export function clearAuthChallengeCookie(cookies: import('@sveltejs/kit').Cookies) {
	cookies.delete(AUTH_CHALLENGE_COOKIE_NAME, {
		httpOnly: true,
		sameSite: 'lax',
		path: '/'
	});
}
