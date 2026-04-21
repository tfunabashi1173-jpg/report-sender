import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) redirect(302, '/login');

	const { data: profile } = await locals.supabase
		.schema('report_sender')
		.from('profiles')
		.select('role, display_name')
		.eq('id', user.id)
		.single();

	return { profile };
};
