import type { PageServerLoad } from './$types';
import { requireDashboardUser } from '$lib/server/guards';

export const load: PageServerLoad = async ({ locals }) => {
	const { profile } = await requireDashboardUser(locals);
	return {
		isAdmin: profile?.role === 'admin'
	};
};
