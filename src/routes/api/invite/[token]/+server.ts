import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createAdminClient } from '$lib/auth/admin';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { data, error } = await locals.supabase
		
		.from('invites')
		.select('id, display_name, phone, expires_at, used_at')
		.eq('token', params.token)
		.single();

	if (error || !data) return json({ error: '招待リンクが無効です' }, { status: 404 });
	if (data.used_at) return json({ error: 'この招待リンクは使用済みです' }, { status: 410 });
	if (new Date(data.expires_at) < new Date()) return json({ error: '招待リンクの有効期限が切れています' }, { status: 410 });

	return json({ valid: true, displayName: data.display_name, phone: data.phone });
};

export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
	const { displayName, phone } = await request.json();

	if (!displayName || !phone) {
		return json({ error: '名前と電話番号は必須です' }, { status: 400 });
	}

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

	// ユーザー作成（OTP不要）
	const normalized = phone.startsWith('+') ? phone : `+81${phone.replace(/^0/, '')}`;
	const { data: userData, error: createError } = await admin.auth.admin.createUser({
		phone: normalized,
		phone_confirm: true,
		user_metadata: { display_name: displayName }
	});

	if (createError) {
		// すでに存在する場合はユーザーを取得
		if (!createError.message.includes('already')) {
			return json({ error: createError.message }, { status: 400 });
		}
	}

	const userId = userData?.user?.id;
	if (!userId) return json({ error: 'ユーザー作成に失敗しました' }, { status: 500 });

	// profiles に登録
	await admin
		
		.from('profiles')
		.upsert({ id: userId, phone: normalized, display_name: displayName, role: 'member' });

	// 招待を使用済みにする
	await admin
		
		.from('invites')
		.update({ used_at: new Date().toISOString() })
		.eq('token', params.token);

	// セッション発行
	const { data: sessionData, error: sessionError } = await admin.auth.admin.createSession({ userId });
	if (sessionError || !sessionData) return json({ error: 'セッション作成に失敗しました' }, { status: 500 });

	return json({
		success: true,
		accessToken: sessionData.session.access_token,
		refreshToken: sessionData.session.refresh_token
	});
};
