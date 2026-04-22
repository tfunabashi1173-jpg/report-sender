<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		goto('/login');
	}

	const cards = $derived([
		{ label: '連絡先', value: data.stats.contacts, href: '/dashboard/contacts', action: '管理' },
		{ label: '宛先リスト', value: data.stats.lists, href: '/dashboard/lists', action: '整理' },
		{ label: '定型文', value: data.stats.templates, href: '/dashboard/templates', action: '編集' },
		{ label: '送信済み', value: data.stats.sent, href: '/dashboard/history', action: '履歴' }
	]);
</script>

<main class="dashboard">
	<section class="hero">
		<div>
			<p class="eyebrow">Report Sender</p>
			<h1>{data.user?.displayName ?? data.profile?.displayName ?? 'ユーザー'}さん</h1>
			<p class="sub">宛先を選び、定型文を整え、報告メールを送信記録として残します。</p>
		</div>
		<button class="logout" onclick={logout}>ログアウト</button>
	</section>

	<section class="primary-action">
		<a class="compose" href="/dashboard/compose">
			<span>新しい報告メール</span>
			<strong>作成する</strong>
		</a>
	</section>

	<section class="stats">
		{#each cards as card}
			<a class="stat-card" href={card.href}>
				<span>{card.label}</span>
				<strong>{card.value}</strong>
				<em>{card.action}</em>
			</a>
		{/each}
	</section>

	<nav class="quick">
		<a href="/dashboard/contacts">連絡先</a>
		<a href="/dashboard/lists">リスト</a>
		<a href="/dashboard/templates">定型文</a>
		<a href="/dashboard/history">履歴</a>
		{#if data.profile?.role === 'admin'}
			<a href="/dashboard/invite">招待</a>
		{/if}
	</nav>

	<section class="panel">
		<div class="section-title">
			<h2>最近の報告</h2>
			<a href="/dashboard/history">すべて見る</a>
		</div>
		{#if data.recentReports.length === 0}
			<p class="empty">まだ報告メールがありません。まずは「作成する」から始めてください。</p>
		{:else}
			<div class="report-list">
				{#each data.recentReports as report}
					<a class="report-row" href={`/dashboard/history/${report.id}`}>
						<span>{report.subject}</span>
						<small>{report.status === 'sent' ? '送信済み' : '下書き'}</small>
					</a>
				{/each}
			</div>
		{/if}
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		background:
			radial-gradient(circle at top left, rgba(255, 183, 77, 0.28), transparent 34rem),
			linear-gradient(145deg, #f8f3e9 0%, #eaf1ed 55%, #dce9f2 100%);
		color: #17211b;
		font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif;
	}
	.dashboard {
		max-width: 1180px;
		margin: 0 auto;
		padding: 24px 18px 80px;
	}
	.hero {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		align-items: flex-start;
		padding: 26px;
		border: 1px solid rgba(23, 33, 27, 0.12);
		border-radius: 28px;
		background: rgba(255, 255, 255, 0.72);
		box-shadow: 0 18px 48px rgba(38, 54, 45, 0.12);
	}
	.eyebrow {
		margin: 0 0 8px;
		color: #93621f;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	h1 {
		margin: 0;
		font-size: clamp(30px, 8vw, 56px);
		line-height: 0.95;
		letter-spacing: -0.05em;
	}
	.sub {
		max-width: 30rem;
		margin: 14px 0 0;
		color: #5c665f;
		line-height: 1.7;
	}
	.logout {
		border: none;
		background: #17211b;
		color: #fff;
		border-radius: 999px;
		padding: 10px 14px;
		white-space: nowrap;
	}
	.primary-action {
		margin: 18px 0;
	}
	.compose {
		display: grid;
		gap: 4px;
		padding: 24px;
		border-radius: 24px;
		background: #f08a24;
		color: #1c1207;
		text-decoration: none;
		box-shadow: 0 16px 32px rgba(240, 138, 36, 0.28);
	}
	.compose span {
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.08em;
	}
	.compose strong {
		font-size: 30px;
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 12px;
	}
	.stat-card {
		display: grid;
		gap: 8px;
		padding: 18px;
		border: 1px solid rgba(23, 33, 27, 0.12);
		border-radius: 22px;
		background: rgba(255, 255, 255, 0.68);
		color: inherit;
		text-decoration: none;
	}
	.stat-card span,
	.stat-card em {
		color: #69746d;
		font-size: 12px;
		font-style: normal;
	}
	.stat-card strong {
		font-size: 34px;
		line-height: 1;
	}
	.quick {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		padding: 18px 0;
	}
	.quick a {
		flex: 0 0 auto;
		padding: 10px 14px;
		border-radius: 999px;
		background: rgba(23, 33, 27, 0.08);
		color: #17211b;
		text-decoration: none;
		font-weight: 700;
	}
	.panel {
		padding: 20px;
		border-radius: 24px;
		background: rgba(255, 255, 255, 0.72);
	}
	.section-title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}
	h2 {
		margin: 0;
		font-size: 18px;
	}
	.section-title a {
		color: #93621f;
		font-weight: 700;
		text-decoration: none;
	}
	.empty {
		color: #69746d;
	}
	.report-list {
		display: grid;
		gap: 8px;
		margin-top: 14px;
	}
	.report-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 14px;
		border-radius: 16px;
		background: rgba(23, 33, 27, 0.06);
		color: inherit;
		text-decoration: none;
	}
	.report-row small {
		color: #69746d;
		white-space: nowrap;
	}
	@media (max-width: 720px) {
		.hero {
			flex-direction: column;
			border-radius: 22px;
			padding: 22px;
		}
		.stats {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (min-width: 980px) {
		.dashboard {
			display: grid;
			grid-template-columns: minmax(0, 1fr) 360px;
			gap: 18px;
		}
		.hero {
			grid-column: 1 / -1;
		}
		.primary-action,
		.panel {
			grid-column: 1;
		}
		.stats,
		.quick {
			grid-column: 2;
		}
		.stats {
			grid-template-columns: repeat(2, 1fr);
			align-self: start;
		}
		.quick {
			position: sticky;
			top: 18px;
			display: grid;
			padding: 0;
			align-self: start;
		}
		.quick a {
			border-radius: 16px;
		}
		.primary-action {
			margin: 0;
		}
	}
</style>
