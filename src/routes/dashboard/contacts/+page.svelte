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
		<span>{data.contacts.length}件</span>
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
	.row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 14px;
	}
	.row div {
		display: grid;
		gap: 3px;
		min-width: 0;
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
			grid-template-columns: minmax(10rem, 1.1fr) minmax(14rem, 1.2fr) auto;
			align-items: center;
		}
		.row div {
			display: contents;
		}
		.row strong,
		.row span,
		.row small {
			min-width: 0;
		}
		.row form {
			justify-self: end;
		}
	}
</style>
