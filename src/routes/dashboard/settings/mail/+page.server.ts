import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	await requireAdmin(locals);
	const settings = await locals.db
		.prepare(
			`SELECT host, port, secure_mode AS secureMode, username,
			        from_email AS fromEmail, from_name AS fromName, reply_to AS replyTo, updated_at AS updatedAt
			 FROM smtp_settings
			 WHERE id = ?1`
		)
		.bind('default')
		.first<{
			host: string;
			port: number;
			secureMode: 'plain' | 'starttls' | 'tls';
			username: string | null;
			fromEmail: string;
			fromName: string | null;
			replyTo: string | null;
			updatedAt: string;
		}>();

	return { settings };
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const { user } = await requireAdmin(locals);
		const form = await request.formData();
		const host = String(form.get('host') ?? '').trim();
		const port = Number(form.get('port') ?? 0);
		const secureMode = String(form.get('secureMode') ?? '');
		const username = String(form.get('username') ?? '').trim();
		const password = String(form.get('password') ?? '').trim();
		const fromEmail = String(form.get('fromEmail') ?? '').trim();
		const fromName = String(form.get('fromName') ?? '').trim();
		const replyTo = String(form.get('replyTo') ?? '').trim();

		if (!host || !Number.isInteger(port) || port <= 0) {
			return fail(400, { error: 'SMTPホストとポートは必須です' });
		}
		if (secureMode !== 'plain' && secureMode !== 'starttls' && secureMode !== 'tls') {
			return fail(400, { error: '暗号化方式を選択してください' });
		}
		if (!fromEmail) {
			return fail(400, { error: '送信元メールアドレスは必須です' });
		}
		if (!fromEmail.includes('@') || (replyTo && !replyTo.includes('@'))) {
			return fail(400, { error: 'メールアドレスの形式を確認してください' });
		}

		const now = new Date().toISOString();
		await locals.db
			.prepare(
				`INSERT INTO smtp_settings
				 (id, host, port, secure_mode, username, password, from_email, from_name, reply_to, created_at, updated_at, updated_by)
				 VALUES ('default', ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9, ?10)
				 ON CONFLICT(id) DO UPDATE SET
				 host = excluded.host,
				 port = excluded.port,
				 secure_mode = excluded.secure_mode,
				 username = excluded.username,
				 password = COALESCE(NULLIF(excluded.password, ''), smtp_settings.password),
				 from_email = excluded.from_email,
				 from_name = excluded.from_name,
				 reply_to = excluded.reply_to,
				 updated_at = excluded.updated_at,
				 updated_by = excluded.updated_by`
			)
			.bind(host, port, secureMode, username || null, password, fromEmail, fromName || null, replyTo || null, now, user.id)
			.run();

		return { success: true };
	}
};
