import type { LayoutServerLoad } from './$types';

const REPO = 'tfunabashi1173-jpg/report-sender';
const CACHE_TTL_MS = 60_000;

let cachedVersion: { expiresAt: number; shortSha: string; htmlUrl: string } | null = null;

async function getGitHubVersion(fetch: typeof globalThis.fetch) {
	const now = Date.now();
	if (cachedVersion && cachedVersion.expiresAt > now) return cachedVersion;

	const res = await fetch(`https://api.github.com/repos/${REPO}/commits/main`, {
		headers: {
			Accept: 'application/vnd.github+json',
			'User-Agent': 'report-sender-worker'
		}
	});
	if (!res.ok) return null;

	const data = (await res.json()) as { sha: string; html_url: string };
	cachedVersion = {
		expiresAt: now + CACHE_TTL_MS,
		shortSha: data.sha.slice(0, 7),
		htmlUrl: data.html_url
	};
	return cachedVersion;
}

export const load: LayoutServerLoad = async ({ locals, fetch }) => {
	const version = await getGitHubVersion(fetch).catch(() => null);

	return {
		session: locals.session,
		user: locals.user,
		version
	};
};
