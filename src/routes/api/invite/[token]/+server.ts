import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createAdminClient } from '$lib/auth/admin';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { data, error } = await locals.supabase
		.from('invites')
		.select('id, display_name, expires_at, used_at')
		.eq('token', params.token)
		.single();

	if (error || !data) return json({ error: '招待リンクが無効です' }, { status: 404 });
	if (data.used_at) return json({ error: 'この招待リンクは使用済みです' }, { status: 410 });
	if (new Date(data.expires_at) < new Date()) return json({ error: '招待リンクの有効期限が切れています' }, { status: 410 });

	return json({ valid: true, displayName: data.display_name });
};

export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
	const { displayName } = await request.json();

	if (!displayName) return json({ error: '名前は必須です' }, { status: 400 });

	const supabaseUrl = platform?.env.PUBLIC_SUPABASE_URL ?? '';
	const serviceRoleKey = platform?.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

	const { data: invite, error: inviteError } = await locals.supabase
		.from('invites')
		.select('id, expires_at, used_at')
		.eq('token', params.token)
		.single();

	if (inviteError || !invite) return json({ error: '招待リンクが無効です' }, { status: 404 });
	if (invite.used_at) return json({ error: 'この招待リンクは使用済みです' }, { status: 410 });
	if (new Date(invite.expires_at) < new Date()) return json({ error: '有効期限切れです' }, { status: 410 });

	const admin = createAdminClient(supabaseUrl, serviceRoleKey);

	// 電話番号不要：プレースホルダーメールでユーザー作成
	const placeholderEmail = `${crypto.randomUUID()}@report-sender.local`;
	const { data: userData, error: createError } = await admin.auth.admin.createUser({
		email: placeholderEmail,
		email_confirm: true,
		user_metadata: { display_name: displayName }
	});

	if (createError || !userData?.user) {
		return json({ error: createError?.message ?? 'ユーザー作成に失敗しました' }, { status: 500 });
	}

	const userId = userData.user.id;

	await admin.from('profiles').insert({ id: userId, display_name: displayName, role: 'member' });
	await admin.from('invites').update({ used_at: new Date().toISOString() }).eq('token', params.token);

	const { data: sessionData, error: sessionError } = await admin.auth.admin.createSession({ userId });
	if (sessionError || !sessionData) return json({ error: 'セッション作成に失敗しました' }, { status: 500 });

	return json({
		success: true,
		accessToken: sessionData.session.access_token,
		refreshToken: sessionData.session.refresh_token
	});
};
