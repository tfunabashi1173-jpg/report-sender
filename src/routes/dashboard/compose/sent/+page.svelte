<main class="page">
	<section class="card">
		<p class="eyebrow">Sent</p>
		<h1>送信しました</h1>
		<p>報告メールの送信が完了しました。</p>
		<a class="button" href="/dashboard">OK</a>
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
		min-height: 100svh;
		place-items: center;
		padding: 24px;
	}
	.card {
		display: grid;
		gap: 14px;
		width: min(100%, 420px);
		border-radius: 28px;
		background: #fff;
		box-shadow: 0 22px 54px rgba(16,24,40,.08);
		padding: 28px;
		text-align: center;
	}
	.eyebrow {
		margin: 0;
		color: #9aa0aa;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: .18em;
		text-transform: uppercase;
	}
	h1 {
		margin: 0;
		color: #20242c;
		font-size: clamp(30px, 8vw, 42px);
		letter-spacing: -.045em;
	}
	p {
		margin: 0;
		color: #6b7280;
		line-height: 1.7;
	}
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 48px;
		border-radius: 16px;
		background: #1f2937;
		color: #fff;
		font-weight: 800;
		text-decoration: none;
	}
	.button:hover { background: #111827; }
</style>
