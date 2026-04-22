<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';

	let { children } = $props();
</script>

{@render children()}
<BottomNav />

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
</style>
