<script lang="ts">
	let displayName = $state('');
	let phone = $state('');
	let generatedUrl = $state('');
	let loading = $state(false);
	let error = $state('');
	let copied = $state(false);

	async function generateInvite() {
		loading = true;
		error = '';
		generatedUrl = '';
		try {
			const res = await fetch('/api/dashboard/invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ displayName, phone })
			});
			const result = await res.json();
			if (!res.ok) throw new Error(result.error);
			generatedUrl = result.url;
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

	<label>
		電話番号（任意）
		<input type="tel" bind:value={phone} placeholder="090-0000-0000" />
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
			<p class="hint">このURLをLINEやメッセージアプリで送ってください</p>
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
	.hint { font-size: 12px; color: #888; margin: 0; }
	.error { color: #e00; font-size: 14px; }
</style>
