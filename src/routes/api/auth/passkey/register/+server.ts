import { json } from '@sveltejs/kit';
import {
	generateRegistrationOptions,
	verifyRegistrationResponse
} from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import { RP_NAME, RP_ID, getPasskeyCredentials, savePasskeyCredential } from '$lib/auth/passkey';

const challenges = new Map<string, string>();

export const GET: RequestHandler = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const existing = await getPasskeyCredentials(locals.supabase, user.id);
	const excludeCredentials = existing.map((c) => ({
		id: c.credential_id,
		type: 'public-key' as const
	}));

	const options = await generateRegistrationOptions({
		rpName: RP_NAME,
		rpID: RP_ID,
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

	challenges.set(user.id, options.challenge);
	return json(options);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const challenge = challenges.get(user.id);
	if (!challenge) return json({ error: 'Challenge not found' }, { status: 400 });

	try {
		const body = await request.json();
		const verification = await verifyRegistrationResponse({
			response: body,
			expectedChallenge: challenge,
			expectedOrigin: `https://${RP_ID}`,
			expectedRPID: RP_ID,
			requireUserVerification: true
		});

		if (!verification.verified || !verification.registrationInfo) {
			return json({ error: '検証に失敗しました' }, { status: 400 });
		}

		const { credential } = verification.registrationInfo;
		await savePasskeyCredential(
			locals.supabase,
			user.id,
			credential.id,
			Buffer.from(credential.publicKey).toString('base64'),
			credential.counter
		);

		challenges.delete(user.id);
		return json({ success: true });
	} catch (e: any) {
		return json({ error: e.message }, { status: 400 });
	}
};
