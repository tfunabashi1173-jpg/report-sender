<script lang="ts">
	let { data, form } = $props();
	let selectedTemplateId = $state('');
	let subject = $state('');
	let body = $state('');

	function applyTemplate() {
		const template = data.templates.find((item) => item.id === selectedTemplateId);
		if (!template) return;
		subject = template.subject;
		body = template.body;
	}
</script>

<main class="page">
	<a class="back" href="/dashboard">ダッシュボードへ</a>
	<header>
		<p class="eyebrow">Compose</p>
		<h1>報告メール作成</h1>
	</header>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}
	{#if !data.mailConfigured}
		<p class="error">送信メール設定が未設定です。管理者が設定するとサーバー送信できます。</p>
	{/if}

	<form class="composer" method="POST" enctype="multipart/form-data">
		<section class="card">
			<h2>本文</h2>
			<label>
				定型文
				<div class="template-row">
					<select bind:value={selectedTemplateId}>
						<option value="">選択しない</option>
						{#each data.templates as template}
							<option value={template.id}>{template.name}</option>
						{/each}
					</select>
					<button type="button" class="sub-button" onclick={applyTemplate}>反映</button>
				</div>
			</label>
			<label>
				件名
				<input name="subject" bind:value={subject} required placeholder="本日の活動報告" />
			</label>
			<label>
				本文
				<textarea name="body" bind:value={body} rows="12" required placeholder="報告内容を入力"></textarea>
			</label>
		</section>

		<section class="card">
			<h2>メイン宛先</h2>
			<div class="checks">
				{#each data.lists as list}
					<label class="check">
						<input type="checkbox" name="toListIds" value={list.id} />
						<span>リスト: {list.name}</span>
					</label>
				{/each}
				{#each data.contacts as contact}
					<label class="check">
						<input type="checkbox" name="toContactIds" value={contact.id} />
						<span>{contact.name}<small>{contact.email}</small></span>
					</label>
				{/each}
			</div>
			<h2 class="cc-title">CC</h2>
			<div class="checks">
				{#each data.lists as list}
					<label class="check">
						<input type="checkbox" name="ccListIds" value={list.id} />
						<span>リスト: {list.name}</span>
					</label>
				{/each}
				{#each data.contacts as contact}
					<label class="check">
						<input type="checkbox" name="ccContactIds" value={contact.id} />
						<span>{contact.name}<small>{contact.email}</small></span>
					</label>
				{/each}
			</div>
			<label class="attachment">
				画像添付
				<input name="attachments" type="file" accept="image/*" multiple />
				<small>スマホではカメラまたはライブラリから選択できます。画像は保存せず、送信時だけ添付します。</small>
			</label>
			{#if data.contacts.length === 0}
				<p class="empty">送信先がありません。<a href="/dashboard/contacts">連絡先を追加</a>してください。</p>
			{/if}
		</section>

		<div class="actions">
			<button formaction="?/draft" class="secondary">下書き保存</button>
			<button formaction="?/send" class="primary" disabled={!data.mailConfigured}>サーバーから送信</button>
		</div>
	</form>
</main>

<style>
	:global(body) { margin: 0; background: linear-gradient(150deg, #f7efe1, #e6f0ee); font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif; color: #17211b; }
	.page { max-width: 1180px; margin: 0 auto; padding: 24px 20px 92px; }
	.back { color: #6d4d21; font-weight: 800; text-decoration: none; }
	header { margin: 22px 0; }
	.eyebrow { margin: 0 0 6px; color: #93621f; font-size: 12px; font-weight: 800; letter-spacing: .14em; }
	h1 { margin: 0; font-size: 42px; letter-spacing: -.05em; }
	.composer { display: grid; gap: 14px; align-items: start; }
	.card {
		border: 1px solid rgba(23,33,27,.12);
		border-radius: 22px;
		background: rgba(255,255,255,.82);
		box-shadow: 0 14px 36px rgba(23,33,27,.08);
		padding: 18px;
	}
	h2 { margin: 0 0 14px; font-size: 18px; }
	.cc-title { margin-top: 20px; }
	label { display: grid; gap: 6px; margin-top: 12px; font-size: 13px; font-weight: 800; }
	input, textarea, select {
		box-sizing: border-box;
		width: 100%;
		border: 1px solid rgba(23,33,27,.18);
		border-radius: 14px;
		padding: 12px;
		font: inherit;
		background: white;
	}
	.template-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
	.checks { display: grid; gap: 8px; }
	.check {
		display: flex;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 10px;
		margin: 0;
		padding: 12px;
		border-radius: 14px;
		background: rgba(23,33,27,.06);
	}
	.check input { width: auto; }
	.check span { display: grid; gap: 2px; }
	.attachment { padding-top: 14px; border-top: 1px solid rgba(23,33,27,.12); }
	small, .empty { color: #69746d; }
	.actions {
		position: sticky;
		bottom: 12px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		padding: 10px;
		border-radius: 22px;
		background: rgba(255,255,255,.88);
		backdrop-filter: blur(10px);
	}
	button { border: none; border-radius: 14px; font-weight: 900; padding: 14px; }
	button:disabled { opacity: .55; cursor: not-allowed; }
	.primary, .sub-button { background: #f08a24; color: #1c1207; }
	.secondary { background: #17211b; color: white; }
	.error { border-radius: 14px; padding: 12px; background: #ffe8e4; color: #a53024; }
	@media (max-width: 620px) {
		.template-row, .actions { grid-template-columns: 1fr; }
	}
	@media (min-width: 1024px) {
		.composer {
			grid-template-columns: minmax(0, 1fr) 360px;
		}
		.card:first-child {
			min-height: 640px;
		}
		.card:first-child textarea {
			min-height: 420px;
		}
		.card:nth-child(2) {
			position: sticky;
			top: 20px;
			max-height: calc(100vh - 40px);
			overflow: auto;
		}
		.actions {
			grid-column: 1 / -1;
			position: static;
			grid-template-columns: 220px 1fr;
			justify-self: end;
			width: min(100%, 520px);
		}
	}
</style>
