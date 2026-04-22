import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = await requireDashboardUser(locals);
	const report = await locals.db
		.prepare(
			`SELECT id, subject, body, status, created_at AS createdAt, sent_at AS sentAt
			 FROM reports
			 WHERE id = ?1 AND created_by = ?2`
		)
		.bind(params.id, user.id)
		.first<{ id: string; subject: string; body: string; status: 'draft' | 'sent'; createdAt: string; sentAt: string | null }>();

	if (!report) error(404, '報告が見つかりません');

	const { results } = await locals.db
		.prepare('SELECT name, email FROM report_recipients WHERE report_id = ?1 ORDER BY name COLLATE NOCASE')
		.bind(report.id)
		.all<{ name: string; email: string }>();

	return { report, recipients: results ?? [] };
};

export const actions: Actions = {
	markSent: async ({ params, locals }) => {
		const { user } = await requireDashboardUser(locals);
		const now = new Date().toISOString();
		await locals.db
			.prepare(
				`UPDATE reports
				 SET status = 'sent', sent_at = ?1, updated_at = ?1
				 WHERE id = ?2 AND created_by = ?3`
			)
			.bind(now, params.id, user.id)
			.run();
		redirect(303, `/dashboard/history/${params.id}`);
	},
	delete: async ({ params, locals }) => {
		const { user } = await requireDashboardUser(locals);
		await locals.db.prepare('DELETE FROM reports WHERE id = ?1 AND created_by = ?2').bind(params.id, user.id).run();
		redirect(303, '/dashboard/history');
	}
};
