<script lang="ts">
	let { data, form } = $props();
	let newName = $state('');
	let newSubject = $state('');
	let newBody = $state('');
	let previewSite = $state('');
	let previewFloor = $state('');
	let previewPercent = $state('');

	const tags = [
		{ label: '今日の日付', token: '{today}', description: '例: 4月22日 21時10分' },
		{ label: '現場名', token: '{site}', description: 'メール作成時に入力した現場名を代入' },
		{ label: 'フロア', token: '{floor}', description: 'メール作成時に選んだ階を代入' },
		{ label: '割合', token: '{%}', description: 'メール作成時に選んだ10〜100%を代入' }
	];
	const floors = Array.from({ length: 60 }, (_, index) => `${index + 1}階`);
	const percents = Array.from({ length: 10 }, (_, index) => `${(index + 1) * 10}%`);

	function appendTag(token: string) {
		newBody = `${newBody}${newBody ? '\n' : ''}${token}`;
	}

	function formatToday() {
		const now = new Date();
		const pad = (value: number) => String(value).padStart(2, '0');
		return `${now.getMonth() + 1}月${now.getDate()}日 ${pad(now.getHours())}時${pad(now.getMinutes())}分`;
	}

	function previewTags(value: string) {
		return value
			.replaceAll('{today}', formatToday())
			.replaceAll('{{today}}', formatToday())
			.replaceAll('{site}', previewSite)
			.replaceAll('{{site}}', previewSite)
			.replaceAll('{floor}', previewFloor)
			.replaceAll('{{floor}}', previewFloor)
			.replaceAll('{%}', previewPercent);
	}
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
			<div class="tag-panel">
				<p>使えるタグ</p>
				<div class="tags">
					{#each tags as tag}
						<button type="button" onclick={() => appendTag(tag.token)}>
							<strong>{tag.token}</strong>
							<span>{tag.label}</span>
						</button>
					{/each}
				</div>
				<small>{'{site}'} はメール作成画面で入力する現場名、{'{floor}'} は選択したフロア、{'{%}'} は選択した割合に置換されます。タグはテンプレート名・件名・本文で使えます。</small>
			</div>
			<div class="tag-settings">
				<p>タグ設定</p>
				<label>
					現場名 {'{site}'}
					<input bind:value={previewSite} placeholder="例: 舟橋ビル改修工事" />
				</label>
				<label>
					フロア {'{floor}'}
					<select bind:value={previewFloor}>
						<option value="">選択しない</option>
						{#each floors as floor}
							<option value={floor}>{floor}</option>
						{/each}
					</select>
				</label>
				<label>
					割合 {'{%}'}
					<select bind:value={previewPercent}>
						<option value="">選択しない</option>
						{#each percents as percent}
							<option value={percent}>{percent}</option>
						{/each}
					</select>
				</label>
				<small>ここは定型文作成時の確認用です。保存する定型文にはタグを残し、実際の値はメール作成時にも入力できます。</small>
			</div>
			<form method="POST" action="?/save">
				<input bind:value={newName} name="name" required placeholder={`テンプレート名 例: {site} 日次報告`} />
				{#if newName}
					<small class="preview">表示例: {previewTags(newName)}</small>
				{/if}
				<input bind:value={newSubject} name="subject" required placeholder={`件名 例: {site} 本日の活動報告`} />
				{#if newSubject}
					<small class="preview">表示例: {previewTags(newSubject)}</small>
				{/if}
				<textarea name="body" bind:value={newBody} rows="16" required placeholder={`本文を入力。例: {site} / {floor} / {%}`}></textarea>
				{#if newBody}
					<pre class="body-preview">{previewTags(newBody)}</pre>
				{/if}
				<div class="list-picker">
					<strong>メイン宛先リスト</strong>
					{#if data.lists.length === 0}
						<small>宛先リストがありません。</small>
					{:else}
						{#each data.lists as list}
							<label class="check">
								<input type="checkbox" name="toListIds" value={list.id} />
								<span>{list.name}</span>
							</label>
						{/each}
					{/if}
				</div>
				<div class="list-picker">
					<strong>CCリスト</strong>
					{#if data.lists.length === 0}
						<small>宛先リストがありません。</small>
					{:else}
						{#each data.lists as list}
							<label class="check">
								<input type="checkbox" name="ccListIds" value={list.id} />
								<span>{list.name}</span>
							</label>
						{/each}
					{/if}
				</div>
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
								<textarea name="body" rows="12" required placeholder={`{site} / {floor} / {%} が使えます`}>{template.body}</textarea>
							</label>
							<div class="list-picker">
								<strong>メイン宛先リスト</strong>
								{#if data.lists.length === 0}
									<small>宛先リストがありません。</small>
								{:else}
									{#each data.lists as list}
										<label class="check">
											<input type="checkbox" name="toListIds" value={list.id} checked={template.toListIds.includes(list.id)} />
											<span>{list.name}</span>
										</label>
									{/each}
								{/if}
							</div>
							<div class="list-picker">
								<strong>CCリスト</strong>
								{#if data.lists.length === 0}
									<small>宛先リストがありません。</small>
								{:else}
									{#each data.lists as list}
										<label class="check">
											<input type="checkbox" name="ccListIds" value={list.id} checked={template.ccListIds.includes(list.id)} />
											<span>{list.name}</span>
										</label>
									{/each}
								{/if}
							</div>
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
	.tag-panel {
		display: grid;
		gap: 10px;
		margin-bottom: 14px;
		padding: 14px;
		border-radius: 18px;
		background: rgba(23,33,27,.05);
	}
	.tag-panel p {
		margin: 0;
		font-size: 13px;
		font-weight: 800;
	}
	.tags {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}
	.tags button {
		display: grid;
		gap: 3px;
		background: white;
		color: #17211b;
		text-align: left;
		padding: 10px;
	}
	.tags button:hover,
	.tags button:hover span {
		color: #fff;
	}
	.tags strong {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 13px;
	}
	.tags span, .tag-panel small {
		color: #69746d;
		font-size: 12px;
	}
	.tag-settings {
		display: grid;
		gap: 10px;
		margin: 0 0 14px;
		border-radius: 18px;
		background: #f8fafc;
		padding: 14px;
	}
	.tag-settings p {
		margin: 0;
		color: #24262b;
		font-size: 13px;
		font-weight: 800;
	}
	.tag-settings dl {
		display: grid;
		gap: 8px;
		margin: 0;
	}
	.tag-settings dl div {
		display: grid;
		grid-template-columns: 74px 1fr;
		gap: 10px;
		align-items: start;
	}
	.tag-settings dt {
		margin: 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 13px;
		font-weight: 800;
	}
	.tag-settings dd {
		margin: 0;
		color: #69746d;
		font-size: 12px;
		line-height: 1.6;
	}
	.tag-settings label {
		margin: 0;
	}
	.tag-settings select {
		box-sizing: border-box;
		width: 100%;
		border: 1px solid rgba(23,33,27,.18);
		border-radius: 14px;
		background: white;
		padding: 12px;
		font: inherit;
	}
	.preview {
		display: block;
		margin-top: -4px;
		border-radius: 12px;
		background: #f8fafc;
		padding: 10px 12px;
	}
	.body-preview {
		overflow: auto;
		max-height: 220px;
		margin: -2px 0 0;
		border-radius: 14px;
		background: #f8fafc;
		color: #3f4652;
		padding: 12px;
		white-space: pre-wrap;
		font: inherit;
		font-size: 13px;
		line-height: 1.7;
	}
	form { display: grid; gap: 10px; margin-top: 10px; }
	label { display: grid; gap: 6px; font-weight: 700; font-size: 13px; }
	.list-picker {
		display: grid;
		gap: 8px;
		padding: 12px;
		border-radius: 16px;
		background: rgba(23,33,27,.05);
	}
	.list-picker strong {
		font-size: 13px;
		font-weight: 800;
	}
	.check {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0;
	}
	.check input {
		width: auto;
	}
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
	.tags button:hover,
	.tags button:hover span {
		color: #fff;
	}
	.danger, .plain { background: #fff1f0 !important; color: #b42318 !important; }
	.error { border: 0; border-radius: 16px; background: #fff1f0; color: #b42318; }
	.success { border: 0; border-radius: 16px; background: #ecfdf3; color: #067647; }
	.empty, small, .row span, .row small, .list-head p, summary span, .tag-panel small, .tags span, header p, .status { color: #8b929d; }
</style>
