import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type VersionPayload = {
	sha: string;
	shortSha: string;
	htmlUrl: string;
	fetchedAt: string;
	source: 'api' | 'atom';
};

const DEFAULT_REPO = 'tfunabashi1173-jpg/report-sender';
const CACHE_TTL_MS = 60_000;

let cached: { expiresAt: number; payload: VersionPayload } | null = null;

export const GET: RequestHandler = async ({ fetch }) => {
	const now = Date.now();
	if (cached && cached.expiresAt > now) {
		return json(cached.payload);
	}

	try {
		const response = await fetch(`https://api.github.com/repos/${DEFAULT_REPO}/commits/main`, {
			headers: {
				Accept: 'application/vnd.github+json',
				'User-Agent': 'report-sender-worker'
			}
		});

		if (response.ok) {
			const data = (await response.json()) as { sha: string; html_url: string };
			const payload: VersionPayload = {
				sha: data.sha,
				shortSha: data.sha.slice(0, 7),
				htmlUrl: data.html_url,
				fetchedAt: new Date().toISOString(),
				source: 'api'
			};
			cached = { expiresAt: now + CACHE_TTL_MS, payload };
			return json(payload);
		}
	} catch {
		// Fallback to Atom feed below.
	}

	try {
		const atomRes = await fetch(`https://github.com/${DEFAULT_REPO}/commits/main.atom`);
		if (atomRes.ok) {
			const atomText = await atomRes.text();
			const hashMatch = atomText.match(/Commit\/([0-9a-f]{40})/i);
			if (hashMatch) {
				const sha = hashMatch[1];
				const payload: VersionPayload = {
					sha,
					shortSha: sha.slice(0, 7),
					htmlUrl: `https://github.com/${DEFAULT_REPO}/commit/${sha}`,
					fetchedAt: new Date().toISOString(),
					source: 'atom'
				};
				cached = { expiresAt: now + CACHE_TTL_MS, payload };
				return json(payload);
			}
		}
	} catch {
		// No-op; return explicit error below.
	}

	return json({ error: 'failed_to_fetch_version' }, { status: 502 });
};
