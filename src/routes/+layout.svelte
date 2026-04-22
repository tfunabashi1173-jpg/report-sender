<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<title>報告メール送信システム</title>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
