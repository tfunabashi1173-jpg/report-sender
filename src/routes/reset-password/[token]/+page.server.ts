import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hashPassword } from '$lib/server/password';
import { hashResetToken } from '$lib/server/password-reset';

async function findToken(db: App.Locals['db'], token: string) {
	const tokenHash = await hashResetToken(token);
	return db
		.prepare(
			`SELECT password_reset_tokens.id AS id,
			        password_reset_tokens.user_id AS userId,
			        password_reset_tokens.expires_at AS expiresAt,
			        password_reset_tokens.used_at AS usedAt,
			        profiles.display_name AS displayName
			 FROM password_reset_tokens
			 INNER JOIN profiles ON profiles.id = password_reset_tokens.user_id
			 WHERE password_reset_tokens.token_hash = ?1
			 LIMIT 1`
		)
		.bind(tokenHash)
		.first<{ id: string; userId: string; expiresAt: string; usedAt: string | null; displayName: string | null }>();
}

function isUsable(row: { expiresAt: string; usedAt: string | null } | null) {
	return Boolean(row && !row.usedAt && new Date(row.expiresAt).getTime() > Date.now());
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const row = await findToken(locals.db, params.token);
	return {
		isValid: isUsable(row)
	};
};

export const actions: Actions = {
	default: async ({ params, request, locals }) => {
		const form = await request.formData();
		const password = String(form.get('password') ?? '');
		const passwordConfirm = String(form.get('passwordConfirm') ?? '');

		if (password.length < 8) return fail(400, { error: '新しいパスワードは8文字以上で入力してください' });
		if (password !== passwordConfirm) return fail(400, { error: '確認用パスワードが一致しません' });

		const row = await findToken(locals.db, params.token);
		if (!isUsable(row)) return fail(400, { error: '再設定URLが無効または期限切れです' });

		const now = new Date().toISOString();
		const passwordHash = await hashPassword(password);
		await locals.db.batch([
			locals.db.prepare('UPDATE users SET password_hash = ?1 WHERE id = ?2').bind(passwordHash, row!.userId),
			locals.db.prepare('UPDATE password_reset_tokens SET used_at = ?1 WHERE id = ?2 AND used_at IS NULL').bind(now, row!.id),
			locals.db.prepare('DELETE FROM passkey_credentials WHERE user_id = ?1').bind(row!.userId),
			locals.db.prepare('DELETE FROM sessions WHERE user_id = ?1').bind(row!.userId)
		]);

		redirect(303, '/login?reset=done');
	}
};
