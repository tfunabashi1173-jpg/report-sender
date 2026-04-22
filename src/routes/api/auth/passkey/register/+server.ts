import { json } from '@sveltejs/kit';
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import {
	RP_NAME,
	getRpId,
	getPasskeyCredentials,
	savePasskeyCredential,
	saveChallenge,
	getChallenge,
	deleteChallenge
} from '$lib/auth/passkey';
import { bytesToBase64 } from '$lib/server/base64';

const REGISTER_KIND = 'passkey-register';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const existing = await getPasskeyCredentials(locals.db, user.id);
	const excludeCredentials = existing.map((c) => ({
		id: c.credential_id,
		type: 'public-key' as const
	}));

	const rpId = getRpId(url);
	const options = await generateRegistrationOptions({
		rpName: RP_NAME,
		rpID: rpId,
		userID: new TextEncoder().encode(user.id),
		userName: user.phone ?? user.email ?? user.id,
		attestationType: 'none',
		excludeCredentials,
		authenticatorSelection: {
			authenticatorAttachment: 'platform',
			requireResidentKey: true,
			userVerification: 'required'
		}
	});

	await saveChallenge(locals.db, REGISTER_KIND, user.id, options.challenge);
	return json(options);
};

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const challenge = await getChallenge(locals.db, REGISTER_KIND, user.id);
	if (!challenge) return json({ error: 'Challenge not found' }, { status: 400 });

	try {
		const body = await request.json();
		const verification = await verifyRegistrationResponse({
			response: body,
			expectedChallenge: challenge,
			expectedOrigin: url.origin,
			expectedRPID: getRpId(url),
			requireUserVerification: true
		});

		if (!verification.verified || !verification.registrationInfo) {
			return json({ error: '検証に失敗しました' }, { status: 400 });
		}

		const { credential } = verification.registrationInfo;
		await savePasskeyCredential(
			locals.db,
			user.id,
			credential.id,
			bytesToBase64(new Uint8Array(credential.publicKey)),
			credential.counter
		);

		await deleteChallenge(locals.db, REGISTER_KIND, user.id);
		return json({ success: true });
	} catch (e: any) {
		return json({ error: e.message }, { status: 400 });
	}
};
