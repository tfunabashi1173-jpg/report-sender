import type { PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, profile } = await requireDashboardUser(locals);

	const [contacts, lists, templates, sent, drafts, recentReports] = await Promise.all([
		locals.db
			.prepare('SELECT COUNT(*) AS count FROM contacts WHERE created_by = ?1')
			.bind(user.id)
			.first<{ count: number }>(),
		locals.db
			.prepare('SELECT COUNT(*) AS count FROM recipient_lists WHERE created_by = ?1')
			.bind(user.id)
			.first<{ count: number }>(),
		locals.db
			.prepare('SELECT COUNT(*) AS count FROM mail_templates WHERE created_by = ?1')
			.bind(user.id)
			.first<{ count: number }>(),
		locals.db
			.prepare("SELECT COUNT(*) AS count FROM reports WHERE created_by = ?1 AND status = 'sent'")
			.bind(user.id)
			.first<{ count: number }>(),
		locals.db
			.prepare("SELECT COUNT(*) AS count FROM reports WHERE created_by = ?1 AND status = 'draft'")
			.bind(user.id)
			.first<{ count: number }>(),
		locals.db
			.prepare(
				`SELECT id, subject, status, created_at AS createdAt, sent_at AS sentAt
				 FROM reports
				 WHERE created_by = ?1
				 ORDER BY datetime(updated_at) DESC
				 LIMIT 5`
			)
			.bind(user.id)
			.all<{ id: string; subject: string; status: 'draft' | 'sent'; createdAt: string; sentAt: string | null }>()
	]);

	const adminCount = (await locals.db
		.prepare("SELECT COUNT(*) AS count FROM profiles WHERE role = 'admin'")
		.first<{ count: number }>()
		.catch(() => ({ count: 0 })));

	return {
		profile,
		stats: {
			contacts: contacts?.count ?? 0,
			lists: lists?.count ?? 0,
			templates: templates?.count ?? 0,
			sent: sent?.count ?? 0,
			drafts: drafts?.count ?? 0,
			admins: adminCount?.count ?? 0
		},
		recentReports: recentReports.results ?? []
	};
};
