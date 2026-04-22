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
	})();

	try {
		await ensurePromise;
	} catch (e) {
		ensurePromise = null;
		throw e;
	}
}
