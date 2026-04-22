import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, profile } = await requireDashboardUser(locals);
	const { results } = await locals.db
		.prepare(
			`SELECT id, name, email, organization, note, updated_at AS updatedAt
			 FROM contacts
			 WHERE created_by = ?1
			 ORDER BY name COLLATE NOCASE`
		)
		.bind(user.id)
		.all<{
			id: string;
			name: string;
			email: string;
			organization: string | null;
			note: string | null;
			updatedAt: string;
		}>();

	return { profile, contacts: results ?? [] };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { user } = await requireDashboardUser(locals);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const email = String(form.get('email') ?? '').trim();
		const organization = String(form.get('organization') ?? '').trim();
		const note = String(form.get('note') ?? '').trim();

		if (!name || !email) return fail(400, { error: '名前とメールアドレスは必須です' });
		if (!email.includes('@')) return fail(400, { error: 'メールアドレスの形式を確認してください' });

		const now = new Date().toISOString();
		await locals.db
			.prepare(
				`INSERT INTO contacts (id, name, email, organization, note, created_by, created_at, updated_at)
				 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
			)
			.bind(crypto.randomUUID(), name, email, organization || null, note || null, user.id, now, now)
			.run();

		return { success: true };
	},
	delete: async ({ request, locals }) => {
		const { user } = await requireDashboardUser(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		await locals.db.prepare('DELETE FROM contacts WHERE id = ?1 AND created_by = ?2').bind(id, user.id).run();
		return { success: true };
	}
};
