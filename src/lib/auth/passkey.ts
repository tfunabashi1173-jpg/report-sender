import type { D1Database } from '@cloudflare/workers-types';

export const RP_NAME = '報告メール送信システム';

export type PasskeyCredential = {
	credential_id: string;
	public_key: string;
	counter: number;
};

export function getRpId(url: URL) {
	return url.hostname;
}

export async function getPasskeyCredentials(db: D1Database, userId: string) {
	const { results } = await db
		.prepare(
			`SELECT credential_id, public_key, counter
			 FROM passkey_credentials
			 WHERE user_id = ?1`
		)
		.bind(userId)
		.all<PasskeyCredential>();
	return results as PasskeyCredential[];
}

export async function getAllPasskeyCredentialIds(db: D1Database) {
	const { results } = await db
		.prepare(
			`SELECT credential_id
			 FROM passkey_credentials`
		)
		.all<{ credential_id: string }>();
	return (results ?? []).map((row) => row.credential_id);
}

export async function getPasskeyCredentialById(db: D1Database, credentialId: string) {
	return (await db
		.prepare(
			`SELECT credential_id, user_id, public_key, counter
			 FROM passkey_credentials
			 WHERE credential_id = ?1`
		)
		.bind(credentialId)
		.first()) as
		| {
				credential_id: string;
				user_id: string;
				public_key: string;
				counter: number;
		  }
		| null;
}

export async function savePasskeyCredential(
	db: D1Database,
	userId: string,
	credentialId: string,
	publicKey: string,
	counter: number,
	deviceName?: string
) {
	await db
		.prepare(
			`INSERT INTO passkey_credentials
			 (user_id, credential_id, public_key, counter, device_name, created_at)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
		)
		.bind(userId, credentialId, publicKey, counter, deviceName ?? null, new Date().toISOString())
		.run();
}

export async function updatePasskeyCounter(db: D1Database, credentialId: string, counter: number) {
	await db
		.prepare(
			`UPDATE passkey_credentials
			 SET counter = ?1, last_used_at = ?2
			 WHERE credential_id = ?3`
		)
		.bind(counter, new Date().toISOString(), credentialId)
		.run();
}

export async function saveChallenge(db: D1Database, kind: string, scope: string, challenge: string) {
	const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
	await db
		.prepare(
			`INSERT INTO auth_challenges (kind, scope, challenge, expires_at, created_at)
			 VALUES (?1, ?2, ?3, ?4, ?5)
			 ON CONFLICT(kind, scope) DO UPDATE SET
			 challenge = excluded.challenge,
			 expires_at = excluded.expires_at,
			 created_at = excluded.created_at`
		)
		.bind(kind, scope, challenge, expiresAt, new Date().toISOString())
		.run();
}

export async function getChallenge(db: D1Database, kind: string, scope: string) {
	const row = (await db
		.prepare(
			`SELECT challenge, expires_at
			 FROM auth_challenges
			 WHERE kind = ?1 AND scope = ?2`
		)
		.bind(kind, scope)
		.first()) as { challenge: string; expires_at: string } | null;

	if (!row) return null;
	if (new Date(row.expires_at) <= new Date()) {
		await deleteChallenge(db, kind, scope);
		return null;
	}
	return row.challenge;
}

export async function deleteChallenge(db: D1Database, kind: string, scope: string) {
	await db
		.prepare('DELETE FROM auth_challenges WHERE kind = ?1 AND scope = ?2')
		.bind(kind, scope)
		.run();
}
