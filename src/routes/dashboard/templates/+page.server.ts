import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';

type TemplateRow = {
	id: string;
	name: string;
	subject: string;
	body: string;
	toListIdsJson: string;
	ccListIdsJson: string;
	updatedAt: string;
};

function parseListIds(value: string | null | undefined) {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
	} catch {
		return [];
	}
}

async function filterOwnedListIds(db: App.Locals['db'], userId: string, ids: string[]) {
	const uniqueIds = [...new Set(ids.filter(Boolean))];
	if (uniqueIds.length === 0) return [];

	const ownedIds: string[] = [];
	for (const id of uniqueIds) {
		const list = await db.prepare('SELECT id FROM recipient_lists WHERE id = ?1 AND created_by = ?2').bind(id, userId).first<{ id: string }>();
		if (list) ownedIds.push(list.id);
	}
	return ownedIds;
}

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await requireDashboardUser(locals);
	const [templates, lists] = await Promise.all([
		locals.db
			.prepare(
				`SELECT id, name, subject, body, to_list_ids AS toListIdsJson, cc_list_ids AS ccListIdsJson, updated_at AS updatedAt
				 FROM mail_templates
				 WHERE created_by = ?1
				 ORDER BY datetime(updated_at) DESC`
			)
			.bind(user.id)
			.all<TemplateRow>(),
		locals.db
			.prepare('SELECT id, name FROM recipient_lists WHERE created_by = ?1 ORDER BY name COLLATE NOCASE')
			.bind(user.id)
			.all<{ id: string; name: string }>()
	]);

	return {
		lists: lists.results ?? [],
		templates: (templates.results ?? []).map((template) => ({
			id: template.id,
			name: template.name,
			subject: template.subject,
			body: template.body,
			toListIds: parseListIds(template.toListIdsJson),
			ccListIds: parseListIds(template.ccListIdsJson),
			updatedAt: template.updatedAt
		}))
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const { user } = await requireDashboardUser(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '').trim();
		const name = String(form.get('name') ?? '').trim();
		const subject = String(form.get('subject') ?? '').trim();
		const body = String(form.get('body') ?? '').trim();
		const toListIds = await filterOwnedListIds(locals.db, user.id, form.getAll('toListIds').map(String));
		const ccListIds = await filterOwnedListIds(locals.db, user.id, form.getAll('ccListIds').map(String));
		if (!name || !subject || !body) return fail(400, { error: '名前・件名・本文は必須です' });

		const now = new Date().toISOString();
		if (id) {
			await locals.db
				.prepare(
					`UPDATE mail_templates
					 SET name = ?1, subject = ?2, body = ?3, to_list_ids = ?4, cc_list_ids = ?5, updated_at = ?6
					 WHERE id = ?7 AND created_by = ?8`
				)
				.bind(name, subject, body, JSON.stringify(toListIds), JSON.stringify(ccListIds), now, id, user.id)
				.run();
		} else {
			await locals.db
				.prepare(
					`INSERT INTO mail_templates (id, name, subject, body, to_list_ids, cc_list_ids, created_by, created_at, updated_at)
					 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
				)
				.bind(crypto.randomUUID(), name, subject, body, JSON.stringify(toListIds), JSON.stringify(ccListIds), user.id, now, now)
				.run();
		}

		redirect(303, '/dashboard/templates');
	},
	delete: async ({ request, locals }) => {
		const { user } = await requireDashboardUser(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		await locals.db.prepare('DELETE FROM mail_templates WHERE id = ?1 AND created_by = ?2').bind(id, user.id).run();
		redirect(303, '/dashboard/templates');
	}
};
