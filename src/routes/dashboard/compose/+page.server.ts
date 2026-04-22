import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';
import { getSmtpSettings, sendReportMail, type MailAttachment } from '$lib/server/mailer';

type Recipient = {
	id: string;
	name: string;
	email: string;
	organization: string | null;
};

export const load: PageServerLoad = async ({ locals }) => {
	const { user, profile } = await requireDashboardUser(locals);
	const [contacts, lists, templates, mailSettings, siteSetting] = await Promise.all([
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
			.all<Recipient>(),
		locals.db
			.prepare('SELECT id, name FROM recipient_lists WHERE created_by = ?1 ORDER BY name COLLATE NOCASE')
			.bind(user.id)
			.all<{ id: string; name: string }>(),
		locals.db
			.prepare(
				`SELECT id, name, subject, body, to_list_ids AS toListIdsJson, cc_list_ids AS ccListIdsJson
				 FROM mail_templates
				 WHERE created_by = ?1
				 ORDER BY name COLLATE NOCASE`
			)
			.bind(user.id)
			.all<{ id: string; name: string; subject: string; body: string; toListIdsJson: string; ccListIdsJson: string }>(),
		getSmtpSettings(locals.db),
		locals.db.prepare("SELECT value FROM app_settings WHERE key = 'site_name'").first<{ value: string }>()
	]);

	return {
		siteName: siteSetting?.value ?? '',
		userName: profile?.displayName ?? user.displayName ?? '',
		contacts: contacts.results ?? [],
		lists: lists.results ?? [],
		templates: (templates.results ?? []).map((template) => ({
			id: template.id,
			name: template.name,
			subject: template.subject,
			body: template.body,
			toListIds: parseTemplateListIds(template.toListIdsJson),
			ccListIds: parseTemplateListIds(template.ccListIdsJson)
		})),
		mailConfigured: Boolean(mailSettings)
	};
};

function parseTemplateListIds(value: string | null | undefined) {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
	} catch {
		return [];
	}
}

async function resolveRecipients(
	db: App.Locals['db'],
	userId: string,
	contactIds: string[],
	listIds: string[],
	listMemberKind?: 'to' | 'cc'
) {
	const recipients = new Map<string, Recipient>();

	for (const contactId of contactIds) {
		const contact = await db
			.prepare('SELECT id, name, email, organization FROM contacts WHERE id = ?1 AND created_by = ?2')
			.bind(contactId, userId)
			.first<Recipient>();
		if (contact) recipients.set(contact.id, contact);
	}

	for (const listId of listIds) {
		const kindFilter = listMemberKind ? 'AND recipient_list_members.kind = ?3' : '';
		const { results } = await db
			.prepare(
				`SELECT contacts.id, contacts.name, contacts.email, contacts.organization
				 FROM recipient_list_members
				 INNER JOIN recipient_lists ON recipient_lists.id = recipient_list_members.list_id
				 INNER JOIN contacts ON contacts.id = recipient_list_members.contact_id
				 WHERE recipient_lists.id = ?1 AND recipient_lists.created_by = ?2 ${kindFilter}`
			)
			.bind(...(listMemberKind ? [listId, userId, listMemberKind] : [listId, userId]))
			.all<Recipient>();
		for (const contact of results ?? []) {
			recipients.set(contact.id, contact);
		}
	}

	return [...recipients.values()];
}

function uniqueRecipients(recipients: Recipient[]) {
	const merged = new Map<string, Recipient>();
	for (const recipient of recipients) merged.set(recipient.email.toLowerCase(), recipient);
	return [...merged.values()];
}

function mergeRecipients(to: Recipient[], cc: Recipient[]) {
	const merged = new Map<string, Recipient & { kind: 'to' | 'cc' }>();
	for (const recipient of to) {
		merged.set(recipient.email.toLowerCase(), { ...recipient, kind: 'to' });
	}
	for (const recipient of cc) {
		const key = recipient.email.toLowerCase();
		if (!merged.has(key)) merged.set(key, { ...recipient, kind: 'cc' });
	}
	return [...merged.values()];
}

