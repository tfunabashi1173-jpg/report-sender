import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	await requireAdmin(locals);
	const settings = await locals.db
		.prepare('SELECT provider, from_email AS fromEmail, from_name AS fromName, reply_to AS replyTo, updated_at AS updatedAt FROM mail_settings WHERE id = ?1')
		.bind('default')
		.first<{
			provider: 'resend' | 'sendgrid';
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
		const provider = String(form.get('provider') ?? '');
		const apiKey = String(form.get('apiKey') ?? '').trim();
		const fromEmail = String(form.get('fromEmail') ?? '').trim();
		const fromName = String(form.get('fromName') ?? '').trim();
		const replyTo = String(form.get('replyTo') ?? '').trim();

		if (provider !== 'resend' && provider !== 'sendgrid') {
			return fail(400, { error: '送信サービスを選択してください' });
		}
		if (!apiKey || !fromEmail) {
			return fail(400, { error: 'APIキーと送信元メールアドレスは必須です' });
		}
		if (!fromEmail.includes('@') || (replyTo && !replyTo.includes('@'))) {
			return fail(400, { error: 'メールアドレスの形式を確認してください' });
		}

		const now = new Date().toISOString();
		await locals.db
			.prepare(
				`INSERT INTO mail_settings (id, provider, api_key, from_email, from_name, reply_to, created_at, updated_at, updated_by)
				 VALUES ('default', ?1, ?2, ?3, ?4, ?5, ?6, ?6, ?7)
				 ON CONFLICT(id) DO UPDATE SET
				 provider = excluded.provider,
				 api_key = excluded.api_key,
				 from_email = excluded.from_email,
				 from_name = excluded.from_name,
				 reply_to = excluded.reply_to,
				 updated_at = excluded.updated_at,
				 updated_by = excluded.updated_by`
			)
			.bind(provider, apiKey, fromEmail, fromName || null, replyTo || null, now, user.id)
			.run();

		return { success: true };
	}
};
