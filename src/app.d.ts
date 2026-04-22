import type { AppSession, AppUser } from '$lib/server/auth';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

declare global {
	namespace App {
		interface Locals {
			db: D1Database;
			session: AppSession | null;
			user: AppUser | null;
			safeGetSession: () => Promise<{ session: AppSession | null; user: AppUser | null }>;
		}
		interface PageData {
			session: AppSession | null;
			user: AppUser | null;
		}
		interface Platform {
			env: {
				DB: D1Database;
				REPORT_ASSETS: R2Bucket;
				TWILIO_ACCOUNT_SID?: string;
				TWILIO_AUTH_TOKEN?: string;
				TWILIO_PHONE_NUMBER?: string;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
