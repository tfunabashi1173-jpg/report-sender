import type { D1Database } from '@cloudflare/workers-types';

export type MailProvider = 'resend' | 'sendgrid';

export type MailSettings = {
	provider: MailProvider;
	api_key: string;
	from_email: string;
	from_name: string | null;
	reply_to: string | null;
};

export type MailRecipient = {
	name: string;
	email: string;
};

export async function getMailSettings(db: D1Database) {
	return (await db
		.prepare('SELECT provider, api_key, from_email, from_name, reply_to FROM mail_settings WHERE id = ?1')
		.bind('default')
		.first()) as MailSettings | null;
}

function fromHeader(settings: MailSettings) {
	if (!settings.from_name) return settings.from_email;
	return `${settings.from_name} <${settings.from_email}>`;
}

async function sendResend(settings: MailSettings, recipient: MailRecipient, subject: string, body: string) {
	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${settings.api_key}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: fromHeader(settings),
			to: [recipient.email],
			reply_to: settings.reply_to || undefined,
			subject,
			text: body
		})
	});
	const result = (await res.json().catch(() => ({}))) as { id?: string; message?: string; error?: string };
	if (!res.ok) throw new Error(result.message ?? result.error ?? `Resend送信エラー: ${res.status}`);
	return result.id ?? null;
}

async function sendSendGrid(settings: MailSettings, recipient: MailRecipient, subject: string, body: string) {
	const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${settings.api_key}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			personalizations: [{ to: [{ email: recipient.email, name: recipient.name }] }],
			from: { email: settings.from_email, name: settings.from_name || undefined },
			reply_to: settings.reply_to ? { email: settings.reply_to } : undefined,
			subject,
			content: [{ type: 'text/plain', value: body }]
		})
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(text || `SendGrid送信エラー: ${res.status}`);
	}
	return res.headers.get('x-message-id');
}

export async function sendReportMail(
	db: D1Database,
	recipients: MailRecipient[],
	subject: string,
	body: string
) {
	const settings = await getMailSettings(db);
	if (!settings) {
		throw new Error('送信メールのサーバー設定が未設定です');
	}
	if (recipients.length === 0) {
		throw new Error('送信先がありません');
	}

	const messageIds: string[] = [];
	for (const recipient of recipients) {
		const messageId =
			settings.provider === 'resend'
				? await sendResend(settings, recipient, subject, body)
				: await sendSendGrid(settings, recipient, subject, body);
		if (messageId) messageIds.push(messageId);
	}

	return {
		count: recipients.length,
		messageIds
	};
}
