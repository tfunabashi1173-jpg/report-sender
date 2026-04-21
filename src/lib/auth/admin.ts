import { createClient } from '@supabase/supabase-js';

export function createAdminClient(supabaseUrl: string, serviceRoleKey: string) {
	return createClient(supabaseUrl, serviceRoleKey, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
}
