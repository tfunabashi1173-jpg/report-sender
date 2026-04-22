import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type VersionPayload = {
	sha: string;
	shortSha: string;
	htmlUrl: string;
	fetchedAt: string;
};

const DEFAULT_REPO = 'tfunabashi1173-jpg/report-sender';
const CACHE_TTL_MS = 60_000;

let cached: { expiresAt: number; payload: VersionPayload } | null = null;

export const GET: RequestHandler = async ({ fetch }) => {
	const now = Date.now();
	if (cached && cached.expiresAt > now) {
		return json(cached.payload);
	}

	const response = await fetch(`https://api.github.com/repos/${DEFAULT_REPO}/commits/main`, {
		headers: {
			Accept: 'application/vnd.github+json'
		}
	});

	if (!response.ok) {
		return json({ error: 'failed_to_fetch_version' }, { status: 502 });
	}

	const data = (await response.json()) as { sha: string; html_url: string };
	const payload: VersionPayload = {
		sha: data.sha,
		shortSha: data.sha.slice(0, 7),
		htmlUrl: data.html_url,
		fetchedAt: new Date().toISOString()
	};

	cached = { expiresAt: now + CACHE_TTL_MS, payload };
	return json(payload);
};
