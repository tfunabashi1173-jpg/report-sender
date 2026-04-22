import type { Socket } from 'cloudflare:sockets';
import type { D1Database } from '@cloudflare/workers-types';
import { bytesToBase64 } from '$lib/server/base64';

export type SmtpSettings = {
	host: string;
	port: number;
	secure_mode: 'plain' | 'starttls' | 'tls';
	username: string | null;
	password: string | null;
	from_email: string;
	from_name: string | null;
	reply_to: string | null;
	signature: string | null;
};

export type MailRecipient = {
	name: string;
	email: string;
	kind?: 'to' | 'cc';
};

export type MailAttachment = {
	fileName: string;
	contentType: string;
	bytes: Uint8Array;
};

export async function getSmtpSettings(db: D1Database) {
	return (await db
		.prepare('SELECT host, port, secure_mode, username, password, from_email, from_name, reply_to, signature FROM smtp_settings WHERE id = ?1')
		.bind('default')
		.first()) as SmtpSettings | null;
}

function encodeHeader(value: string) {
	if (/^[\x20-\x7e]*$/.test(value)) return value;
	return `=?UTF-8?B?${bytesToBase64(new TextEncoder().encode(value))}?=`;
}

function formatAddress(name: string | null | undefined, email: string) {
	return name ? `${encodeHeader(name)} <${email}>` : email;
}

function mailDomain(email: string) {
	return email.split('@')[1]?.trim().toLowerCase() || 'localhost';
}

function smtpIdentity(settings: SmtpSettings) {
	const domain = mailDomain(settings.from_email);
	if (domain !== 'localhost') return domain;
	return settings.host || 'localhost';
}

function formatDate(date: Date) {
	const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const pad = (value: number) => String(value).padStart(2, '0');
	const offsetMinutes = -date.getTimezoneOffset();
	const sign = offsetMinutes >= 0 ? '+' : '-';
	const absOffset = Math.abs(offsetMinutes);
	const zone = `${sign}${pad(Math.floor(absOffset / 60))}${pad(absOffset % 60)}`;
	return `${weekdays[date.getDay()]}, ${pad(date.getDate())} ${months[date.getMonth()]} ${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${zone}`;
}

function createMessageId(settings: SmtpSettings) {
	const id = `${Date.now()}.${crypto.randomUUID().replaceAll('-', '')}`;
	return `<${id}@${mailDomain(settings.from_email)}>`;
}

