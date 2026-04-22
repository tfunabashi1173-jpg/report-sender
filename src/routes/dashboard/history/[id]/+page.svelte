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
		.actions {
			grid-column: 2;
		}
		.card:nth-of-type(2) {
			grid-column: 1;
			grid-row: 3 / span 2;
		}
		.actions {
			position: sticky;
			top: 20px;
		}
	}

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
