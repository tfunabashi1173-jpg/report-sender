import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await requireDashboardUser(locals);
	const { results } = await locals.db
		.prepare(
			`SELECT id, name, subject, body, updated_at AS updatedAt
			 FROM mail_templates
			 WHERE created_by = ?1
			 ORDER BY datetime(updated_at) DESC`
		)
		.bind(user.id)
		.all<{ id: string; name: string; subject: string; body: string; updatedAt: string }>();

	return { templates: results ?? [] };
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const { user } = await requireDashboardUser(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '').trim();
		const name = String(form.get('name') ?? '').trim();
		const subject = String(form.get('subject') ?? '').trim();
		const body = String(form.get('body') ?? '').trim();
		if (!name || !subject || !body) return fail(400, { error: '名前・件名・本文は必須です' });

		const now = new Date().toISOString();
		if (id) {
			await locals.db
				.prepare(
					`UPDATE mail_templates
					 SET name = ?1, subject = ?2, body = ?3, updated_at = ?4
					 WHERE id = ?5 AND created_by = ?6`
				)
				.bind(name, subject, body, now, id, user.id)
				.run();
		} else {
			await locals.db
				.prepare(
					`INSERT INTO mail_templates (id, name, subject, body, created_by, created_at, updated_at)
					 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
				)
				.bind(crypto.randomUUID(), name, subject, body, user.id, now, now)
				.run();
		}

		return { success: true };
	},
	delete: async ({ request, locals }) => {
		const { user } = await requireDashboardUser(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		await locals.db.prepare('DELETE FROM mail_templates WHERE id = ?1 AND created_by = ?2').bind(id, user.id).run();
		return { success: true };
	}
};