async function collectAttachments(form: FormData) {
	const files = form.getAll('attachments').filter((value): value is File => value instanceof File && value.size > 0);
	const attachments: MailAttachment[] = [];
	for (const file of files) {
		if (!isImageAttachment(file)) continue;
		attachments.push({
			fileName: file.name,
			contentType: file.type || 'application/octet-stream',
			bytes: new Uint8Array(await file.arrayBuffer())
		});
	}
	return attachments;
}

function isImageAttachment(file: File) {
	if (file.type.startsWith('image/')) return true;
	return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);
}

async function saveReport(
	request: Request,
	locals: App.Locals,
	status: 'draft' | 'sent'
) {
	const { user } = await requireDashboardUser(locals);
	const form = await request.formData();
	let subject = String(form.get('subject') ?? '').trim();
	let body = String(form.get('body') ?? '').trim();
	const toContactIds = form.getAll('toContactIds').map(String).filter(Boolean);
	const toListIds = form.getAll('toListIds').map(String).filter(Boolean);
	const ccContactIds = form.getAll('ccContactIds').map(String).filter(Boolean);
	const ccListIds = form.getAll('ccListIds').map(String).filter(Boolean);

	if (!subject || !body) return fail(400, { error: '件名と本文は必須です' });

	const siteSetting = await locals.db.prepare("SELECT value FROM app_settings WHERE key = 'site_name'").first<{ value: string }>();
	const siteName = siteSetting?.value ?? '';
	subject = subject.replaceAll('{site}', siteName).replaceAll('{{site}}', siteName);
	body = body.replaceAll('{site}', siteName).replaceAll('{{site}}', siteName);

	const toRecipients = await resolveRecipients(locals.db, user.id, toContactIds, toListIds, 'to');
	const ccRecipients = uniqueRecipients([
		...(await resolveRecipients(locals.db, user.id, [], toListIds, 'cc')),
		...(await resolveRecipients(locals.db, user.id, ccContactIds, ccListIds))
	]);
	const recipients = mergeRecipients(toRecipients, ccRecipients);
	if (status === 'sent' && toRecipients.length === 0) {
		return fail(400, { error: 'メイン宛先を1件以上選択してください' });
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
				`INSERT INTO report_recipients (report_id, contact_id, name, email, kind, created_at)
				 VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
			)
			.bind(reportId, recipient.id, recipient.name, recipient.email, recipient.kind, now)
			.run();
	}

	if (status === 'sent') {
		try {
			const attachments = await collectAttachments(form);
			const result = await sendReportMail(locals.db, recipients, subject, body, attachments, { actorUserId: user.id });
			await locals.db
				.prepare(
					`UPDATE reports
					 SET delivery_status = 'sent', provider_message_id = ?1, sent_at = ?2, updated_at = ?2
					 WHERE id = ?3 AND created_by = ?4`
				)
				.bind(result.messageId, new Date().toISOString(), reportId, user.id)
				.run();
		} catch (e: any) {
			await locals.db
				.prepare(
					`UPDATE reports
					 SET status = 'draft', delivery_status = 'failed', delivery_error = ?1, updated_at = ?2
					 WHERE id = ?3 AND created_by = ?4`
				)
				.bind(e?.message ?? '送信に失敗しました', new Date().toISOString(), reportId, user.id)
				.run();
			return fail(400, { error: e?.message ?? '送信に失敗しました' });
		}
	}

	if (status === 'sent') redirect(303, '/dashboard/compose/sent');
	redirect(303, `/dashboard/history/${reportId}`);
}

export const actions: Actions = {
	draft: async ({ request, locals }) => saveReport(request, locals, 'draft'),
	send: async ({ request, locals }) => saveReport(request, locals, 'sent')
};
