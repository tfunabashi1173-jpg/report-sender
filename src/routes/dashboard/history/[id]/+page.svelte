<script lang="ts">
	let { data } = $props();
</script>

<main class="page">
	<a class="back" href="/dashboard/history">履歴へ戻る</a>
	<header>
		<p class="eyebrow">{data.report.status === 'sent' ? 'Sent' : 'Draft'}</p>
		<h1>{data.report.subject}</h1>
	</header>

	<section class="card">
		<h2>宛先</h2>
		<p class="status">送信状態: {data.report.deliveryStatus === 'sent' ? '送信済み' : data.report.deliveryStatus === 'failed' ? '送信失敗' : '未送信'}</p>
		{#if data.report.deliveryError}
			<p class="error">{data.report.deliveryError}</p>
		{/if}
		{#if data.recipients.length === 0}
			<p class="empty">宛先なし</p>
		{:else}
			<div class="recipients">
				{#each data.recipients as recipient}
					<span>{recipient.kind === 'cc' ? 'CC' : 'TO'}: {recipient.name}<small>{recipient.email}</small></span>
				{/each}
			</div>
		{/if}
	</section>

	<section class="card">
		<h2>添付画像</h2>
		{#if data.attachments.length === 0}
			<p class="empty">添付なし</p>
		{:else}
			<div class="recipients">
				{#each data.attachments as attachment}
					<span>{attachment.fileName}<small>{Math.ceil(attachment.size / 1024)} KB</small></span>
				{/each}
			</div>
		{/if}
	</section>

	<section class="card">
		<h2>本文</h2>
		<pre>{data.report.body}</pre>
	</section>

	<div class="actions">
		{#if data.report.status === 'draft'}
			<form method="POST" action="?/sendNow">
				<button disabled={!data.mailConfigured || data.recipients.length === 0}>サーバーから送信</button>
			</form>
		{/if}
		<form method="POST" action="?/delete">
			<button class="danger">削除</button>
		</form>
	</div>
</main>

<style>
	:global(body) { margin: 0; background: linear-gradient(160deg, #f7efe1, #e6f0ee); font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif; color: #17211b; }
	.page { max-width: 1120px; margin: 0 auto; padding: 24px 20px 92px; }
	.back { color: #6d4d21; font-weight: 800; text-decoration: none; }
	header { margin: 22px 0; }
	.eyebrow { margin: 0 0 6px; color: #93621f; font-size: 12px; font-weight: 800; letter-spacing: .14em; }
	h1 { margin: 0; font-size: clamp(30px, 8vw, 48px); letter-spacing: -.05em; }
	.card {
		margin-top: 12px;
		border: 1px solid rgba(23,33,27,.12);
		border-radius: 22px;
		background: rgba(255,255,255,.82);
		box-shadow: 0 14px 36px rgba(23,33,27,.08);
		padding: 18px;
	}
	h2 { margin: 0 0 14px; font-size: 18px; }
	.recipients { display: flex; flex-wrap: wrap; gap: 8px; }
	.recipients span {
		display: grid;
		gap: 2px;
		padding: 10px 12px;
		border-radius: 14px;
		background: rgba(23,33,27,.06);
	}
	small, .empty { color: #69746d; }
	.status { margin: 0 0 12px; color: #69746d; }
	.error { border-radius: 14px; padding: 12px; background: #ffe8e4; color: #a53024; }
	pre {
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
		font: inherit;
		line-height: 1.7;
	}
	.actions {
		display: grid;
		gap: 10px;
		margin-top: 14px;
	}
	button {
		display: block;
		box-sizing: border-box;
		width: 100%;
		border: none;
		border-radius: 14px;
		background: #f08a24;
		color: #1c1207;
		font-weight: 900;
		text-align: center;
		text-decoration: none;
		padding: 14px;
		font: inherit;
	}
	button:disabled { opacity: .55; cursor: not-allowed; }
	.danger { background: rgba(191,56,42,.1); color: #a53024; }
	@media (min-width: 960px) {
		.page {
			display: grid;
			grid-template-columns: minmax(0, 1fr) 340px;
			gap: 16px;
			align-items: start;
		}
		.back,
		header {
			grid-column: 1 / -1;
		}
		.card:first-of-type,
		.card:nth-of-type(2),
		.actions {
			grid-column: 2;
		}
		.card:nth-of-type(3) {
			grid-column: 1;
			grid-row: 3 / span 3;
		}
		.actions {
			position: sticky;
			top: 20px;
		}
	}
</style>
