<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	async function logout() {
		await data.supabase.auth.signOut();
		goto('/login');
	}
</script>

<main>
	<h1>ダッシュボード</h1>
	<p>ログイン中: {data.session?.user.phone ?? data.session?.user.email}</p>
	<button onclick={logout}>ログアウト</button>
</main>
