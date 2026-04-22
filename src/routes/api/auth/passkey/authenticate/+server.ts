import { json } from '@sveltejs/kit';
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import {
	getRpId,
	getAllPasskeyCredentialIds,
	updatePasskeyCounter,
	getPasskeyCredentialById,
	saveChallenge,
	getChallenge,
	deleteChallenge
} from '$lib/auth/passkey';
import {
	clearAuthChallengeCookie,
	createSession,
	getAuthChallengeCookie,
	isSecureRequest,
	setAuthChallengeCookie,
	setSessionCookie
} from '$lib/server/auth';

const AUTH_KIND = 'passkey-auth';

export const GET: RequestHandler = async ({ locals, cookies, url }) => {
	const credentialIds = await getAllPasskeyCredentialIds(locals.db);
	if (credentialIds.length === 0) {
		return json({ error: 'パスキーが未登録です。名前とパスワードでログインしてください。' }, { status: 400 });
	}

	const options = await generateAuthenticationOptions({
		rpID: getRpId(url),
		userVerification: 'required',
		allowCredentials: credentialIds.map((id) => ({
			id,
			type: 'public-key',
			transports: ['internal']
		}))
	});

	const challengeScope = crypto.randomUUID();
	await saveChallenge(locals.db, AUTH_KIND, challengeScope, options.challenge);
	setAuthChallengeCookie(cookies, challengeScope, isSecureRequest(url));
	return json(options);
};

export const POST: RequestHandler = async ({ request, locals, cookies, url }) => {
	const challengeScope = getAuthChallengeCookie(cookies);
	if (!challengeScope) return json({ error: 'Challenge expired' }, { status: 400 });

	const challenge = await getChallenge(locals.db, AUTH_KIND, challengeScope);
	if (!challenge) {
		clearAuthChallengeCookie(cookies);
		return json({ error: 'Challenge expired' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const credentialId = body.id;
		const cred = await getPasskeyCredentialById(locals.db, credentialId);

		if (!cred) return json({ error: 'Credential not found' }, { status: 404 });

		const verification = await verifyAuthenticationResponse({
			response: body,
			expectedChallenge: challenge,
			expectedOrigin: url.origin,
			expectedRPID: getRpId(url),
			requireUserVerification: true,
			credential: {
				id: cred.credential_id,
				publicKey: Buffer.from(cred.public_key, 'base64'),
				counter: cred.counter
			}
		});

		if (!verification.verified) {
			return json({ error: '認証に失敗しました' }, { status: 401 });
		}

		await updatePasskeyCounter(locals.db, credentialId, verification.authenticationInfo.newCounter);
		await deleteChallenge(locals.db, AUTH_KIND, challengeScope);
		clearAuthChallengeCookie(cookies);

		const { sessionId, expiresAt } = await createSession(locals.db, cred.user_id);
		setSessionCookie(cookies, sessionId, expiresAt, isSecureRequest(url));
		return json({ success: true });
	} catch (e: any) {
		return json({ error: e.message }, { status: 400 });
	}
};
