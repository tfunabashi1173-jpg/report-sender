<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		goto('/login');
	}
</script>

<main class="dashboard">
	<header>
		<h1>報告メール送信システム</h1>
		<button class="btn-link" onclick={logout}>ログアウト</button>
	</header>

	<p class="user">ログイン中: {data.user?.phone ?? data.user?.email ?? data.user?.id}</p>

	{#if data.profile?.role === 'admin'}
		<section class="admin-section">
			<h2>管理者メニュー</h2>
			<a href="/dashboard/invite" class="btn-secondary">ユーザーを招待する</a>
		</section>
	{/if}

	<section>
		<h2>機能（近日追加）</h2>
		<ul>
			<li>定型文作成</li>
			<li>メーリングリスト管理</li>
			<li>報告メール送信</li>
		</ul>
	</section>
</main>

<style>
	.dashboard {
		max-width: 600px;
		margin: 0 auto;
		padding: 24px;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}
	.user { font-size: 13px; color: #888; margin-bottom: 24px; }
	.admin-section { margin-bottom: 24px; }
	h2 { font-size: 16px; margin-bottom: 12px; }
	.btn-secondary {
		display: inline-block;
		padding: 10px 16px;
		background: white;
		color: #0070f3;
		border: 1px solid #0070f3;
		border-radius: 6px;
		text-decoration: none;
		font-size: 14px;
	}
	.btn-link {
		background: none;
		border: none;
		color: #0070f3;
		cursor: pointer;
		font-size: 14px;
	}
	ul { color: #888; font-size: 14px; }
</style>
