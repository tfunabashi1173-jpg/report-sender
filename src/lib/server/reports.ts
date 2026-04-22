import type { D1Database } from '@cloudflare/workers-types';

export const REPORT_RETENTION_DAYS = 30;

function retentionCutoffIso() {
	return new Date(Date.now() - REPORT_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export async function deleteExpiredReports(db: D1Database) {
	const cutoff = retentionCutoffIso();
	const oldReports = `SELECT id FROM reports WHERE datetime(COALESCE(sent_at, updated_at, created_at)) < datetime(?1)`;

	await db
		.prepare(`DELETE FROM report_recipients WHERE report_id IN (${oldReports})`)
		.bind(cutoff)
		.run();

	const attachmentTable = await db
		.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'report_attachments'")
		.first<{ name: string }>();
	if (attachmentTable) {
		await db
			.prepare(`DELETE FROM report_attachments WHERE report_id IN (${oldReports})`)
			.bind(cutoff)
			.run();
	}

	await db
		.prepare(`DELETE FROM reports WHERE id IN (${oldReports})`)
		.bind(cutoff)
		.run();
}
