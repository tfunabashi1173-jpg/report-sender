import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/guards';

type UserRow = {
	id: string;
	email: string | null;
	phone: string | null;
	loginId: string | null;
	displayName: string | null;
	organization: string | null;
	role: 'admin' | 'member';
	createdAt: string;
	passkeyCount: number | string;
};

async function adminCount(db: App.Locals['db']) {
	const row = await db.prepare("SELECT COUNT(*) AS count FROM profiles WHERE role = 'admin'").first<{ count: number | string }>();
	return Number(row?.count ?? 0);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const { user } = await requireAdmin(locals);
	const users = await locals.db
		.prepare(
			`SELECT users.id,
			        users.email,
			        users.phone,
			        users.login_id AS loginId,
			        profiles.display_name AS displayName,
			        profiles.organization,
			        profiles.role,
			        users.created_at AS createdAt,
			        COUNT(passkey_credentials.credential_id) AS passkeyCount
			 FROM users
			 INNER JOIN profiles ON profiles.id = users.id
			 LEFT JOIN passkey_credentials ON passkey_credentials.user_id = users.id
			 GROUP BY users.id
			 ORDER BY CASE profiles.role WHEN 'admin' THEN 0 ELSE 1 END,
			          profiles.display_name COLLATE NOCASE`
		)
		.all<UserRow>();

	return {
		currentUserId: user.id,
		status: url.searchParams.get('status'),
		users: (users.results ?? []).map((item) => ({
			...item,
			passkeyCount: Number(item.passkeyCount ?? 0)
		}))
	};
};

export const actions: Actions = {
	update: async ({ request, locals }) => {
		await requireAdmin(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '').trim();
		const displayName = String(form.get('displayName') ?? '').trim();
		const organization = String(form.get('organization') ?? '').trim();
		const role = String(form.get('role') ?? 'member') === 'admin' ? 'admin' : 'member';

		if (!id) return fail(400, { error: '更新対象が見つかりません' });
		if (!displayName) return fail(400, { error: 'ユーザー名は必須です' });

		const target = await locals.db.prepare('SELECT role FROM profiles WHERE id = ?1').bind(id).first<{ role: 'admin' | 'member' }>();
		if (!target) return fail(404, { error: 'ユーザーが見つかりません' });

		const duplicate = await locals.db
			.prepare('SELECT id FROM profiles WHERE display_name = ?1 AND id != ?2')
			.bind(displayName, id)
			.first<{ id: string }>();
		if (duplicate) return fail(409, { error: 'そのユーザー名は既に使われています' });

		if (target.role === 'admin' && role !== 'admin' && (await adminCount(locals.db)) <= 1) {
			return fail(400, { error: '最後の管理者は一般ユーザーに変更できません' });
		}

		await locals.db.batch([
			locals.db
				.prepare('UPDATE profiles SET display_name = ?1, organization = ?2, role = ?3 WHERE id = ?4')
				.bind(displayName, organization || null, role, id),
			locals.db.prepare('UPDATE users SET login_id = ?1 WHERE id = ?2').bind(displayName, id)
		]);

		redirect(303, '/dashboard/settings/users?status=saved');
	},
	delete: async ({ request, locals }) => {
		const { user } = await requireAdmin(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '').trim();
		if (!id) return fail(400, { error: '削除対象が見つかりません' });
		if (id === user.id) return fail(400, { error: 'ログイン中の自分自身は削除できません' });

		const target = await locals.db.prepare('SELECT role FROM profiles WHERE id = ?1').bind(id).first<{ role: 'admin' | 'member' }>();
		if (!target) return fail(404, { error: 'ユーザーが見つかりません' });
		if (target.role === 'admin' && (await adminCount(locals.db)) <= 1) {
			return fail(400, { error: '最後の管理者は削除できません' });
		}

		await locals.db.batch([
			locals.db.prepare('UPDATE app_settings SET updated_by = ?1 WHERE updated_by = ?2').bind(user.id, id),
			locals.db.prepare('UPDATE smtp_settings SET updated_by = ?1 WHERE updated_by = ?2').bind(user.id, id),
			locals.db.prepare('DELETE FROM sessions WHERE user_id = ?1').bind(id),
			locals.db.prepare('DELETE FROM passkey_credentials WHERE user_id = ?1').bind(id),
			locals.db.prepare('DELETE FROM invites WHERE created_by = ?1').bind(id),
			locals.db.prepare('DELETE FROM report_recipients WHERE report_id IN (SELECT id FROM reports WHERE created_by = ?1)').bind(id),
			locals.db.prepare('DELETE FROM reports WHERE created_by = ?1').bind(id),
			locals.db.prepare('DELETE FROM mail_templates WHERE created_by = ?1').bind(id),
			locals.db.prepare('DELETE FROM recipient_list_members WHERE list_id IN (SELECT id FROM recipient_lists WHERE created_by = ?1)').bind(id),
			locals.db.prepare('DELETE FROM recipient_lists WHERE created_by = ?1').bind(id),
			locals.db.prepare('DELETE FROM recipient_list_members WHERE contact_id IN (SELECT id FROM contacts WHERE created_by = ?1)').bind(id),
			locals.db.prepare('DELETE FROM contacts WHERE created_by = ?1').bind(id),
			locals.db.prepare('DELETE FROM profiles WHERE id = ?1').bind(id),
			locals.db.prepare('DELETE FROM users WHERE id = ?1').bind(id)
		]);

		redirect(303, '/dashboard/settings/users?status=deleted');
	}
};
