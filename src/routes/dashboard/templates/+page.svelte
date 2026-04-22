<script lang="ts">
	let { data, form } = $props();
</script>

<main class="page">
	<a class="back" href="/dashboard">ダッシュボードへ</a>
	<header>
		<p class="eyebrow">Templates</p>
		<h1>定型文</h1>
	</header>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}

	<div class="workspace">
		<section class="editor">
			<h2>新規作成</h2>
			<form method="POST" action="?/save">
				<input name="name" required placeholder="テンプレート名 例: 日次報告" />
				<input name="subject" required placeholder="件名 例: 本日の活動報告" />
				<textarea name="body" rows="16" required placeholder="本文を入力。{name} などの差し込み文字はそのまま残せます。"></textarea>
				<button>保存する</button>
			</form>
		</section>

		<section class="templates">
			{#if data.templates.length === 0}
				<p class="empty">定型文はまだありません。</p>
			{:else}
				{#each data.templates as template}
					<details class="template">
						<summary>
							<strong>{template.name}</strong>
							<span>{template.subject}</span>
						</summary>
						<form method="POST" action="?/save">
							<input type="hidden" name="id" value={template.id} />
							<label>
								テンプレート名
								<input name="name" value={template.name} required />
							</label>
							<label>
								件名
								<input name="subject" value={template.subject} required />
							</label>
							<label>
								本文
								<textarea name="body" rows="12" required>{template.body}</textarea>
							</label>
							<button>更新する</button>
						</form>
						<form method="POST" action="?/delete">
							<input type="hidden" name="id" value={template.id} />
							<button class="danger">削除</button>
						</form>
					</details>
				{/each}
			{/if}
		</section>
	</div>
</main>

<style>
	:global(body) { margin: 0; background: #eef1ea; font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif; color: #17211b; }
	.page { max-width: 1180px; margin: 0 auto; padding: 24px 20px 84px; }
	.back { color: #6d4d21; font-weight: 800; text-decoration: none; }
	header { margin: 22px 0; }
	.eyebrow { margin: 0 0 6px; color: #93621f; font-size: 12px; font-weight: 800; letter-spacing: .14em; }
	h1 { margin: 0; font-size: 42px; letter-spacing: -.05em; }
	.editor, .template {
		border: 1px solid rgba(23,33,27,.12);
		border-radius: 22px;
		background: rgba(255,255,255,.8);
		box-shadow: 0 14px 36px rgba(23,33,27,.08);
		padding: 18px;
	}
	.workspace { display: grid; gap: 16px; align-items: start; }
	h2 { margin: 0 0 14px; font-size: 18px; }
	form { display: grid; gap: 10px; margin-top: 10px; }
	label { display: grid; gap: 6px; font-weight: 700; font-size: 13px; }
	input, textarea {
		box-sizing: border-box;
		width: 100%;
		border: 1px solid rgba(23,33,27,.18);
		border-radius: 14px;
		padding: 12px;
		font: inherit;
		background: white;
	}
	button { border: none; border-radius: 14px; background: #f08a24; color: #1c1207; font-weight: 800; padding: 12px; }
	.templates { display: grid; gap: 12px; }
	summary { display: grid; gap: 4px; cursor: pointer; }
	summary span, .empty { color: #69746d; }
	.danger { background: rgba(191,56,42,.1); color: #a53024; }
	.error { border-radius: 14px; padding: 12px; background: #ffe8e4; color: #a53024; }
	@media (min-width: 1024px) {
		.workspace {
			grid-template-columns: minmax(420px, 0.9fr) minmax(0, 1.1fr);
		}
		.editor {
			position: sticky;
			top: 20px;
		}
		.editor textarea {
			min-height: 420px;
		}
		.template[open] {
			grid-column: span 1;
		}
	}
</style>
