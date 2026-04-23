<script lang="ts">
	let { data } = $props();

	const generalItems = [
		{
			label: 'ユーザー設定',
			description: 'ログインユーザー名と所属を編集します。',
			href: '/dashboard/settings/profile',
			icon: 'user'
		},
		{
			label: '画像文字入れ設定',
			description: '添付画像に入れる文字のテンプレートを設定します。',
			href: '/dashboard/settings/stamp',
			icon: 'image'
		}
	];

	const adminItems = [
		{
			label: 'メール設定',
			description: 'SMTP接続、送信元、署名、テスト送信を管理します。',
			href: '/dashboard/settings/mail',
			icon: 'mail'
		},
		{
			label: 'ユーザー管理',
			description: '登録ユーザー、所属、権限、削除を管理します。',
			href: '/dashboard/settings/users',
			icon: 'users'
		}
	];
</script>

{#snippet Icon(name: string)}
	{#if name === 'user'}
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></svg>
	{:else if name === 'image'}
		<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5L5 20" /></svg>
	{:else if name === 'mail'}
		<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
	{:else}
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M20 8v6" /><path d="M23 11h-6" /></svg>
	{/if}
{/snippet}

<main class="page">
	<a class="back" href="/dashboard">ダッシュボードへ</a>
	<header>
		<p class="eyebrow">Settings</p>
		<h1>設定</h1>
		<p>個人設定と管理者設定をここにまとめています。</p>
	</header>

	<section class="group">
		<div class="group-title">
			<h2>個人設定</h2>
			<p>自分の表示名、所属、画像文字入れを設定します。</p>
		</div>
		<div class="grid">
			{#each generalItems as item}
				<a class="card" href={item.href}>
					<span class="icon">{@render Icon(item.icon)}</span>
					<strong>{item.label}</strong>
					<small>{item.description}</small>
				</a>
			{/each}
		</div>
	</section>

	{#if data.isAdmin}
		<section class="group">
			<div class="group-title">
				<h2>管理者設定</h2>
				<p>送信メールサーバーと登録ユーザーを管理します。</p>
			</div>
			<div class="grid">
				{#each adminItems as item}
					<a class="card" href={item.href}>
						<span class="icon">{@render Icon(item.icon)}</span>
						<strong>{item.label}</strong>
						<small>{item.description}</small>
					</a>
				{/each}
			</div>
		</section>
	{/if}
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
	.page {
		max-width: 960px;
		margin: 0 auto;
		padding: 24px 18px 112px;
	}
	.back {
		color: #6b7280;
		font-size: 13px;
		font-weight: 650;
		text-decoration: none;
	}
	header {
		margin: 20px 0 24px;
	}
	.eyebrow {
		margin: 0 0 8px;
		color: #9aa0aa;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: .18em;
		text-transform: uppercase;
	}
	h1 {
		margin: 0;
		color: #20242c;
		font-size: clamp(30px, 5vw, 44px);
		letter-spacing: -.045em;
	}
	header p,
	.group-title p,
	small {
		color: #8b929d;
		line-height: 1.7;
	}
	.group {
		display: grid;
		gap: 14px;
		margin-top: 22px;
	}
	.group-title h2 {
		margin: 0 0 6px;
		color: #262a33;
		font-size: 18px;
		font-weight: 650;
	}
	.group-title p {
		margin: 0;
		font-size: 13px;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16px;
	}
	.card {
		display: grid;
		gap: 10px;
		min-height: 138px;
		border-radius: 24px;
		background: #fff;
		box-shadow: 0 22px 54px rgba(16, 24, 40, .07);
		color: inherit;
		text-decoration: none;
		padding: 22px;
		transition: transform .18s ease, box-shadow .18s ease;
	}
	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 28px 64px rgba(16, 24, 40, .10);
	}
	.icon {
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 18px;
		background: #f3f4f6;
		color: #303642;
	}
	.icon svg {
		width: 26px;
		height: 26px;
	}
	strong {
		color: #20242c;
		font-size: 18px;
		font-weight: 650;
	}
	small {
		font-size: 13px;
	}
	@media (max-width: 720px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
