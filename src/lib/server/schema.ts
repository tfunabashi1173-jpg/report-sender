import type { D1Database } from '@cloudflare/workers-types';

let ensurePromise: Promise<void> | null = null;

export async function ensureRuntimeSchema(db: D1Database) {
	if (ensurePromise) {
		return ensurePromise;
	}

	ensurePromise = (async () => {
		const { results } = await db
			.prepare("SELECT name FROM pragma_table_info('users')")
			.all<{ name: string }>();
		const names = new Set((results ?? []).map((r) => r.name));

		if (!names.has('password_hash')) {
			await db.prepare('ALTER TABLE users ADD COLUMN password_hash TEXT').run();
		}
		if (!names.has('login_id')) {
			await db.prepare('ALTER TABLE users ADD COLUMN login_id TEXT').run();
		}

		await db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_id ON users(login_id)').run();

		const profileColumns = await db.prepare("SELECT name FROM pragma_table_info('profiles')").all<{ name: string }>();
		const profileColumnNames = new Set((profileColumns.results ?? []).map((r) => r.name));
		if (!profileColumnNames.has('organization')) {
			await db.prepare('ALTER TABLE profiles ADD COLUMN organization TEXT').run();
		}

		await db
			.prepare(
				`CREATE TABLE IF NOT EXISTS contacts (
					id TEXT PRIMARY KEY,
					name TEXT NOT NULL,
					email TEXT NOT NULL,
					organization TEXT,
					note TEXT,
					created_by TEXT NOT NULL,
					created_at TEXT NOT NULL,
					updated_at TEXT NOT NULL,
					FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
				)`
			)
			.run();
		await db.prepare('CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by)').run();
		await db.prepare('CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)').run();

		await db
			.prepare(
				`CREATE TABLE IF NOT EXISTS recipient_lists (
					id TEXT PRIMARY KEY,
					name TEXT NOT NULL,
					description TEXT,
					created_by TEXT NOT NULL,
					created_at TEXT NOT NULL,
					updated_at TEXT NOT NULL,
					FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
				)`
			)
			.run();
		await db.prepare('CREATE INDEX IF NOT EXISTS idx_recipient_lists_created_by ON recipient_lists(created_by)').run();

		await db
			.prepare(
				`CREATE TABLE IF NOT EXISTS recipient_list_members (
					list_id TEXT NOT NULL,
					contact_id TEXT NOT NULL,
					created_at TEXT NOT NULL,
					PRIMARY KEY (list_id, contact_id),
					FOREIGN KEY (list_id) REFERENCES recipient_lists(id) ON DELETE CASCADE,
					FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
				)`
			)
			.run();
		await db
			.prepare('CREATE INDEX IF NOT EXISTS idx_recipient_list_members_contact_id ON recipient_list_members(contact_id)')
			.run();

		await db
			.prepare(
				`CREATE TABLE IF NOT EXISTS mail_templates (
					id TEXT PRIMARY KEY,
					name TEXT NOT NULL,
					subject TEXT NOT NULL,
					body TEXT NOT NULL,
					to_list_ids TEXT NOT NULL DEFAULT '[]',
					cc_list_ids TEXT NOT NULL DEFAULT '[]',
					created_by TEXT NOT NULL,
					created_at TEXT NOT NULL,
					updated_at TEXT NOT NULL,
					FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
				)`
			)
			.run();
		await db.prepare('CREATE INDEX IF NOT EXISTS idx_mail_templates_created_by ON mail_templates(created_by)').run();
		const templateColumns = await db.prepare("SELECT name FROM pragma_table_info('mail_templates')").all<{ name: string }>();
		const templateColumnNames = new Set((templateColumns.results ?? []).map((r) => r.name));
		if (!templateColumnNames.has('to_list_ids')) {
			await db.prepare("ALTER TABLE mail_templates ADD COLUMN to_list_ids TEXT NOT NULL DEFAULT '[]'").run();
		}
		if (!templateColumnNames.has('cc_list_ids')) {
			await db.prepare("ALTER TABLE mail_templates ADD COLUMN cc_list_ids TEXT NOT NULL DEFAULT '[]'").run();
		}

		await db
			.prepare(
				`CREATE TABLE IF NOT EXISTS reports (
					id TEXT PRIMARY KEY,
					subject TEXT NOT NULL,
					body TEXT NOT NULL,
					status TEXT NOT NULL CHECK(status IN ('draft', 'sent')),
					created_by TEXT NOT NULL,
					created_at TEXT NOT NULL,
					updated_at TEXT NOT NULL,
					sent_at TEXT,
					FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
				)`
			)
			.run();
		await db.prepare('CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by)').run();
		await db.prepare('CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status)').run();
		const reportColumns = await db.prepare("SELECT name FROM pragma_table_info('reports')").all<{ name: string }>();
		const reportColumnNames = new Set((reportColumns.results ?? []).map((r) => r.name));
		if (!reportColumnNames.has('delivery_status')) {
			await db.prepare("ALTER TABLE reports ADD COLUMN delivery_status TEXT NOT NULL DEFAULT 'not_sent'").run();
		}
		if (!reportColumnNames.has('delivery_error')) {
			await db.prepare('ALTER TABLE reports ADD COLUMN delivery_error TEXT').run();
		}
		if (!reportColumnNames.has('provider_message_id')) {
			await db.prepare('ALTER TABLE reports ADD COLUMN provider_message_id TEXT').run();
		}

		await db
			.prepare(
				`CREATE TABLE IF NOT EXISTS report_recipients (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					report_id TEXT NOT NULL,
					contact_id TEXT,
					name TEXT NOT NULL,
					email TEXT NOT NULL,
					created_at TEXT NOT NULL,
					FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
					FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
				)`
			)
			.run();
		await db.prepare('CREATE INDEX IF NOT EXISTS idx_report_recipients_report_id ON report_recipients(report_id)').run();
		const reportRecipientColumns = await db
			.prepare("SELECT name FROM pragma_table_info('report_recipients')")
			.all<{ name: string }>();
		const reportRecipientColumnNames = new Set((reportRecipientColumns.results ?? []).map((r) => r.name));
		if (!reportRecipientColumnNames.has('kind')) {
			await db.prepare("ALTER TABLE report_recipients ADD COLUMN kind TEXT NOT NULL DEFAULT 'to'").run();
		}

		await db
			.prepare(
				`CREATE TABLE IF NOT EXISTS smtp_settings (
					id TEXT PRIMARY KEY,
					host TEXT NOT NULL,
					port INTEGER NOT NULL,
					secure_mode TEXT NOT NULL CHECK(secure_mode IN ('plain', 'starttls', 'tls')),
					username TEXT,
					password TEXT,
					from_email TEXT NOT NULL,
					from_name TEXT,
					reply_to TEXT,
					signature TEXT,
					created_at TEXT NOT NULL,
					updated_at TEXT NOT NULL,
					updated_by TEXT NOT NULL,
					FOREIGN KEY (updated_by) REFERENCES users(id)
				)`
			)
			.run();
		const smtpColumns = await db.prepare("SELECT name FROM pragma_table_info('smtp_settings')").all<{ name: string }>();
		const smtpColumnNames = new Set((smtpColumns.results ?? []).map((r) => r.name));
		if (!smtpColumnNames.has('signature')) {
			await db.prepare('ALTER TABLE smtp_settings ADD COLUMN signature TEXT').run();
		}
	})();

	try {
		await ensurePromise;
	} catch (e) {
		ensurePromise = null;
		throw e;
	}
}
