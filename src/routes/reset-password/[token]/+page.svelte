<script lang="ts">
	let { data, form } = $props();
</script>

<main class="page">
	<section class="card">
		<p class="eyebrow">Password Reset</p>
		<h1>ログインパスワード再設定</h1>
		{#if data.isValid}
			<p class="lead">新しいログインパスワードを2回入力してください。再設定完了後、登録済みパスキーは削除されます。</p>
		{:else}
			<p class="error">再設定URLが無効または期限切れです。ログインページから再度手続きしてください。</p>
		{/if}

		{#if form?.error}
			<p class="error">{form.error}</p>
		{/if}

		{#if data.isValid}
			<form method="POST">
				<label>
					新しいパスワード
					<input name="password" type="password" minlength="8" required autocomplete="new-password" placeholder="8文字以上" />
				</label>
				<label>
					新しいパスワードを再入力
					<input name="passwordConfirm" type="password" minlength="8" required autocomplete="new-password" placeholder="同じパスワードを入力" />
				</label>
				<button>パスワードを再設定する</button>
			</form>
		{/if}
		<a class="back" href="/login">ログインへ戻る</a>
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
		display: grid;
		place-items: center;
		min-height: 100svh;
		padding: 24px;
		box-sizing: border-box;
	}
	.card {
		width: min(100%, 440px);
		border-radius: 28px;
		background: #fff;
		box-shadow: 0 24px 70px rgba(16, 24, 40, .10);
		padding: 26px;
	}
	.eyebrow {
		margin: 0 0 8px;
		color: #9aa0aa;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: .18em;
		text-transform: uppercase;
	}
	h1 {
		margin: 0;
		font-size: clamp(28px, 8vw, 40px);
		letter-spacing: -.05em;
	}
	.lead {
		color: #6b7280;
		line-height: 1.7;
	}
	form {
		display: grid;
		gap: 14px;
		margin-top: 18px;
	}
	label {
		display: grid;
		gap: 6px;
		color: #3f4652;
		font-size: 13px;
		font-weight: 700;
	}
	input {
		box-sizing: border-box;
		width: 100%;
		border: 1px solid #e6e9ef;
		border-radius: 16px;
		padding: 13px;
		font: inherit;
	}
	input:focus {
		outline: 2px solid rgba(31,41,55,.12);
		border-color: #cfd5df;
	}
	button {
		border: 0;
		border-radius: 16px;
		background: #1f2937;
		color: #fff;
		font-weight: 800;
		padding: 14px;
	}
	.back {
		display: inline-block;
		margin-top: 16px;
		color: #6b7280;
		font-size: 13px;
		font-weight: 700;
		text-decoration: none;
	}
	.error {
		border-radius: 16px;
		background: #fff1f0;
		color: #b42318;
		padding: 12px;
	}
</style>
