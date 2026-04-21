import { json } from '@sveltejs/kit';
import {
	generateAuthenticationOptions,
	verifyAuthenticationResponse
} from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import { RP_ID, updatePasskeyCounter } from '$lib/auth/passkey';
import { createServerClient } from '@supabase/ssr';

const challenges = new Map<string, string>();
const ANON_CHALLENGE_KEY = '__anon__';

export const GET: RequestHandler = async ({ locals, platform }) => {
	const options = await generateAuthenticationOptions({
		rpID: RP_ID,
		userVerification: 'required',
		allowCredentials: []
	});
	challenges.set(ANON_CHALLENGE_KEY, options.challenge);
	return json(options);
};

export const POST: RequestHandler = async ({ request, locals, platform, cookies }) => {
	const challenge = challenges.get(ANON_CHALLENGE_KEY);
	if (!challenge) return json({ error: 'Challenge expired' }, { status: 400 });

	const supabaseUrl = platform?.env.PUBLIC_SUPABASE_URL ?? '';
	const supabaseKey = platform?.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

	const supabase = createServerClient(supabaseUrl, supabaseKey, {
		db: { schema: 'report_sender' },
		cookies: {
			getAll: () => cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) =>
					cookies.set(name, value, { ...options, path: '/' })
				);
			}
		}
	});

	try {
		const body = await request.json();
		const credentialId = body.id;

		const { data: cred } = await supabase
			.from('passkey_credentials')
			.select('*')
			.eq('credential_id', credentialId)
			.single();

		if (!cred) return json({ error: 'Credential not found' }, { status: 404 });

		const verification = await verifyAuthenticationResponse({
			response: body,
			expectedChallenge: challenge,
			expectedOrigin: `https://${RP_ID}`,
			expectedRPID: RP_ID,
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

		await updatePasskeyCounter(supabase, credentialId, verification.authenticationInfo.newCounter);
		challenges.delete(ANON_CHALLENGE_KEY);

		// Supabase Admin APIでセッション発行（サービスロールキーが必要）
		// 暫定: user_idをレスポンスで返してクライアント側でセッション確立
		return json({ success: true, userId: cred.user_id });
	} catch (e: any) {
		return json({ error: e.message }, { status: 400 });
	}
};
