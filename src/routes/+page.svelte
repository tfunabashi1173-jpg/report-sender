<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';
	import DashboardHome from '$lib/components/DashboardHome.svelte';

	let { data } = $props();
</script>

<DashboardHome {data} />
<BottomNav />
