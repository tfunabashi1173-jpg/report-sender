import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const row = (await locals.db
		.prepare("SELECT COUNT(*) AS count FROM profiles WHERE role = 'admin'")
		.first()) as { count: number | string } | null;

	return {
		hasAdmin: Number(row?.count ?? 0) > 0
	};
};
