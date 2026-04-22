ALTER TABLE users ADD COLUMN login_id TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_id ON users(login_id);
