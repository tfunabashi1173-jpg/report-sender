<script lang="ts">
	import QRCode from 'qrcode';

	let displayName = $state('');
	let generatedUrl = $state('');
	let qrCodeDataUrl = $state('');
	let canShare = $state(false);
	let loading = $state(false);
	let error = $state('');
	let copied = $state(false);

	async function generateInvite() {
		loading = true;
		error = '';
		generatedUrl = '';
		qrCodeDataUrl = '';
		try {
			const res = await fetch('/api/dashboard/invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ displayName })
			});
			const result = await res.json();
			if (!res.ok) throw new Error(result.error);
			generatedUrl = result.url;
			qrCodeDataUrl = await QRCode.toDataURL(result.url, {
				width: 240,
				margin: 1
			});
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function copyUrl() {
		await navigator.clipboard.writeText(generatedUrl);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	async function shareUrl() {
		if (!generatedUrl || !canShare) return;
		try {
			await navigator.share({
				title: '招待リンク',
				text: '報告メール送信システムの招待リンクです',
				url: generatedUrl
			});
		} catch {
			// User canceled or share target unavailable.
		}
	}

	$effect(() => {
		canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
	});
</script>

<main class="page">
	<a href="/dashboard" class="back">← ダッシュボードへ</a>
	<h1>招待リンクを作成</h1>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<label>
		招待する方のお名前（任意）
		<input type="text" bind:value={displayName} placeholder="山田 太郎" />
	</label>

	<button class="btn-primary" onclick={generateInvite} disabled={loading}>
		{loading ? '生成中...' : '招待リンクを生成'}
	</button>

	{#if generatedUrl}
		<div class="result">
			<p class="label">招待リンク（7日間有効）</p>
			<div class="url-box">
				<span class="url">{generatedUrl}</span>
				<button class="btn-copy" onclick={copyUrl}>
					{copied ? 'コピー済み ✓' : 'コピー'}
				</button>
			</div>
			{#if canShare}
				<button class="btn-share" onclick={shareUrl}>共有して送る</button>
			{/if}
			<p class="hint">このURLをLINEやメッセージアプリで送ってください</p>
			{#if qrCodeDataUrl}
				<div class="qr-wrap">
					<p class="qr-label">別端末から読み取る場合</p>
					<img class="qr-image" src={qrCodeDataUrl} alt="招待リンクのQRコード" />
				</div>
			{/if}
		</div>
	{/if}
</main>

<style>
	.page {
		max-width: 480px;
		margin: 40px auto;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.back { font-size: 14px; color: #0070f3; text-decoration: none; }
	label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
	input {
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 16px;
	}
	.btn-primary {
		padding: 12px;
		background: #0070f3;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 16px;
		cursor: pointer;
	}
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
	.result {
		background: #f0f7ff;
		border: 1px solid #b3d7ff;
		border-radius: 8px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.label { font-size: 12px; color: #555; margin: 0; }
	.url-box {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.url {
		font-size: 13px;
		word-break: break-all;
		flex: 1;
	}
	.btn-copy {
		padding: 6px 12px;
		background: #0070f3;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		white-space: nowrap;
		font-size: 13px;
	}
	.btn-share {
		padding: 10px 12px;
		background: #1a8f3a;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}
	.hint { font-size: 12px; color: #888; margin: 0; }
	.qr-wrap {
		margin-top: 8px;
		padding-top: 12px;
		border-top: 1px solid #d7e8ff;
		display: flex;
		flex-direction: column;
		gap: 8px;
		align-items: center;
	}
	.qr-label {
		font-size: 12px;
		color: #555;
		margin: 0;
	}
	.qr-image {
		width: 180px;
		height: 180px;
		border: 1px solid #c8defd;
		border-radius: 8px;
		background: #fff;
	}
	.error { color: #e00; font-size: 14px; }

	:global(body) { background: #f6f7f9; color: #24262b; }
	.page { max-width: 1120px; padding: 24px 18px 112px; }
	.back, .mini { color: #6b7280; font-size: 13px; font-weight: 650; text-decoration: none; }
	header { margin: 20px 0 22px; }
	.eyebrow { color: #9aa0aa; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
	h1 { color: #20242c; font-size: clamp(28px, 5vw, 42px); letter-spacing: -.045em; }
	.card, .row, .editor, .template, .list-card, .result { border: 0 !important; border-radius: 24px; background: #fff; box-shadow: 0 22px 54px rgba(16,24,40,.07); }
	.card, .editor, .template, .list-card { padding: 22px; }
	.workspace, .composer, .lists, .templates, .list { gap: 18px; }
	h2 { color: #262a33; font-weight: 650; }
	label { color: #3f4652; font-weight: 650; }
	input, textarea, select { border: 1px solid #e6e9ef; border-radius: 16px; background: #fff; color: #24262b; }
	input:focus, textarea:focus, select:focus { outline: 2px solid rgba(31,41,55,.12); border-color: #cfd5df; }
	button, .btn-primary, .btn-copy, .btn-share { border: 0; border-radius: 16px; background: #1f2937; color: #fff; font-weight: 700; }
	button:hover, .btn-primary:hover, .btn-copy:hover, .btn-share:hover { background: #111827; }
	.danger, .plain { background: #fff1f0 !important; color: #b42318 !important; }
	.error { border: 0; border-radius: 16px; background: #fff1f0; color: #b42318; }
	.success { border: 0; border-radius: 16px; background: #ecfdf3; color: #067647; }
	.empty, small, .row span, .row small, .list-head p, summary span, .tag-panel small, .tags span, header p, .status { color: #8b929d; }
</style>
