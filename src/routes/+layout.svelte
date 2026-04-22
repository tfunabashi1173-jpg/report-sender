<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { data, children } = $props();
</script>

<svelte:head>
	<title>報告メール送信システム</title>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<footer class="app-footer">
	{#if data.version}
		<a href={data.version.htmlUrl} target="_blank" rel="noreferrer">GitHub {data.version.shortSha}</a>
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
