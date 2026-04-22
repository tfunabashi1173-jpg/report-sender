import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';
import { getSmtpSettings, sendReportMail } from '$lib/server/mailer';
import { deleteExpiredReports } from '$lib/server/reports';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = await requireDashboardUser(locals);
	await deleteExpiredReports(locals.db, user.id);
	const report = await locals.db
		.prepare(
			`SELECT id, subject, body, status, created_at AS createdAt, sent_at AS sentAt,
			        delivery_status AS deliveryStatus, delivery_error AS deliveryError
			 FROM reports
			 WHERE id = ?1 AND created_by = ?2`
		)
		.bind(params.id, user.id)
		.first<{
			id: string;
			subject: string;
			body: string;
			status: 'draft' | 'sent';
			createdAt: string;
			sentAt: string | null;
			deliveryStatus: string;
			deliveryError: string | null;
		}>();

	if (!report) error(404, '報告が見つかりません');

	const { results } = await locals.db
		.prepare('SELECT name, email, kind FROM report_recipients WHERE report_id = ?1 ORDER BY kind DESC, name COLLATE NOCASE')
		.bind(report.id)
		.all<{ name: string; email: string; kind: 'to' | 'cc' }>();

	return {
		report,
		recipients: results ?? [],
		mailConfigured: Boolean(await getSmtpSettings(locals.db))
	};
};

export const actions: Actions = {
	sendNow: async ({ params, locals }) => {
		const { user } = await requireDashboardUser(locals);
		const report = await locals.db
			.prepare('SELECT subject, body FROM reports WHERE id = ?1 AND created_by = ?2')
			.bind(params.id, user.id)
			.first<{ subject: string; body: string }>();
		if (!report) error(404, '報告が見つかりません');
		const recipients =
			(
				await locals.db
					.prepare('SELECT name, email, kind FROM report_recipients WHERE report_id = ?1')
					.bind(params.id)
					.all<{ name: string; email: string; kind: 'to' | 'cc' }>()
			).results ?? [];

		const now = new Date().toISOString();
		try {
			const result = await sendReportMail(locals.db, recipients, report.subject, report.body);
			await locals.db
				.prepare(
					`UPDATE reports
					 SET status = 'sent', delivery_status = 'sent', delivery_error = NULL,
					     provider_message_id = ?1, sent_at = ?2, updated_at = ?2
					 WHERE id = ?3 AND created_by = ?4`
				)
				.bind(result.messageId, now, params.id, user.id)
				.run();
		} catch (e: any) {
			await locals.db
				.prepare(
					`UPDATE reports
					 SET delivery_status = 'failed', delivery_error = ?1, updated_at = ?2
					 WHERE id = ?3 AND created_by = ?4`
				)
				.bind(e?.message ?? '送信に失敗しました', now, params.id, user.id)
				.run();
		}
		redirect(303, `/dashboard/history/${params.id}`);
	},
	delete: async ({ params, locals }) => {
		const { user } = await requireDashboardUser(locals);
		await locals.db.prepare('DELETE FROM reports WHERE id = ?1 AND created_by = ?2').bind(params.id, user.id).run();
		redirect(303, '/dashboard/history');
	}
};
