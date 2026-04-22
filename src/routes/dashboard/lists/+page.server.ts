import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await requireDashboardUser(locals);
	const [contacts, lists, members] = await Promise.all([
		locals.db
			.prepare(
				`SELECT id, name, email, organization
				 FROM contacts
				 WHERE created_by = ?1
				 ORDER BY CASE WHEN organization IS NULL OR organization = '' THEN 1 ELSE 0 END,
				          organization COLLATE NOCASE,
				          name COLLATE NOCASE`
			)
			.bind(user.id)
			.all<{ id: string; name: string; email: string; organization: string | null }>(),
		locals.db
			.prepare(
				`SELECT recipient_lists.id, recipient_lists.name, recipient_lists.description,
				        COUNT(recipient_list_members.contact_id) AS memberCount,
				        SUM(CASE WHEN recipient_list_members.kind = 'cc' THEN 1 ELSE 0 END) AS ccCount,
				        SUM(CASE WHEN recipient_list_members.kind != 'cc' THEN 1 ELSE 0 END) AS toCount
				 FROM recipient_lists
				 LEFT JOIN recipient_list_members ON recipient_list_members.list_id = recipient_lists.id
				 WHERE recipient_lists.created_by = ?1
				 GROUP BY recipient_lists.id
				 ORDER BY recipient_lists.name COLLATE NOCASE`
			)
			.bind(user.id)
			.all<{ id: string; name: string; description: string | null; memberCount: number; toCount: number | null; ccCount: number | null }>(),
		locals.db
			.prepare(
				`SELECT recipient_list_members.list_id AS listId,
				        recipient_list_members.kind,
				        contacts.id AS contactId,
				        contacts.name,
				        contacts.email,
				        contacts.organization
				 FROM recipient_list_members
				 INNER JOIN recipient_lists ON recipient_lists.id = recipient_list_members.list_id
				 INNER JOIN contacts ON contacts.id = recipient_list_members.contact_id
				 WHERE recipient_lists.created_by = ?1
				 ORDER BY recipient_list_members.kind DESC, contacts.name COLLATE NOCASE`
			)
			.bind(user.id)
			.all<{ listId: string; contactId: string; kind: 'to' | 'cc'; name: string; email: string; organization: string | null }>()
	]);

	return {
		contacts: contacts.results ?? [],
		lists: (lists.results ?? []).map((list) => ({
			...list,
			toCount: list.toCount ?? 0,
			ccCount: list.ccCount ?? 0
		})),
		members: members.results ?? []
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { user } = await requireDashboardUser(locals);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const description = String(form.get('description') ?? '').trim();
		if (!name) return fail(400, { error: 'リスト名は必須です' });

		const now = new Date().toISOString();
		await locals.db
			.prepare(
				`INSERT INTO recipient_lists (id, name, description, created_by, created_at, updated_at)
				 VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
			)
			.bind(crypto.randomUUID(), name, description || null, user.id, now, now)
			.run();
		redirect(303, '/dashboard/lists');
	},
	addMember: async ({ request, locals }) => {
		const { user } = await requireDashboardUser(locals);
		const form = await request.formData();
		const listId = String(form.get('listId') ?? '');
		const contactId = String(form.get('contactId') ?? '');
		const kind = String(form.get('kind') ?? 'to') === 'cc' ? 'cc' : 'to';
		if (!listId || !contactId) return fail(400, { error: '追加する連絡先を選択してください' });

		const ownsList = await locals.db
			.prepare('SELECT id FROM recipient_lists WHERE id = ?1 AND created_by = ?2')
			.bind(listId, user.id)
			.first();
		if (!ownsList) return fail(404, { error: 'リストが見つかりません' });

		await locals.db
			.prepare(
				`INSERT INTO recipient_list_members (list_id, contact_id, kind, created_at)
				 VALUES (?1, ?2, ?3, ?4)
				 ON CONFLICT(list_id, contact_id) DO UPDATE SET kind = excluded.kind`
			)
			.bind(listId, contactId, kind, new Date().toISOString())
			.run();
		redirect(303, '/dashboard/lists');
	},
	removeMember: async ({ request, locals }) => {
		const { user } = await requireDashboardUser(locals);
		const form = await request.formData();
		const listId = String(form.get('listId') ?? '');
		const contactId = String(form.get('contactId') ?? '');
		await locals.db
			.prepare(
				`DELETE FROM recipient_list_members
				 WHERE list_id IN (SELECT id FROM recipient_lists WHERE id = ?1 AND created_by = ?2)
				   AND contact_id = ?3`
			)
			.bind(listId, user.id, contactId)
			.run();
		redirect(303, '/dashboard/lists');
	},
	delete: async ({ request, locals }) => {
		const { user } = await requireDashboardUser(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		await locals.db.prepare('DELETE FROM recipient_lists WHERE id = ?1 AND created_by = ?2').bind(id, user.id).run();
		redirect(303, '/dashboard/lists');
	}
};
