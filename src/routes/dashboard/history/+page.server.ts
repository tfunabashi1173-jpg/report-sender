import type { PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';
import { deleteExpiredReports } from '$lib/server/reports';

export const load: PageServerLoad = async ({ locals }) => {
	await requireDashboardUser(locals);
	await deleteExpiredReports(locals.db);
	const { results } = await locals.db
		.prepare(
			`SELECT reports.id, reports.subject, reports.status, reports.created_at AS createdAt,
			        reports.sent_at AS sentAt, COUNT(report_recipients.id) AS recipientCount
			 FROM reports
			 LEFT JOIN report_recipients ON report_recipients.report_id = reports.id
			 WHERE datetime(COALESCE(reports.sent_at, reports.updated_at, reports.created_at)) >= datetime('now', '-30 days')
			 GROUP BY reports.id
			 ORDER BY datetime(reports.updated_at) DESC`
		)
		.all<{
			id: string;
			subject: string;
			status: 'draft' | 'sent';
			createdAt: string;
			sentAt: string | null;
			recipientCount: number;
		}>();

	return { reports: results ?? [] };
};
