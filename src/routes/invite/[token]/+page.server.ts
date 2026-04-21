import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { data, error } = await locals.supabase
		.schema('report_sender')
		.from('invites')
		.select('display_name, phone, expires_at, used_at')
		.eq('token', params.token)
		.single();

	if (error || !data) return { token: params.token, error: '招待リンクが無効です' };
	if (data.used_at) return { token: params.token, error: 'この招待リンクは使用済みです' };
	if (new Date(data.expires_at) < new Date()) return { token: params.token, error: '招待リンクの有効期限が切れています' };

	return {
		token: params.token,
		inviteData: { displayName: data.display_name ?? '', phone: data.phone ?? '' }
	};
};
