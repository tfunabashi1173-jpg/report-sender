import type { R2Bucket } from '@cloudflare/workers-types';

export async function uploadAsset(
	bucket: R2Bucket,
	key: string,
	body: unknown
) {
	await bucket.put(key, body as Parameters<R2Bucket['put']>[1], {
		httpMetadata: {
			contentType: 'application/octet-stream'
		}
	});
	return key;
}

export async function getAsset(bucket: R2Bucket, key: string) {
	return bucket.get(key);
}
