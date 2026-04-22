<script lang="ts">
	let { data, form } = $props();
</script>

<main class="page">
	<a class="back" href="/dashboard">ダッシュボードへ</a>
	<header>
		<p class="eyebrow">Profile</p>
		<h1>ユーザー設定</h1>
		<p>ログインユーザー名と所属を編集します。署名タグの値にも反映されます。</p>
	</header>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}
	{#if data.status === 'saved'}
		<p class="success">ユーザー設定を保存しました</p>
	{/if}

	<section class="card">
		<form method="POST" action="?/save">
			<label>
				ログインユーザー名
				<input name="displayName" required value={data.profile?.displayName ?? data.user.displayName ?? ''} placeholder="山田 太郎" />
			</label>
			<label>
				所属・会社名
				<input name="organization" value={data.profile?.organization ?? data.user.organization ?? ''} placeholder="株式会社サンプル" />
			</label>
			<div class="tag-help">
				<span>{'{loginName}'}: ログインユーザー名</span>
				<span>{'{company}'}: 所属・会社名</span>
			</div>
			<button>保存する</button>
		</form>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f6f7f9;
		color: #24262b;
		font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif;
	}
	.page {
		max-width: 760px;
		margin: 0 auto;
		padding: 24px 18px 112px;
	}
	.back {
		color: #6b7280;
		font-size: 13px;
		font-weight: 650;
		text-decoration: none;
	}
	header {
		margin: 20px 0 22px;
	}
	.eyebrow {
		margin: 0 0 8px;
		color: #9aa0aa;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: .18em;
		text-transform: uppercase;
	}
	h1 {
		margin: 0;
		color: #20242c;
		font-size: clamp(28px, 5vw, 42px);
		letter-spacing: -.045em;
	}
	header p {
		color: #8b929d;
		line-height: 1.7;
	}
	.card {
		border: 0;
		border-radius: 24px;
		background: #fff;
		box-shadow: 0 22px 54px rgba(16, 24, 40, .07);
		padding: 22px;
	}
	form {
		display: grid;
		gap: 14px;
	}
	label {
		display: grid;
		gap: 6px;
		color: #3f4652;
		font-size: 13px;
		font-weight: 650;
	}
	input {
		box-sizing: border-box;
		width: 100%;
		border: 1px solid #e6e9ef;
		border-radius: 16px;
		background: #fff;
		color: #24262b;
		font: inherit;
		padding: 12px;
	}
	input:focus {
		outline: 2px solid rgba(31, 41, 55, .12);
		border-color: #cfd5df;
	}
	.tag-help {
		display: grid;
		gap: 6px;
		border-radius: 16px;
		background: #f6f7f9;
		color: #6b7280;
		font-size: 13px;
		line-height: 1.7;
		padding: 12px;
	}
	button {
		border: 0;
		border-radius: 16px;
		background: #1f2937;
		color: #fff;
		font-weight: 700;
		padding: 14px;
	}
	button:hover {
		background: #111827;
	}
	.error,
	.success {
		border-radius: 16px;
		padding: 12px;
	}
	.error {
		background: #fff1f0;
		color: #b42318;
	}
	.success {
		background: #ecfdf3;
		color: #067647;
	}
</style>