function formatMimeParameter(name: string, value: string) {
	if (/^[\x20-\x7e]*$/.test(value) && !/[()<>@,;:\\"/\[\]?=]/.test(value)) {
		return `${name}="${value}"`;
	}
	return `${name}*="UTF-8''${encodeURIComponent(value)}"`;
}

function normalizeNewlines(value: string) {
	return value.replace(/\r?\n/g, '\r\n');
}

function appendSignature(body: string, signature: string | null | undefined) {
	const trimmedSignature = signature?.trim();
	if (!trimmedSignature) return body;
	return `${body.trimEnd()}\n\n${trimmedSignature}`;
}

function foldBase64(value: string) {
	return value.match(/.{1,76}/g)?.join('\r\n') ?? '';
}

function buildMessage(
	settings: SmtpSettings,
	to: MailRecipient[],
	cc: MailRecipient[],
	subject: string,
	body: string,
	attachments: MailAttachment[]
) {
	const mixedBoundary = `mixed-${crypto.randomUUID()}`;
	const messageId = createMessageId(settings);
	const headers = [
		`Date: ${formatDate(new Date())}`,
		`Message-ID: ${messageId}`,
		`From: ${formatAddress(settings.from_name, settings.from_email)}`,
		`To: ${to.map((recipient) => formatAddress(recipient.name, recipient.email)).join(', ')}`,
		cc.length > 0 ? `Cc: ${cc.map((recipient) => formatAddress(recipient.name, recipient.email)).join(', ')}` : null,
		settings.reply_to ? `Reply-To: ${settings.reply_to}` : null,
		`Subject: ${encodeHeader(subject)}`,
		'MIME-Version: 1.0',
		'X-Mailer: Report Sender',
		`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`
	].filter(Boolean);

	const parts = [
		`--${mixedBoundary}`,
		'Content-Type: text/plain; charset=UTF-8',
		'Content-Transfer-Encoding: base64',
		'',
		foldBase64(bytesToBase64(new TextEncoder().encode(normalizeNewlines(appendSignature(body, settings.signature)))))
	];

	for (const attachment of attachments) {
		parts.push(
			`--${mixedBoundary}`,
			`Content-Type: ${attachment.contentType}; ${formatMimeParameter('name', attachment.fileName)}`,
			'Content-Transfer-Encoding: base64',
			`Content-Disposition: attachment; ${formatMimeParameter('filename', attachment.fileName)}`,
			'',
			foldBase64(bytesToBase64(attachment.bytes))
		);
	}
	parts.push(`--${mixedBoundary}--`, '');

	return {
		messageId,
		raw: `${headers.join('\r\n')}\r\n\r\n${parts.join('\r\n')}`
	};
}

class SmtpClient {
	private reader: ReadableStreamDefaultReader<Uint8Array>;
	private writer: WritableStreamDefaultWriter<Uint8Array>;
	private decoder = new TextDecoder();
	private encoder = new TextEncoder();
	private buffer = '';
	private socket: Socket;

	constructor(socket: Socket) {
		this.socket = socket;
		this.reader = socket.readable.getReader();
		this.writer = socket.writable.getWriter();
	}

	async close() {
		await this.writer.close().catch(() => undefined);
		await this.socket.close().catch(() => undefined);
	}

	private async readLine() {
		while (!this.buffer.includes('\n')) {
			const { value, done } = await this.reader.read();
			if (done) break;
			this.buffer += this.decoder.decode(value, { stream: true });
		}
		const index = this.buffer.indexOf('\n');
		if (index === -1) {
			const line = this.buffer;
			this.buffer = '';
			return line;
		}
		const line = this.buffer.slice(0, index + 1);
		this.buffer = this.buffer.slice(index + 1);
		return line;
	}

	async readResponse() {
		const lines: string[] = [];
		let code = 0;
		for (;;) {
			const line = await this.readLine();
			lines.push(line.trimEnd());
			code = Number(line.slice(0, 3));
			if (line.length < 4 || line[3] !== '-') break;
		}
		return { code, text: lines.join('\n') };
	}

	async command(command: string, expected: number[]) {
		await this.writer.write(this.encoder.encode(`${command}\r\n`));
		const response = await this.readResponse();
		if (!expected.includes(response.code)) {
			throw new Error(`SMTPエラー: ${response.text}`);
		}
		return response;
	}

	async writeData(message: string) {
		const escaped = message.replace(/^\./gm, '..');
		await this.writer.write(this.encoder.encode(`${escaped}\r\n.\r\n`));
		const response = await this.readResponse();
		if (response.code !== 250) throw new Error(`SMTP送信エラー: ${response.text}`);
	}
}

async function connectSmtp(settings: SmtpSettings) {
	const { connect } = await import('cloudflare:sockets');
	const identity = smtpIdentity(settings);
	const socket = connect(
		{ hostname: settings.host, port: settings.port },
		{ secureTransport: settings.secure_mode === 'tls' ? 'on' : 'off', allowHalfOpen: false }
	);
	await socket.opened;
	let client = new SmtpClient(socket);
	const greeting = await client.readResponse();
	if (greeting.code !== 220) throw new Error(`SMTP接続エラー: ${greeting.text}`);

	await client.command(`EHLO ${identity}`, [250]);
	if (settings.secure_mode === 'starttls') {
		await client.command('STARTTLS', [220]);
		const secureSocket = socket.startTls();
		await secureSocket.opened;
		client = new SmtpClient(secureSocket);
		await client.command(`EHLO ${identity}`, [250]);
	}
	return client;
}

async function authenticateSmtp(client: SmtpClient, settings: SmtpSettings) {
	if (!settings.username && !settings.password) return;
	if (!settings.username || !settings.password) {
		throw new Error('SMTPユーザー名とパスワードを両方設定してください');
	}
	await client.command('AUTH LOGIN', [334]);
	await client.command(bytesToBase64(new TextEncoder().encode(settings.username)), [334]);
	await client.command(bytesToBase64(new TextEncoder().encode(settings.password)), [235]);
}

export async function testSmtpConnection(db: D1Database) {
	const settings = await getSmtpSettings(db);
	if (!settings) throw new Error('SMTP送信設定が未設定です');

	const client = await connectSmtp(settings);
	try {
		await authenticateSmtp(client, settings);
		await client.command('QUIT', [221]);
	} finally {
		await client.close();
	}
}

export async function sendTestMail(db: D1Database, toEmail: string) {
	const settings = await getSmtpSettings(db);
	if (!settings) throw new Error('SMTP送信設定が未設定です');
	const recipient = {
		name: 'テスト送信',
		email: toEmail,
		kind: 'to' as const
	};
	const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
	return sendReportMail(
		db,
		[recipient],
		'【Report Sender】SMTPテストメール',
		`Report SenderからのSMTPテストメールです。\n\n送信日時: ${now}\n送信元: ${settings.from_email}\n\nこのメールが届いていれば、SMTP送信設定は動作しています。`
	);
}

export async function sendReportMail(
	db: D1Database,
	recipients: MailRecipient[],
	subject: string,
	body: string,
	attachments: MailAttachment[] = []
) {
	const settings = await getSmtpSettings(db);
	if (!settings) throw new Error('SMTP送信設定が未設定です');

	const to = recipients.filter((recipient) => (recipient.kind ?? 'to') === 'to');
	const cc = recipients.filter((recipient) => recipient.kind === 'cc');
	if (to.length === 0) throw new Error('メイン宛先を1件以上選択してください');

	const client = await connectSmtp(settings);
	try {
		await authenticateSmtp(client, settings);

		await client.command(`MAIL FROM:<${settings.from_email}>`, [250]);
		for (const recipient of [...to, ...cc]) {
			await client.command(`RCPT TO:<${recipient.email}>`, [250, 251]);
		}
		await client.command('DATA', [354]);
		const message = buildMessage(settings, to, cc, subject, body, attachments);
		await client.writeData(message.raw);
		await client.command('QUIT', [221]);
		return { count: to.length + cc.length, messageId: message.messageId };
	} finally {
		await client.close();
	}
}
