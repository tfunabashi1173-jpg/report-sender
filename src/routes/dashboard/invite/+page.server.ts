import type { PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	await requireAdmin(locals);
	return {};
};
