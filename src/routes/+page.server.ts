import type { PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';
import { deleteExpiredReports } from '$lib/server/reports';

export const load: PageServerLoad = async ({ locals }) => {
	const { profile } = await requireDashboardUser(locals);
	await deleteExpiredReports(locals.db);

	const recentReports = await locals.db
		.prepare(
			`SELECT id, subject, status, created_at AS createdAt, sent_at AS sentAt
			 FROM reports
			 WHERE datetime(COALESCE(sent_at, updated_at, created_at)) >= datetime('now', '-30 days')
			 ORDER BY datetime(updated_at) DESC
			 LIMIT 5`
		)
		.all<{ id: string; subject: string; status: 'draft' | 'sent'; createdAt: string; sentAt: string | null }>();

	return {
		profile,
		recentReports: recentReports.results ?? []
	};
};
