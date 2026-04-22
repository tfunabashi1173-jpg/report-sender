<script lang="ts">
	let { data, form } = $props();
</script>

<main class="page">
	<a class="back" href="/dashboard">ダッシュボードへ</a>
	<header>
		<div>
			<p class="eyebrow">Contacts</p>
			<h1>連絡先</h1>
		</div>
	</header>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}

	<div class="workspace">
		<section class="card">
			<h2>連絡先を追加</h2>
			<form method="POST" action="?/create">
				<label>
					名前
					<input name="name" required placeholder="山田 太郎" />
				</label>
				<label>
					メールアドレス
					<input name="email" type="email" required placeholder="name@example.com" />
				</label>
				<label>
					所属
					<input name="organization" placeholder="学校・団体・会社など" />
				</label>
				<label>
					メモ
					<textarea name="note" rows="5" placeholder="送信時に確認したい補足"></textarea>
				</label>
				<button>追加する</button>
			</form>
		</section>

		<section class="list">
			<div class="list-head">
				<h2>登録済み</h2>
				<div class="sort-tabs" aria-label="連絡先の並び替え">
					<a class:active={data.sort === 'name'} href="/dashboard/contacts?sort=name">名前順</a>
					<a class:active={data.sort === 'organization'} href="/dashboard/contacts?sort=organization">会社順</a>
				</div>
			</div>
			{#if data.contacts.length === 0}
				<p class="empty">連絡先はまだありません。</p>
			{:else}
				{#each data.contacts as contact}
					<article class="row">
						<div>
							<strong>{contact.name}</strong>
							<span>{contact.email}</span>
							{#if contact.organization}
								<small>{contact.organization}</small>
							{/if}
						</div>
						<form method="POST" action="?/delete">
							<input type="hidden" name="id" value={contact.id} />
							<button class="danger" aria-label={`${contact.name}を削除`}>削除</button>
						</form>
					</article>
				{/each}
			{/if}
		</section>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f4efe4;
		font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif;
		color: #17211b;
	}
	.page {
		max-width: 1120px;
		margin: 0 auto;
		padding: 24px 20px 84px;
	}
	.back {
		color: #6d4d21;
		font-weight: 700;
		text-decoration: none;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: end;
		margin: 22px 0;
	}
	.eyebrow {
		margin: 0 0 6px;
		color: #93621f;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.14em;
	}
	h1 {
		margin: 0;
		font-size: 42px;
		letter-spacing: -0.05em;
	}
	header span {
		padding: 8px 12px;
		border-radius: 999px;
		background: #17211b;
		color: white;
	}
	.card,
	.row {
		border: 1px solid rgba(23, 33, 27, 0.12);
		border-radius: 22px;
		background: rgba(255, 255, 255, 0.78);
		box-shadow: 0 14px 36px rgba(23, 33, 27, 0.08);
	}
	.card {
		padding: 18px;
	}
	.workspace {
		display: grid;
		gap: 16px;
		align-items: start;
	}
	h2 {
		margin: 0 0 14px;
		font-size: 18px;
	}
	form {
		display: grid;
		gap: 12px;
	}
	label {
		display: grid;
		gap: 6px;
		font-size: 13px;
		font-weight: 700;
	}
	input,
	textarea {
		box-sizing: border-box;
		width: 100%;
		border: 1px solid rgba(23, 33, 27, 0.18);
		border-radius: 14px;
		padding: 12px;
		font: inherit;
		background: white;
	}
	button {
		border: none;
		border-radius: 14px;
		background: #f08a24;
		color: #1c1207;
		font-weight: 800;
		padding: 12px 14px;
	}
	.list {
		display: grid;
		gap: 10px;
	}
	.list-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.list-head h2 {
		margin: 0;
	}
	.sort-tabs {
		display: flex;
		gap: 6px;
		padding: 4px;
		border-radius: 999px;
		background: rgba(23, 33, 27, 0.06);
	}
	.sort-tabs a {
		border-radius: 999px;
		padding: 8px 12px;
		color: #69746d;
		font-size: 13px;
		font-weight: 800;
		text-decoration: none;
	}
	.sort-tabs a.active {
		background: #17211b;
		color: white;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		padding: 14px;
	}
	.row div {
		display: grid;
		gap: 3px;
		min-width: 0;
	}
	.row form {
		flex: 0 0 auto;
	}
	.row .danger {
		min-width: 72px;
	}
	.row span,
	.row small,
	.empty {
		color: #69746d;
		word-break: break-all;
	}
	.danger {
		background: rgba(191, 56, 42, 0.1);
		color: #a53024;
	}
	.error {
		border-radius: 14px;
		padding: 12px;
		background: #ffe8e4;
		color: #a53024;
	}
	@media (min-width: 960px) {
		.workspace {
			grid-template-columns: minmax(320px, 0.42fr) minmax(0, 1fr);
		}
		.card {
			position: sticky;
			top: 20px;
		}
		.row {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: center;
		}
		.row div {
			display: grid;
		}
		.row form {
			justify-self: end;
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
	.danger, .plain { background: #fff1f0 !important; color: #b42318 !important; }
	.error { border: 0; border-radius: 16px; background: #fff1f0; color: #b42318; }
	.success { border: 0; border-radius: 16px; background: #ecfdf3; color: #067647; }
	.empty, small, .row span, .row small, .list-head p, summary span, .tag-panel small, .tags span, header p, .status { color: #8b929d; }
</style>
