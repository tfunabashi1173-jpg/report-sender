<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	const displayName = $derived(data.user?.displayName ?? data.profile?.displayName ?? 'User');
	const initial = $derived(displayName.slice(0, 1).toUpperCase());
	const isAdmin = $derived(data.profile?.role === 'admin');

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		goto('/login');
	}

	const menu = [
		{
			label: '連絡先',
			href: '/dashboard/contacts',
			description: '送信先の登録',
			icon: 'contacts'
		},
		{
			label: '宛先リスト',
			href: '/dashboard/lists',
			description: 'TO / CC のグループ',
			icon: 'list'
		},
		{
			label: '定型文',
			href: '/dashboard/templates',
			description: '件名と本文のひな形',
			icon: 'template'
		},
		{
			label: '履歴',
			href: '/dashboard/history',
			description: '送信記録の確認',
			icon: 'history'
		}
	];

	const nav = [
		{ label: 'ホーム', href: '/dashboard', icon: 'home', active: true },
		{ label: '作成', href: '/dashboard/compose', icon: 'compose' },
		{ label: '連絡先', href: '/dashboard/contacts', icon: 'contacts' },
		{ label: '定型文', href: '/dashboard/templates', icon: 'template' },
		{ label: '履歴', href: '/dashboard/history', icon: 'history' }
	];
</script>

