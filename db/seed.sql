-- Replace ADMIN_USER_ID with an existing user id if needed.
INSERT OR IGNORE INTO users (id, email, phone, created_at)
VALUES ('ADMIN_USER_ID', 'admin@report-sender.local', NULL, datetime('now'));

INSERT OR IGNORE INTO profiles (id, display_name, role, created_at)
VALUES ('ADMIN_USER_ID', '管理者', 'admin', datetime('now'));
