import { redirect } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import type { AppUser } from '$lib/server/auth';

export type Profile = {
	role: 'admin' | 'member';
	displayName: string | null;
};

export async function requireUser(locals: App.Locals) {
	const { user } = await locals.safeGetSession();
	if (!user) redirect(302, '/login');
	return user;
}

export async function getProfile(db: D1Database, userId: string) {
	return (await db
		.prepare('SELECT role, display_name AS displayName FROM profiles WHERE id = ?1')
		.bind(userId)
		.first()) as Profile | null;
}

export async function requireDashboardUser(locals: App.Locals): Promise<{ user: AppUser; profile: Profile | null }> {
	const user = await requireUser(locals);
	const profile = await getProfile(locals.db, user.id);
	return { user, profile };
}

export async function requireAdmin(locals: App.Locals) {
	const context = await requireDashboardUser(locals);
	if (context.profile?.role !== 'admin') redirect(302, '/dashboard');
	return context;
}
