<script lang="ts">
	let { data, form } = $props();

	function statusMessage(status: string | null | undefined) {
		if (status === 'saved') return 'SMTP設定を保存しました';
		if (status === 'connected') return 'SMTPサーバーへの接続と認証に成功しました';
		if (status === 'test-sent') return 'テストメールを送信しました';
		return '';
	}

	let successMessage = $derived(statusMessage(data.status));
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
	{#if successMessage}
		<p class="success">{successMessage}</p>
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

	<section class="card test-card">
		<div>
			<h2>接続テスト</h2>
			<p>保存済みのSMTP設定で、接続・暗号化・認証まで確認します。</p>
		</div>
		<form method="POST" action="?/testConnection">
			<button class="secondary" disabled={!data.settings}>接続をテストする</button>
		</form>
	</section>

	<section class="card test-card">
		<div>
			<h2>テストメール送信</h2>
			<p>保存済みのSMTP設定で、指定したアドレスへテストメールを送信します。</p>
		</div>
		<form method="POST" action="?/sendTest">
			<label>
				テスト送信先
				<input name="testEmail" type="email" required placeholder="test@example.co.jp" />
			</label>
			<button class="secondary" disabled={!data.settings}>テストメールを送信する</button>
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
	.test-card { margin-top: 14px; }
	.test-card h2 { margin: 0 0 8px; }
	.test-card p { margin: 0 0 14px; color: #61675f; line-height: 1.7; }
	form { display: grid; gap: 14px; }
	.grid { display: grid; gap: 14px; }
	label { display: grid; gap: 6px; font-size: 13px; font-weight: 800; }
	input, select { box-sizing: border-box; width: 100%; border: 1px solid rgba(32,35,31,.18); border-radius: 12px; padding: 12px; font: inherit; background: white; }
	button { border: none; border-radius: 12px; background: #334f3c; color: white; font-weight: 900; padding: 14px; }
	button:disabled { opacity: .55; cursor: not-allowed; }
	.secondary { background: #20231f; }
	.error, .success { border-radius: 12px; padding: 12px; }
	.error { background: #ffe8e4; color: #a53024; }
	.success { background: #e5f7df; color: #246b2c; }
	@media (min-width: 760px) {
		.grid { grid-template-columns: 1fr 1fr; }
	}

	:global(body) { background: #f6f7f9; color: #24262b; }
	.page { max-width: 1120px; padding: 24px 18px 112px; }
	.back, .mini { color: #6b7280; font-size: 13px; font-weight: 650; text-decoration: none; }
	header { margin: 20px 0 22px; }
	.eyebrow { color: #9aa0aa; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
	h1 { color: #20242c; font-size: clamp(28px, 5vw, 42px); letter-spacing: -.045em; }
	.card, .row, .editor, .template, .list-card, .result { border: 0 !important; border-radius: 24px; background: #fff; box-shadow: 0 22px 54px rgba(16,24,40,.07); }
	.card, .editor, .template, .list-card { padding: 22px; }
	.workspace, .composer, .lists, .templates, .list { gap: 18px; }
	h2 { color: #262a33; font-weight: 650; }
	label { color: #3f4652; font-weight: 650; }
	input, textarea, select { border: 1px solid #e6e9ef; border-radius: 16px; background: #fff; color: #24262b; }
	input:focus, textarea:focus, select:focus { outline: 2px solid rgba(31,41,55,.12); border-color: #cfd5df; }
	button, .btn-primary, .btn-copy, .btn-share { border: 0; border-radius: 16px; background: #1f2937; color: #fff; font-weight: 700; }
	button:hover, .btn-primary:hover, .btn-copy:hover, .btn-share:hover { background: #111827; }
	.danger, .plain { background: #fff1f0 !important; color: #b42318 !important; }
	.error { border: 0; border-radius: 16px; background: #fff1f0; color: #b42318; }
	.success { border: 0; border-radius: 16px; background: #ecfdf3; color: #067647; }
	.empty, small, .row span, .row small, .list-head p, summary span, .tag-panel small, .tags span, header p, .status { color: #8b929d; }
</style>
