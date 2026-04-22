<script lang="ts">
	let { data, form } = $props();
</script>

<main class="page">
	<a class="back" href="/dashboard">ダッシュボードへ</a>
	<header>
		<p class="eyebrow">Mail Server</p>
		<h1>送信メール設定</h1>
		<p>メールアプリは使わず、このサーバーから直接送信します。</p>
	</header>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}
	{#if form?.success}
		<p class="success">保存しました</p>
	{/if}

	<section class="card">
		<form method="POST" action="?/save">
			<label>
				送信サービス
				<select name="provider" required>
					<option value="resend" selected={data.settings?.provider === 'resend'}>Resend</option>
					<option value="sendgrid" selected={data.settings?.provider === 'sendgrid'}>SendGrid</option>
				</select>
			</label>
			<label>
				APIキー
				<input name="apiKey" type="password" required autocomplete="off" placeholder="API Key" />
			</label>
			<label>
				送信元メールアドレス
				<input name="fromEmail" type="email" required value={data.settings?.fromEmail ?? ''} placeholder="report@example.com" />
			</label>
			<label>
				送信元名
				<input name="fromName" value={data.settings?.fromName ?? ''} placeholder="報告メール送信システム" />
			</label>
			<label>
				返信先メールアドレス
				<input name="replyTo" type="email" value={data.settings?.replyTo ?? ''} placeholder="reply@example.com" />
			</label>
			<button>保存する</button>
		</form>
	</section>

	<section class="note">
		<h2>注意</h2>
		<p>Cloudflare Workers から通常の SMTP サーバーへ直接接続する方式は採用していません。Resend または SendGrid の HTTP API で送信します。</p>
		<p>APIキーは管理者のみが更新できます。画面には保存済みキーを再表示しません。</p>
	</section>
</main>

<style>
	:global(body) { margin: 0; background: linear-gradient(150deg, #f7efe1, #e6f0ee); font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif; color: #17211b; }
	.page { max-width: 820px; margin: 0 auto; padding: 24px 20px 92px; }
	.back { color: #6d4d21; font-weight: 800; text-decoration: none; }
	header { margin: 22px 0; }
	.eyebrow { margin: 0 0 6px; color: #93621f; font-size: 12px; font-weight: 800; letter-spacing: .14em; }
	h1 { margin: 0; font-size: clamp(34px, 7vw, 52px); letter-spacing: -.05em; }
	header p, .note p { color: #69746d; line-height: 1.7; }
	.card, .note {
		margin-top: 14px;
		border: 1px solid rgba(23,33,27,.12);
		border-radius: 22px;
		background: rgba(255,255,255,.82);
		box-shadow: 0 14px 36px rgba(23,33,27,.08);
		padding: 18px;
	}
	form { display: grid; gap: 12px; }
	label { display: grid; gap: 6px; font-size: 13px; font-weight: 800; }
	input, select { box-sizing: border-box; width: 100%; border: 1px solid rgba(23,33,27,.18); border-radius: 14px; padding: 12px; font: inherit; background: white; }
	button { border: none; border-radius: 14px; background: #f08a24; color: #1c1207; font-weight: 900; padding: 14px; }
	.error, .success { border-radius: 14px; padding: 12px; }
	.error { background: #ffe8e4; color: #a53024; }
	.success { background: #e5f7df; color: #246b2c; }
	@media (min-width: 960px) {
		.page { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 16px; align-items: start; }
		.back, header, .error, .success { grid-column: 1 / -1; }
		.note { position: sticky; top: 20px; }
	}
</style>
