import { base64ToBytes, bytesToBase64 } from '$lib/server/base64';

const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

async function derive(password: string, salt: Uint8Array, iterations: number) {
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);
	const bits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			hash: 'SHA-256',
			salt: salt as unknown as BufferSource,
			iterations
		},
		keyMaterial,
		HASH_BITS
	);
	return new Uint8Array(bits);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i += 1) {
		diff |= a[i] ^ b[i];
	}
	return diff === 0;
}

export async function hashPassword(password: string) {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
	const hash = await derive(password, salt, PBKDF2_ITERATIONS);
	return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

export async function verifyPassword(password: string, storedHash: string) {
	const [algorithm, iterationText, saltBase64, hashBase64] = storedHash.split('$');
	if (algorithm !== 'pbkdf2' || !iterationText || !saltBase64 || !hashBase64) return false;

	const iterations = Number(iterationText);
	if (!Number.isFinite(iterations) || iterations <= 0) return false;

	const salt = base64ToBytes(saltBase64);
	const expectedHash = base64ToBytes(hashBase64);
	try {
		const actualHash = await derive(password, salt, iterations);
		return timingSafeEqual(actualHash, expectedHash);
	} catch {
		return false;
	}
}
