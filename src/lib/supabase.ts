import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import type { LoadEvent } from '@sveltejs/kit';

export function createSupabaseLoadClient(
	fetchFn: LoadEvent['fetch'],
	supabaseUrl: string,
	supabaseAnonKey: string
) {
	return isBrowser()
		? createBrowserClient(supabaseUrl, supabaseAnonKey)
		: createServerClient(supabaseUrl, supabaseAnonKey, {
				global: { fetch: fetchFn },
				cookies: { getAll: () => [], setAll: () => {} }
			});
}
