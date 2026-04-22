import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { user, profile } = await requireDashboardUser(locals);
	const sort = url.searchParams.get('sort') === 'organization' ? 'organization' : 'name';
	const orderBy =
		sort === 'organization'
			? `CASE WHEN organization IS NULL OR organization = '' THEN 1 ELSE 0 END,
			   organization COLLATE NOCASE,
			   name COLLATE NOCASE`
			: 'name COLLATE NOCASE';
	const { results } = await locals.db
		.prepare(
			`SELECT id, name, email, organization, note, updated_at AS updatedAt
			 FROM contacts
			 WHERE created_by = ?1
			 ORDER BY ${orderBy}`
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

	return { profile, contacts: results ?? [], sort };
};

export const actions: Actions = {
	create: async ({ request, locals, url }) => {
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

		redirect(303, `/dashboard/contacts${url.search}`);
	},
	update: async ({ request, locals, url }) => {
		const { user } = await requireDashboardUser(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '').trim();
		const name = String(form.get('name') ?? '').trim();
		const email = String(form.get('email') ?? '').trim();
		const organization = String(form.get('organization') ?? '').trim();
		const note = String(form.get('note') ?? '').trim();

		if (!id) return fail(400, { error: '更新対象が見つかりません' });
		if (!name || !email) return fail(400, { error: '名前とメールアドレスは必須です' });
		if (!email.includes('@')) return fail(400, { error: 'メールアドレスの形式を確認してください' });

		const result = await locals.db
			.prepare(
				`UPDATE contacts
				 SET name = ?1, email = ?2, organization = ?3, note = ?4, updated_at = ?5
				 WHERE id = ?6 AND created_by = ?7`
			)
			.bind(name, email, organization || null, note || null, new Date().toISOString(), id, user.id)
			.run();

		if (result.meta.changes === 0) return fail(404, { error: '連絡先が見つかりません' });

		redirect(303, `/dashboard/contacts${url.search}`);
	},
	delete: async ({ request, locals, url }) => {
		const { user } = await requireDashboardUser(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		await locals.db.prepare('DELETE FROM contacts WHERE id = ?1 AND created_by = ?2').bind(id, user.id).run();
		redirect(303, `/dashboard/contacts${url.search}`);
	}
};
