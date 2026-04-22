import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';

type Recipient = {
	id: string;
	name: string;
	email: string;
};

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await requireDashboardUser(locals);
	const [contacts, lists, templates] = await Promise.all([
		locals.db
			.prepare('SELECT id, name, email FROM contacts WHERE created_by = ?1 ORDER BY name COLLATE NOCASE')
			.bind(user.id)
			.all<Recipient>(),
		locals.db
			.prepare('SELECT id, name FROM recipient_lists WHERE created_by = ?1 ORDER BY name COLLATE NOCASE')
			.bind(user.id)
			.all<{ id: string; name: string }>(),
		locals.db
			.prepare('SELECT id, name, subject, body FROM mail_templates WHERE created_by = ?1 ORDER BY name COLLATE NOCASE')
			.bind(user.id)
			.all<{ id: string; name: string; subject: string; body: string }>()
	]);

	return {
		contacts: contacts.results ?? [],
		lists: lists.results ?? [],
		templates: templates.results ?? []
	};
};

async function resolveRecipients(
	db: App.Locals['db'],
	userId: string,
	contactIds: string[],
	listIds: string[]
) {
	const recipients = new Map<string, Recipient>();

	for (const contactId of contactIds) {
		const contact = await db
			.prepare('SELECT id, name, email FROM contacts WHERE id = ?1 AND created_by = ?2')
			.bind(contactId, userId)
			.first<Recipient>();
		if (contact) recipients.set(contact.id, contact);
	}

	for (const listId of listIds) {
		const { results } = await db
			.prepare(
				`SELECT contacts.id, contacts.name, contacts.email
				 FROM recipient_list_members
				 INNER JOIN recipient_lists ON recipient_lists.id = recipient_list_members.list_id
				 INNER JOIN contacts ON contacts.id = recipient_list_members.contact_id
				 WHERE recipient_lists.id = ?1 AND recipient_lists.created_by = ?2`
			)
			.bind(listId, userId)
			.all<Recipient>();
		for (const contact of results ?? []) {
			recipients.set(contact.id, contact);
		}
	}

	return [...recipients.values()];
}

async function saveReport(request: Request, locals: App.Locals, status: 'draft' | 'sent') {
	const { user } = await requireDashboardUser(locals);
	const form = await request.formData();
	const subject = String(form.get('subject') ?? '').trim();
	const body = String(form.get('body') ?? '').trim();
	const contactIds = form.getAll('contactIds').map(String).filter(Boolean);
	const listIds = form.getAll('listIds').map(String).filter(Boolean);

	if (!subject || !body) return fail(400, { error: '件名と本文は必須です' });

	const recipients = await resolveRecipients(locals.db, user.id, contactIds, listIds);
	if (status === 'sent' && recipients.length === 0) {
		return fail(400, { error: '送信先を1件以上選択してください' });
	}

	const now = new Date().toISOString();
	const reportId = crypto.randomUUID();
	await locals.db
		.prepare(
			`INSERT INTO reports (id, subject, body, status, created_by, created_at, updated_at, sent_at)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
		)
		.bind(reportId, subject, body, status, user.id, now, now, status === 'sent' ? now : null)
		.run();

	for (const recipient of recipients) {
		await locals.db
			.prepare(
				`INSERT INTO report_recipients (report_id, contact_id, name, email, created_at)
				 VALUES (?1, ?2, ?3, ?4, ?5)`
			)
			.bind(reportId, recipient.id, recipient.name, recipient.email, now)
			.run();
	}

	redirect(303, `/dashboard/history/${reportId}`);
}

export const actions: Actions = {
	draft: async ({ request, locals }) => saveReport(request, locals, 'draft'),
	send: async ({ request, locals }) => saveReport(request, locals, 'sent')
};
