import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import type { LoadEvent } from '@sveltejs/kit';

const DB_SCHEMA = 'report_sender';

export function createSupabaseLoadClient(
	fetchFn: LoadEvent['fetch'],
	supabaseUrl: string,
	supabaseAnonKey: string
) {
	return isBrowser()
		? createBrowserClient(supabaseUrl, supabaseAnonKey, { db: { schema: DB_SCHEMA } })
		: createServerClient(supabaseUrl, supabaseAnonKey, {
				db: { schema: DB_SCHEMA },
				global: { fetch: fetchFn },
				cookies: { getAll: () => [], setAll: () => {} }
			});
}
