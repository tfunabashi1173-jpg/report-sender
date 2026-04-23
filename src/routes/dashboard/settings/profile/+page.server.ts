import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { user, profile } = await requireDashboardUser(locals);
	return {
		user,
		profile,
		status: url.searchParams.get('status')
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const { user } = await requireDashboardUser(locals);
		const form = await request.formData();
		const displayName = String(form.get('displayName') ?? '').trim();
		const organization = String(form.get('organization') ?? '').trim();

		if (!displayName) return fail(400, { error: 'ログインユーザー名は必須です' });
		if (!organization) return fail(400, { error: '所属は必須です' });

		const existing = await locals.db
			.prepare('SELECT id FROM profiles WHERE display_name = ?1 AND id != ?2')
			.bind(displayName, user.id)
			.first<{ id: string }>();
		if (existing) return fail(409, { error: 'そのログインユーザー名は既に使われています' });

		await locals.db.batch([
			locals.db
				.prepare('UPDATE profiles SET display_name = ?1, organization = ?2 WHERE id = ?3')
				.bind(displayName, organization, user.id),
			locals.db.prepare('UPDATE users SET login_id = ?1 WHERE id = ?2').bind(displayName, user.id)
		]);

		redirect(303, '/dashboard/settings/profile?status=saved');
	}
};
