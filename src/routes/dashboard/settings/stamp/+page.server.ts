import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';

const SETTING_KEY = 'image_stamp_template';
const DEFAULT_TEMPLATE = '{name}\n{today}\n{floor}\n{%}';

export const load: PageServerLoad = async ({ locals, url }) => {
	await requireDashboardUser(locals);
	const setting = await locals.db
		.prepare('SELECT value FROM app_settings WHERE key = ?1')
		.bind(SETTING_KEY)
		.first<{ value: string }>();

	return {
		template: setting?.value ?? DEFAULT_TEMPLATE,
		status: url.searchParams.get('status')
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const { user } = await requireDashboardUser(locals);
		const form = await request.formData();
		const template = String(form.get('template') ?? '').trim();
		if (!template) return fail(400, { error: '画像に入れる内容は必須です' });

		const now = new Date().toISOString();
		await locals.db
			.prepare(
				`INSERT INTO app_settings (key, value, updated_at, updated_by)
				 VALUES (?1, ?2, ?3, ?4)
				 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`
			)
			.bind(SETTING_KEY, template, now, user.id)
			.run();

		redirect(303, '/dashboard/settings/stamp?status=saved');
	}
};
