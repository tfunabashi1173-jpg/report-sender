<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { data, children } = $props();

	function handleSubmit(event: SubmitEvent) {
		const form = event.target;
		if (!(form instanceof HTMLFormElement) || form.method.toLowerCase() !== 'post') return;

		if (form.dataset.submitting === 'true') {
			event.preventDefault();
			return;
		}

		form.dataset.submitting = 'true';
	}
</script>

<svelte:head>
	<title>報告メール送信システム</title>
	<link rel="icon" href={favicon} />
	<link rel="apple-touch-icon" href="/app-icon.svg" />
	<link rel="manifest" href="/site.webmanifest" />
	<meta name="theme-color" content="#253041" />
</svelte:head>

<svelte:document onsubmit={handleSubmit} />

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
	:global(form[data-submitting='true'] button:not([type='button']),
		form[data-submitting='true'] input[type='submit']) {
		opacity: 0.58;
		pointer-events: none;
	}
</style>
