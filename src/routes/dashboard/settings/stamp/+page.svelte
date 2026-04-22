<script lang="ts">
	let { data, form } = $props();

	const tags = [
		{ token: '{name}', label: 'ログインユーザー名' },
		{ token: '{today}', label: '今日の日付' },
		{ token: '{floor}', label: '選択した階数' },
		{ token: '{%}', label: '選択した割合' }
	];
</script>

<main class="page">
	<a class="back" href="/dashboard">ダッシュボードへ</a>
	<header>
		<p class="eyebrow">Image Stamp</p>
		<h1>画像文字入れ設定</h1>
		<p>添付画像に入れる文字を設定します。タグと自由入力を組み合わせ、改行した内容は画像にも改行して入ります。</p>
	</header>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}
	{#if data.status === 'saved'}
		<p class="success">画像文字入れ設定を保存しました</p>
	{/if}

	<section class="card">
		<form method="POST" action="?/save">
			<div class="tag-help">
				{#each tags as tag}
					<span><strong>{tag.token}</strong> {tag.label}</span>
				{/each}
			</div>
			<label>
				画像に入れる内容
				<textarea name="template" rows="8" required>{data.template}</textarea>
			</label>
			<p class="note">例: <code>{'{name}'}</code> / <code>{'{today}'}</code> / <code>{'{floor}'}</code> / <code>{'{%}'}</code>。値が空の行は画像には入れません。</p>
			<button>保存する</button>
		</form>
	</section>
</main>

<style>
	:global(body) { margin: 0; background: #f6f7f9; color: #24262b; font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif; }
	.page { max-width: 760px; margin: 0 auto; padding: 24px 18px 112px; }
	.back { color: #6b7280; font-size: 13px; font-weight: 650; text-decoration: none; }
	header { margin: 20px 0 22px; }
	.eyebrow { margin: 0 0 8px; color: #9aa0aa; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
	h1 { margin: 0; color: #20242c; font-size: clamp(28px, 5vw, 42px); letter-spacing: -.045em; }
	header p, .note { color: #8b929d; line-height: 1.7; }
	.card { border: 0; border-radius: 24px; background: #fff; box-shadow: 0 22px 54px rgba(16,24,40,.07); padding: 22px; }
	form { display: grid; gap: 14px; }
	label { display: grid; gap: 6px; color: #3f4652; font-size: 13px; font-weight: 650; }
	textarea { box-sizing: border-box; width: 100%; border: 1px solid #e6e9ef; border-radius: 16px; background: #fff; color: #24262b; font: inherit; line-height: 1.7; padding: 12px; }
	textarea:focus { outline: 2px solid rgba(31,41,55,.12); border-color: #cfd5df; }
	.tag-help { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; border-radius: 16px; background: #f6f7f9; color: #6b7280; font-size: 13px; padding: 12px; }
	.tag-help span { display: grid; gap: 2px; }
	.tag-help strong, code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #20242c; }
	.note { margin: 0; font-size: 13px; }
	button { border: 0; border-radius: 16px; background: #1f2937; color: #fff; font-weight: 700; padding: 14px; }
	button:hover { background: #111827; }
	.error, .success { border-radius: 16px; padding: 12px; }
	.error { background: #fff1f0; color: #b42318; }
	.success { background: #ecfdf3; color: #067647; }
	@media (max-width: 620px) { .tag-help { grid-template-columns: 1fr; } }
</style>
