<script lang="ts">
	import { page } from '$app/state';
	let { children } = $props();

	const nav = [
		{ label: 'ホーム', href: '/dashboard', icon: 'home' },
		{ label: '作成', href: '/dashboard/compose', icon: 'compose' },
		{ label: '連絡先', href: '/dashboard/contacts', icon: 'contacts' },
		{ label: '定型文', href: '/dashboard/templates', icon: 'template' },
		{ label: '履歴', href: '/dashboard/history', icon: 'history' }
	];

	function active(href: string) {
		return href === '/dashboard' ? page.url.pathname === href : page.url.pathname.startsWith(href);
	}
</script>

{#snippet Icon(name: string)}
	{#if name === 'contacts'}
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M20 8v6" /><path d="M23 11h-6" /></svg>
	{:else if name === 'template'}
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h5" /></svg>
	{:else if name === 'history'}
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></svg>
	{:else if name === 'compose'}
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
	{:else}
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>
	{/if}
{/snippet}

{@render children()}

<nav class="bottom-nav" aria-label="主要ナビゲーション">
	{#each nav as item}
		<a class:active={active(item.href)} href={item.href}>
			{@render Icon(item.icon)}
			<span>{item.label}</span>
		</a>
	{/each}
</nav>

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
	.bottom-nav {
		position: fixed;
		right: 0;
		bottom: 0;
		left: 0;
		z-index: 20;
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 2px;
		border-top: 1px solid #eceff3;
		background: rgba(255, 255, 255, 0.94);
		backdrop-filter: blur(18px);
		padding: 8px max(12px, env(safe-area-inset-left)) calc(8px + env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-right));
	}
	.bottom-nav a {
		display: grid;
		place-items: center;
		gap: 3px;
		color: #9aa0aa;
		font-size: 11px;
		font-weight: 600;
		text-decoration: none;
		padding: 6px 2px;
	}
	.bottom-nav svg { width: 21px; height: 21px; }
	.bottom-nav a.active { color: #1f2937; }
	@media (min-width: 920px) {
		.bottom-nav {
			left: 50%;
			transform: translateX(-50%);
			bottom: 18px;
			width: min(560px, calc(100% - 36px));
			border: 1px solid #eceff3;
			border-radius: 24px;
			box-shadow: 0 20px 60px rgba(16, 24, 40, 0.12);
		}
	}
</style>
