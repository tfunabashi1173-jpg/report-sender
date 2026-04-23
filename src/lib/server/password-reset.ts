import { bytesToBase64 } from '$lib/server/base64';

export const PASSWORD_RESET_TTL_MINUTES = 30;

export function createResetToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return bytesToBase64(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export async function hashResetToken(token: string) {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
	return bytesToBase64(new Uint8Array(digest));
}

export function resetTokenExpiry(now = new Date()) {
	return new Date(now.getTime() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000).toISOString();
}
