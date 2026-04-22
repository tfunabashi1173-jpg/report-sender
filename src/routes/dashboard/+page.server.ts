import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) redirect(302, '/login');

	const profile = (await locals.db
		.prepare('SELECT role, display_name AS displayName FROM profiles WHERE id = ?1')
		.bind(user.id)
		.first()) as { role: 'admin' | 'member'; displayName: string | null } | null;

	return { profile };
};