{#snippet Icon(name: string)}
	{#if name === 'contacts'}
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M20 8v6" /><path d="M23 11h-6" /></svg>
	{:else if name === 'list'}
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></svg>
	{:else if name === 'template'}
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h5" /></svg>
	{:else if name === 'history'}
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></svg>
	{:else if name === 'compose'}
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
	{:else if name === 'home'}
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>
	{:else}
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
	{/if}
{/snippet}

<main class="dashboard">
	<header class="topbar">
		<a class="brand" href="/">REPORT SENDER</a>
		<div class="top-actions">
			<a class="primary" href="/dashboard/compose"><span>+</span> 作成</a>
			{#if isAdmin}
				<a class="gear" href="/dashboard/settings/mail" aria-label="メール設定">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.39 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1A1.7 1.7 0 0 0 2.9 13H3a2 2 0 1 1 0-4h-.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6A1.7 1.7 0 0 0 10.4 2.9V3a2 2 0 1 1 4 0v-.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.26.37.62.67 1 .8.23.08.47.1.7.1H21a2 2 0 1 1 0 4h.09A1.7 1.7 0 0 0 19.4 15Z" /></svg>
				</a>
			{/if}
			<div class="account">
				<button class="avatar" aria-label="アカウント">{initial}</button>
				<div class="account-menu">
					<span>{displayName}</span>
					<button onclick={logout}>ログアウト</button>
				</div>
			</div>
		</div>
	</header>

	<section class="summary">
		<div>
			<p>Dashboard</p>
			<h1>報告メールを作成・送信</h1>
		</div>
		<a href="/dashboard/compose"><span>+</span> 新しい報告メール</a>
	</section>

	<section class="menu-grid" aria-label="機能">
		{#each menu as item}
			<a class="menu-card" href={item.href}>
				<span class="icon">{@render Icon(item.icon)}</span>
				<strong>{item.label}</strong>
				<small>{item.description}</small>
			</a>
		{/each}
	</section>

	<section class="panel">
		<div class="section-title">
			<h2>最近の報告</h2>
			<a href="/dashboard/history">すべて見る</a>
		</div>
		{#if data.recentReports.length === 0}
			<p class="empty">まだ報告メールがありません。</p>
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
		background: #f6f7f9;
		color: #24262b;
		font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif;
	}
	:global(svg) {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.dashboard {
		max-width: 1120px;
		margin: 0 auto;
		padding: 24px 18px 104px;
	}
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 4px 2px 22px;
	}
	.brand {
		color: #9aa0aa;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-decoration: none;
	}
	.top-actions {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.primary,
	.summary a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border-radius: 999px;
		background: #1f2937;
		color: white;
		font-size: 14px;
		font-weight: 700;
		text-decoration: none;
		padding: 11px 16px;
		box-shadow: 0 12px 28px rgba(31, 41, 55, 0.16);
	}
	.primary span,
	.summary a span {
		font-size: 18px;
		line-height: 1;
	}
	.gear,
	.avatar {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border: none;
		border-radius: 999px;
		background: #ffffff;
		color: #343842;
		box-shadow: 0 12px 30px rgba(16, 24, 40, 0.08);
	}
	.gear svg {
		width: 19px;
		height: 19px;
	}
	.avatar {
		font-weight: 700;
	}
	.account {
		position: relative;
	}
	.account-menu {
		position: absolute;
		top: calc(100% + 10px);
		right: 0;
		z-index: 5;
		display: none;
		min-width: 168px;
		padding: 10px;
		border-radius: 18px;
		background: #fff;
		box-shadow: 0 24px 60px rgba(16, 24, 40, 0.14);
	}
	.account:focus-within .account-menu,
	.account:hover .account-menu {
		display: grid;
		gap: 8px;
	}
	.account-menu span {
		color: #6b7280;
		font-size: 12px;
		padding: 4px 6px;
	}
	.account-menu button {
		border: none;
		border-radius: 12px;
		background: #f3f4f6;
		color: #24262b;
		padding: 10px;
		text-align: left;
	}
	.summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 18px;
		margin-bottom: 22px;
		padding: 24px;
		border-radius: 28px;
		background: #ffffff;
		box-shadow: 0 24px 60px rgba(16, 24, 40, 0.08);
	}
	.summary p {
		margin: 0 0 8px;
		color: #9aa0aa;
		font-size: 13px;
		font-weight: 600;
	}
	h1 {
		margin: 0;
		color: #20242c;
		font-size: clamp(24px, 4vw, 38px);
		letter-spacing: -0.045em;
	}
	.menu-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 18px;
	}
	.menu-card,
	.panel {
		border-radius: 24px;
		background: #ffffff;
		box-shadow: 0 22px 54px rgba(16, 24, 40, 0.07);
	}
	.menu-card {
		display: grid;
		gap: 10px;
		min-height: 132px;
		padding: 22px;
		color: inherit;
		text-decoration: none;
		transition: transform 0.16s ease, box-shadow 0.16s ease;
	}
	.menu-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 28px 70px rgba(16, 24, 40, 0.1);
	}
	.icon {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 16px;
		background: #f5f6f8;
		color: #475569;
	}
	.icon svg {
		width: 28px;
		height: 28px;
	}
	.menu-card strong {
		color: #262a33;
		font-size: 16px;
		font-weight: 600;
	}
	.menu-card small {
		color: #8b929d;
		font-size: 12px;
		line-height: 1.5;
	}
	.panel {
		margin-top: 22px;
		padding: 22px;
	}
	.section-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	h2 {
		margin: 0;
		font-size: 17px;
		font-weight: 650;
	}
	.section-title a {
		color: #6b7280;
		font-size: 13px;
		font-weight: 600;
		text-decoration: none;
	}
	.empty {
		margin: 18px 0 0;
		color: #8b929d;
		font-size: 14px;
	}
	.report-list {
		display: grid;
		gap: 10px;
		margin-top: 16px;
	}
	.report-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		border-radius: 16px;
		background: #f7f8fa;
		color: inherit;
		text-decoration: none;
		padding: 14px 16px;
	}
	.report-row small {
		color: #8b929d;
		white-space: nowrap;
	}
	@media (max-width: 720px) {
		.dashboard {
			padding-top: 22px;
		}
		.primary {
			display: none;
		}
		.summary {
			align-items: flex-start;
			padding: 22px;
		}
		.summary a {
			display: none;
		}
		.menu-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 14px;
		}
		.menu-card {
			min-height: 124px;
			padding: 18px;
		}
	}
	@media (min-width: 920px) {
		.dashboard {
			padding-bottom: 112px;
		}	}
</style>
