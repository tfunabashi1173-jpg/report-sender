import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createAdminClient } from '$lib/auth/admin';

export const POST: RequestHandler = async ({ request, locals, platform, url }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	// 管理者チェック
	const { data: profile } = await locals.supabase
		
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();

	if (profile?.role !== 'admin') {
		return json({ error: '管理者のみ招待リンクを作成できます' }, { status: 403 });
	}

	const { displayName, phone } = await request.json();

	const supabaseUrl = platform?.env.PUBLIC_SUPABASE_URL ?? '';
	const serviceRoleKey = platform?.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
	const admin = createAdminClient(supabaseUrl, serviceRoleKey);

	const token = crypto.randomUUID();
	const { error } = await admin
		
		.from('invites')
		.insert({
			token,
			display_name: displayName || null,
			phone: phone || null,
			created_by: user.id
		});

	if (error) return json({ error: error.message }, { status: 500 });

	const origin = url.origin;
	return json({ url: `${origin}/invite/${token}` });
};
