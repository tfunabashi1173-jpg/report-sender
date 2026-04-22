<script lang="ts">
	let { data } = $props();
</script>

<main class="page">
	<a class="back" href="/dashboard">ダッシュボードへ</a>
	<header>
		<p class="eyebrow">History</p>
		<h1>送信履歴</h1>
	</header>

	<section class="list">
		{#if data.reports.length === 0}
			<p class="empty">30日以内の履歴はありません。</p>
		{:else}
			{#each data.reports as report}
				<a class="row" href={`/dashboard/history/${report.id}`}>
					<div>
						<strong>{report.subject}</strong>
						<span>{report.status === 'sent' ? '送信済み' : '下書き'} / {report.recipientCount}件</span>
					</div>
					<small>{new Date(report.sentAt ?? report.createdAt).toLocaleDateString('ja-JP')}</small>
				</a>
			{/each}
		{/if}
	</section>
</main>

<style>
	:global(body) { margin: 0; background: #f4efe4; font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif; color: #17211b; }
	.page { max-width: 1080px; margin: 0 auto; padding: 24px 20px 84px; }
	.back { color: #6d4d21; font-weight: 800; text-decoration: none; }
	header { margin: 22px 0; }
	.eyebrow { margin: 0 0 6px; color: #93621f; font-size: 12px; font-weight: 800; letter-spacing: .14em; }
	h1 { margin: 0; font-size: 42px; letter-spacing: -.05em; }
	.list { display: grid; gap: 10px; }
	.row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 16px;
		border: 1px solid rgba(23,33,27,.12);
		border-radius: 20px;
		background: rgba(255,255,255,.8);
		color: inherit;
		text-decoration: none;
	}
	.row div { display: grid; gap: 4px; }
	.row span, .row small, .empty { color: #69746d; }
	@media (min-width: 900px) {
		.row {
			display: grid;
			grid-template-columns: minmax(0, 1fr) 160px;
			align-items: center;
			padding: 18px 20px;
		}
		.row strong {
			font-size: 18px;
		}
		.row small {
			text-align: right;
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
