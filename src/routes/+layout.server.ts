import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, platform }) => {
	const { session } = await safeGetSession();
	return {
		session,
		supabaseUrl: platform?.env.PUBLIC_SUPABASE_URL ?? '',
		supabaseAnonKey: platform?.env.PUBLIC_SUPABASE_ANON_KEY ?? ''
	};
};
