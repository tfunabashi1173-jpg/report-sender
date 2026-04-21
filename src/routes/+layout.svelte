<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { data, children } = $props();

	onMount(() => {
		const { data: { subscription } } = data.supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});
		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	<title>報告メール送信システム</title>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
