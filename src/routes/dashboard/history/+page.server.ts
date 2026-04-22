import type { PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await requireDashboardUser(locals);
	const { results } = await locals.db
		.prepare(
			`SELECT reports.id, reports.subject, reports.status, reports.created_at AS createdAt,
			        reports.sent_at AS sentAt, COUNT(report_recipients.id) AS recipientCount
			 FROM reports
			 LEFT JOIN report_recipients ON report_recipients.report_id = reports.id
			 WHERE reports.created_by = ?1
			 GROUP BY reports.id
			 ORDER BY datetime(reports.updated_at) DESC`
		)
		.bind(user.id)
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
