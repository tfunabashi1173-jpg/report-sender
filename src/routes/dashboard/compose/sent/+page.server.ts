import type { PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	await requireDashboardUser(locals);
	return {};
};
