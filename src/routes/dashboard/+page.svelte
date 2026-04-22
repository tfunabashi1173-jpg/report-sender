<script lang="ts">
	import DashboardHome from '$lib/components/DashboardHome.svelte';

	let { data } = $props();
</script>

<DashboardHome {data} />
