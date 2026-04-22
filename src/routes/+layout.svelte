<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	let commitShortSha = $state('');
	let commitUrl = $state('');

	onMount(async () => {
		try {
			const res = await fetch('/api/meta/version');
			const data = await res.json();
			if (res.ok) {
				commitShortSha = data.shortSha;
				commitUrl = data.htmlUrl;
			}
		} catch {
			// Footer is optional.
		}
	});
</script>

<svelte:head>
	<title>報告メール送信システム</title>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<footer class="app-footer">
	{#if commitShortSha}
		<a href={commitUrl} target="_blank" rel="noreferrer">GitHub {commitShortSha}</a>
	{/if}
</footer>

<style>
	.app-footer {
		position: fixed;
		right: 10px;
		bottom: 8px;
		font-size: 12px;
		color: #666;
		background: rgba(255, 255, 255, 0.9);
		padding: 4px 8px;
		border-radius: 6px;
		border: 1px solid #e1e1e1;
	}
	.app-footer a {
		color: #666;
		text-decoration: none;
	}
</style>
