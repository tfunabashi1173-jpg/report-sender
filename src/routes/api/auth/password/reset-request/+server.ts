import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createResetToken, hashResetToken, PASSWORD_RESET_TTL_MINUTES, resetTokenExpiry } from '$lib/server/password-reset';
import { sendSystemMail } from '$lib/server/mailer';

const GENERIC_RESPONSE = {
	success: true,
	message: '入力内容が登録情報と一致した場合、パスワード再設定用URLをメール送信します。'
};

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const { displayName, email } = await request.json();
	if (typeof displayName !== 'string' || displayName.trim().length === 0) {
		return json({ error: '名前は必須です' }, { status: 400 });
	}
	if (typeof email !== 'string' || email.trim().length === 0 || !email.includes('@')) {
		return json({ error: 'メールアドレスを入力してください' }, { status: 400 });
	}

	const normalizedName = displayName.trim();
	const normalizedEmail = email.trim();
	const matched = await locals.db
		.prepare(
			`SELECT users.id AS userId, profiles.display_name AS displayName, contacts.email AS email
			 FROM users
			 INNER JOIN profiles ON profiles.id = users.id
			 INNER JOIN contacts ON contacts.name = profiles.display_name AND contacts.email = ?2
			 WHERE profiles.display_name = ?1
			 LIMIT 1`
		)
		.bind(normalizedName, normalizedEmail)
		.first<{ userId: string; displayName: string; email: string }>();

	if (!matched) return json(GENERIC_RESPONSE);

	const token = createResetToken();
	const tokenHash = await hashResetToken(token);
	const now = new Date().toISOString();
	const expiresAt = resetTokenExpiry();

	await locals.db.batch([
		locals.db
			.prepare('UPDATE password_reset_tokens SET used_at = ?1 WHERE user_id = ?2 AND used_at IS NULL')
			.bind(now, matched.userId),
		locals.db
			.prepare('INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?1, ?2, ?3, ?4, ?5)')
			.bind(crypto.randomUUID(), matched.userId, tokenHash, expiresAt, now)
	]);

	const resetUrl = `${url.origin}/reset-password/${encodeURIComponent(token)}`;
	try {
		await sendSystemMail(
			locals.db,
			{ name: matched.displayName, email: matched.email },
			'【Report Sender】ログインパスワード再設定',
			`Report Senderのログインパスワード再設定を受け付けました。\n\n以下のURLを開き、新しいログインパスワードを設定してください。\n${resetUrl}\n\nこのURLは一回限り有効です。期限は${PASSWORD_RESET_TTL_MINUTES}分です。\n心当たりがない場合、このメールは破棄してください。`
		);
	} catch (e) {
		console.error('Failed to send password reset mail', e);
	}

	return json(GENERIC_RESPONSE);
};
