import type { SupabaseClient } from '@supabase/supabase-js';

export const RP_NAME = '報告メール送信システム';
export const RP_ID =
	typeof window !== 'undefined' ? window.location.hostname : 'report-sender.donexus.workers.dev';

export async function getPasskeyCredentials(supabase: SupabaseClient, userId: string) {
	const { data, error } = await supabase
		.schema('report_sender')
		.from('passkey_credentials')
		.select('*')
		.eq('user_id', userId);
	if (error) throw error;
	return data ?? [];
}

export async function savePasskeyCredential(
	supabase: SupabaseClient,
	userId: string,
	credentialId: string,
	publicKey: string,
	counter: number,
	deviceName?: string
) {
	const { error } = await supabase
		.schema('report_sender')
		.from('passkey_credentials')
		.insert({ user_id: userId, credential_id: credentialId, public_key: publicKey, counter, device_name: deviceName });
	if (error) throw error;
}

export async function updatePasskeyCounter(
	supabase: SupabaseClient,
	credentialId: string,
	counter: number
) {
	const { error } = await supabase
		.schema('report_sender')
		.from('passkey_credentials')
		.update({ counter, last_used_at: new Date().toISOString() })
		.eq('credential_id', credentialId);
	if (error) throw error;
}
