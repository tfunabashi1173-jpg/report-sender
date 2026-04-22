<script lang="ts">
	let { data, form } = $props();

	function membersFor(listId: string) {
		return data.members.filter((member) => member.listId === listId);
	}
</script>

<main class="page">
	<a class="back" href="/dashboard">ダッシュボードへ</a>
	<header>
		<div>
			<p class="eyebrow">Recipient Lists</p>
			<h1>宛先リスト</h1>
		</div>
		<a class="mini" href="/dashboard/contacts">連絡先を追加</a>
	</header>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}

	<section class="card">
		<h2>新しいリスト</h2>
		<form method="POST" action="?/create">
			<input name="name" required placeholder="例: 保護者全体" />
			<textarea name="description" rows="2" placeholder="用途や対象"></textarea>
			<button>リストを作成</button>
		</form>
	</section>

	<section class="lists">
		{#if data.lists.length === 0}
			<p class="empty">宛先リストはまだありません。</p>
		{:else}
			{#each data.lists as list}
				<article class="list-card">
					<div class="list-head">
						<div>
							<h2>{list.name}</h2>
							<p>{list.description ?? '説明なし'} / {list.memberCount}件</p>
						</div>
						<form method="POST" action="?/delete">
							<input type="hidden" name="id" value={list.id} />
							<button class="danger">削除</button>
						</form>
					</div>

					<form class="add" method="POST" action="?/addMember">
						<input type="hidden" name="listId" value={list.id} />
						<select name="contactId" required>
							<option value="">連絡先を選択</option>
							{#each data.contacts as contact}
								<option value={contact.id}>{contact.name} / {contact.email}</option>
							{/each}
						</select>
						<button>追加</button>
					</form>

					<div class="members">
						{#each membersFor(list.id) as member}
							<form class="member" method="POST" action="?/removeMember">
								<input type="hidden" name="listId" value={list.id} />
								<input type="hidden" name="contactId" value={member.contactId} />
								<span>{member.name}<small>{member.email}</small></span>
								<button class="plain">外す</button>
							</form>
						{/each}
					</div>
				</article>
			{/each}
		{/if}
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		background: linear-gradient(160deg, #edf3ee, #f6efe5);
		font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif;
		color: #17211b;
	}
	.page { max-width: 760px; margin: 0 auto; padding: 20px 16px 84px; }
	.back, .mini { color: #6d4d21; font-weight: 800; text-decoration: none; }
	header { display: flex; justify-content: space-between; gap: 14px; align-items: end; margin: 22px 0; }
	.eyebrow { margin: 0 0 6px; color: #93621f; font-size: 12px; font-weight: 800; letter-spacing: .14em; }
	h1 { margin: 0; font-size: 42px; letter-spacing: -.05em; }
	.card, .list-card {
		border: 1px solid rgba(23,33,27,.12);
		border-radius: 22px;
		background: rgba(255,255,255,.78);
		box-shadow: 0 14px 36px rgba(23,33,27,.08);
		padding: 18px;
	}
	h2 { margin: 0; font-size: 18px; }
	form { display: grid; gap: 10px; }
	input, textarea, select {
		box-sizing: border-box;
		width: 100%;
		border: 1px solid rgba(23,33,27,.18);
		border-radius: 14px;
		padding: 12px;
		font: inherit;
		background: white;
	}
	button { border: none; border-radius: 14px; background: #f08a24; color: #1c1207; font-weight: 800; padding: 12px; }
	.lists { display: grid; gap: 12px; margin-top: 16px; }
	.list-head { display: flex; justify-content: space-between; gap: 12px; align-items: start; }
	.list-head p, .empty, small { color: #69746d; }
	.add { display: grid; grid-template-columns: 1fr auto; margin: 14px 0; }
	.members { display: grid; gap: 8px; }
	.member {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		align-items: center;
		padding: 10px;
		border-radius: 14px;
		background: rgba(23,33,27,.06);
	}
	.member span { display: grid; gap: 2px; }
	.danger, .plain { background: rgba(191,56,42,.1); color: #a53024; }
	.error { border-radius: 14px; padding: 12px; background: #ffe8e4; color: #a53024; }
	@media (max-width: 620px) {
		header, .list-head { align-items: stretch; flex-direction: column; }
		.add { grid-template-columns: 1fr; }
	}
</style>
