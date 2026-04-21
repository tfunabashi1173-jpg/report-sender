import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { LoadEvent } from '@sveltejs/kit';

const DB_SCHEMA = 'report_sender';

export function createSupabaseLoadClient(fetchFn: LoadEvent['fetch']) {
	return isBrowser()
		? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				db: { schema: DB_SCHEMA }
			})
		: createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				db: { schema: DB_SCHEMA },
				global: { fetch: fetchFn },
				cookies: { getAll: () => [], setAll: () => {} }
			});
}
