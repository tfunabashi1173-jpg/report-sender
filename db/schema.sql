PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	email TEXT,
	phone TEXT,
	login_id TEXT,
	password_hash TEXT NOT NULL,
	created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_id ON users(login_id);

CREATE TABLE IF NOT EXISTS profiles (
	id TEXT PRIMARY KEY,
	display_name TEXT,
	role TEXT NOT NULL CHECK(role IN ('admin', 'member')),
	created_at TEXT NOT NULL,
	FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invites (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	token TEXT NOT NULL UNIQUE,
	display_name TEXT,
	phone TEXT,
	created_by TEXT NOT NULL,
	expires_at TEXT NOT NULL,
	used_at TEXT,
	created_at TEXT NOT NULL,
	FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);

CREATE TABLE IF NOT EXISTS passkey_credentials (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id TEXT NOT NULL,
	credential_id TEXT NOT NULL UNIQUE,
	public_key TEXT NOT NULL,
	counter INTEGER NOT NULL DEFAULT 0,
	device_name TEXT,
	last_used_at TEXT,
	created_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_passkey_user_id ON passkey_credentials(user_id);

CREATE TABLE IF NOT EXISTS sessions (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	expires_at TEXT NOT NULL,
	created_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS auth_challenges (
	kind TEXT NOT NULL,
	scope TEXT NOT NULL,
	challenge TEXT NOT NULL,
	expires_at TEXT NOT NULL,
	created_at TEXT NOT NULL,
	PRIMARY KEY (kind, scope)
);

CREATE INDEX IF NOT EXISTS idx_auth_challenges_expires_at ON auth_challenges(expires_at);

CREATE TABLE IF NOT EXISTS contacts (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	email TEXT NOT NULL,
	organization TEXT,
	note TEXT,
	created_by TEXT NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

CREATE TABLE IF NOT EXISTS recipient_lists (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT,
	created_by TEXT NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recipient_lists_created_by ON recipient_lists(created_by);

CREATE TABLE IF NOT EXISTS recipient_list_members (
	list_id TEXT NOT NULL,
	contact_id TEXT NOT NULL,
	created_at TEXT NOT NULL,
	PRIMARY KEY (list_id, contact_id),
	FOREIGN KEY (list_id) REFERENCES recipient_lists(id) ON DELETE CASCADE,
	FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recipient_list_members_contact_id ON recipient_list_members(contact_id);

CREATE TABLE IF NOT EXISTS mail_templates (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	subject TEXT NOT NULL,
	body TEXT NOT NULL,
	created_by TEXT NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mail_templates_created_by ON mail_templates(created_by);

CREATE TABLE IF NOT EXISTS reports (
	id TEXT PRIMARY KEY,
	subject TEXT NOT NULL,
	body TEXT NOT NULL,
	status TEXT NOT NULL CHECK(status IN ('draft', 'sent')),
	created_by TEXT NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	sent_at TEXT,
	FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

CREATE TABLE IF NOT EXISTS report_recipients (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	report_id TEXT NOT NULL,
	contact_id TEXT,
	name TEXT NOT NULL,
	email TEXT NOT NULL,
	created_at TEXT NOT NULL,
	FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
	FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_report_recipients_report_id ON report_recipients(report_id);
