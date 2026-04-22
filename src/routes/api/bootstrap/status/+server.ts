import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const row = (await locals.db
		.prepare("SELECT COUNT(*) AS count FROM profiles WHERE role = 'admin'")
		.first()) as { count: number | string } | null;

	const adminCount = Number(row?.count ?? 0);
	return json({
		hasAdmin: adminCount > 0,
		adminCount
	});
};
