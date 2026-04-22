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
			<p class="empty">履歴はまだありません。</p>
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
</style>
