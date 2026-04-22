import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const data = (await locals.db
		.prepare(
			`SELECT display_name AS displayName, phone, expires_at AS expiresAt, used_at AS usedAt
			 FROM invites
			 WHERE token = ?1`
		)
		.bind(params.token)
		.first()) as { displayName: string | null; phone: string | null; expiresAt: string; usedAt: string | null } | null;

	if (!data) return { token: params.token, error: '招待リンクが無効です' };
	if (data.usedAt) return { token: params.token, error: 'この招待リンクは使用済みです' };
	if (new Date(data.expiresAt) < new Date()) return { token: params.token, error: '招待リンクの有効期限が切れています' };

	return {
		token: params.token,
		inviteData: { displayName: data.displayName ?? '', phone: data.phone ?? '' }
	};
};
