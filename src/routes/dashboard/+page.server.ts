import type { PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, profile } = await requireDashboardUser(locals);

	const recentReports = await locals.db
			.prepare(
				`SELECT id, subject, status, created_at AS createdAt, sent_at AS sentAt
				 FROM reports
				 WHERE created_by = ?1
				 ORDER BY datetime(updated_at) DESC
				 LIMIT 5`
			)
			.bind(user.id)
			.all<{ id: string; subject: string; status: 'draft' | 'sent'; createdAt: string; sentAt: string | null }>();

	return {
		profile,
		recentReports: recentReports.results ?? []
	};
};
