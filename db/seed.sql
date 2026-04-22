-- Use only for manual testing. Replace placeholders before execution.
INSERT OR IGNORE INTO users (id, email, phone, login_id, password_hash, created_at)
VALUES (
	'ADMIN_USER_ID',
	'admin@report-sender.local',
	NULL,
	'admin',
	'REPLACE_WITH_HASH_FROM_PASSWORD_HELPER',
	datetime('now')
);

INSERT OR IGNORE INTO profiles (id, display_name, role, created_at)
VALUES ('ADMIN_USER_ID', '管理者', 'admin', datetime('now'));
