declare module 'cloudflare:sockets' {
	export type Socket = {
		readable: ReadableStream<Uint8Array>;
		writable: WritableStream<Uint8Array>;
		opened: Promise<unknown>;
		closed: Promise<void>;
		upgraded: boolean;
		secureTransport: 'off' | 'on' | 'starttls';
		close(): Promise<void>;
		startTls(options?: unknown): Socket;
	};

	export function connect(
		address: string | { hostname: string; port: number },
		options?: {
			secureTransport?: 'off' | 'on' | 'starttls';
			allowHalfOpen?: boolean;
			highWaterMark?: number | bigint;
		}
	): Socket;
}
