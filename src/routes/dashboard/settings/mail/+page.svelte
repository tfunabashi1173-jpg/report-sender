<script lang="ts">
	let { data, form } = $props();
</script>

<main class="page">
	<a class="back" href="/dashboard">ダッシュボードへ</a>
	<header>
		<p class="eyebrow">SMTP</p>
		<h1>送信メールサーバー設定</h1>
		<p>自社で利用しているSMTPサーバーの接続情報を入力します。</p>
	</header>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}
	{#if form?.success}
		<p class="success">保存しました</p>
	{/if}

	<section class="card">
		<form method="POST" action="?/save">
			<div class="grid">
				<label>
					SMTPホスト
					<input name="host" required value={data.settings?.host ?? ''} placeholder="smtp.example.co.jp" />
				</label>
				<label>
					ポート
					<input name="port" type="number" required value={data.settings?.port ?? 587} placeholder="587" />
				</label>
			</div>
			<label>
				暗号化
				<select name="secureMode" required>
					<option value="starttls" selected={!data.settings || data.settings.secureMode === 'starttls'}>STARTTLS</option>
					<option value="tls" selected={data.settings?.secureMode === 'tls'}>TLS/SSL</option>
					<option value="plain" selected={data.settings?.secureMode === 'plain'}>なし</option>
				</select>
			</label>
			<div class="grid">
				<label>
					ユーザー名
					<input name="username" value={data.settings?.username ?? ''} autocomplete="off" />
				</label>
				<label>
					パスワード
					<input name="password" type="password" autocomplete="off" placeholder={data.settings ? '変更時のみ入力' : 'SMTPパスワード'} />
				</label>
			</div>
			<label>
				送信元メールアドレス
				<input name="fromEmail" type="email" required value={data.settings?.fromEmail ?? ''} placeholder="report@example.co.jp" />
			</label>
			<div class="grid">
				<label>
					送信元名
					<input name="fromName" value={data.settings?.fromName ?? ''} placeholder="報告メール送信システム" />
				</label>
				<label>
					返信先メールアドレス
					<input name="replyTo" type="email" value={data.settings?.replyTo ?? ''} placeholder="reply@example.co.jp" />
				</label>
			</div>
			<button>保存する</button>
		</form>
	</section>
</main>

<style>
	:global(body) { margin: 0; background: #f4f0e8; font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif; color: #20231f; }
	.page { max-width: 920px; margin: 0 auto; padding: 28px 20px 92px; }
	.back { color: #3f5f49; font-weight: 800; text-decoration: none; }
	header { margin: 24px 0; }
	.eyebrow { margin: 0 0 8px; color: #6b7f42; font-size: 12px; font-weight: 800; letter-spacing: .16em; }
	h1 { margin: 0; font-size: clamp(34px, 6vw, 54px); letter-spacing: -.05em; }
	header p { color: #61675f; line-height: 1.7; }
	.card { border: 1px solid rgba(32,35,31,.14); border-radius: 18px; background: rgba(255,255,255,.84); padding: 22px; box-shadow: 0 18px 50px rgba(55,48,38,.08); }
	form { display: grid; gap: 14px; }
	.grid { display: grid; gap: 14px; }
	label { display: grid; gap: 6px; font-size: 13px; font-weight: 800; }
	input, select { box-sizing: border-box; width: 100%; border: 1px solid rgba(32,35,31,.18); border-radius: 12px; padding: 12px; font: inherit; background: white; }
	button { border: none; border-radius: 12px; background: #334f3c; color: white; font-weight: 900; padding: 14px; }
	.error, .success { border-radius: 12px; padding: 12px; }
	.error { background: #ffe8e4; color: #a53024; }
	.success { background: #e5f7df; color: #246b2c; }
	@media (min-width: 760px) {
		.grid { grid-template-columns: 1fr 1fr; }
	}
</style>
