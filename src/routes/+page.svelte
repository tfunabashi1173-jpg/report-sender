<script lang="ts">
	let { data } = $props();
</script>

<main>
	<h1>報告メール送信システム</h1>
	{#if data.session}
		<p>ログイン中: {data.user?.displayName ?? data.user?.id}</p>
		<a href="/dashboard">ダッシュボードへ</a>
	{:else}
		<a href="/login">ログイン</a>
	{/if}
</main>
