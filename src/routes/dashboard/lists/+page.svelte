<script lang="ts">
	let { data, form } = $props();
	let selectedOrganizations = $state<Record<string, string>>({});

	function membersFor(listId: string) {
		return data.members.filter((member) => member.listId === listId);
	}

	const organizations = $derived(
		Array.from(new Set(data.contacts.map((contact) => contact.organization?.trim() || '所属なし')))
	);

	function contactsFor(listId: string) {
		const organization = selectedOrganizations[listId] ?? '';
		if (!organization) return [];
		return data.contacts.filter((contact) => (contact.organization?.trim() || '所属なし') === organization);
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

	<div class="workspace">
		<section class="card">
			<h2>新しいリスト</h2>
			<form method="POST" action="?/create">
				<input name="name" required placeholder="例: 保護者全体" />
				<textarea name="description" rows="5" placeholder="用途や対象"></textarea>
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
								<p>{list.description ?? '説明なし'} / TO {list.toCount}件 / CC {list.ccCount}件</p>
							</div>
							<form method="POST" action="?/delete">
								<input type="hidden" name="id" value={list.id} />
								<button class="danger">削除</button>
							</form>
						</div>

						<form class="add" method="POST" action="?/addMember">
							<input type="hidden" name="listId" value={list.id} />
							<div class="recipient-row">
								<label>
									所属
									<select bind:value={selectedOrganizations[list.id]} required>
										<option value="">所属を選択</option>
										{#each organizations as organization}
											<option value={organization}>{organization}</option>
										{/each}
									</select>
								</label>
								<label>
									名前
									<select name="contactId" required disabled={!selectedOrganizations[list.id]}>
										<option value="">名前を選択</option>
										{#each contactsFor(list.id) as contact}
											<option value={contact.id}>{contact.name} / {contact.email}</option>
										{/each}
									</select>
								</label>
								<label>
									区分
									<select name="kind">
										<option value="to">TO</option>
										<option value="cc">CC</option>
									</select>
								</label>
							</div>
							<button>追加・更新</button>
						</form>

						<div class="members">
							{#each ['to', 'cc'] as kind}
								<div class="member-section">
									<strong>{kind === 'to' ? 'TO' : 'CC'}</strong>
									{#each membersFor(list.id).filter((member) => member.kind === kind) as member}
										<form class="member" method="POST" action="?/removeMember">
											<input type="hidden" name="listId" value={list.id} />
											<input type="hidden" name="contactId" value={member.contactId} />
											<span>
												{member.name}
												<small>{member.organization ?? '所属なし'} / {member.email}</small>
											</span>
											<button class="plain">外す</button>
										</form>
									{:else}
										<p class="empty-inline">未登録</p>
									{/each}
								</div>
							{/each}
						</div>
					</article>
				{/each}
			{/if}
		</section>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		background: linear-gradient(160deg, #edf3ee, #f6efe5);
		font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif;
		color: #17211b;
	}
	.page { max-width: 1120px; margin: 0 auto; padding: 24px 20px 84px; }
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
	.workspace { display: grid; gap: 16px; align-items: start; }
	h2 { margin: 0; font-size: 18px; }
	form { display: grid; gap: 10px; }
	label { display: grid; gap: 6px; font-size: 13px; font-weight: 750; }
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
	.lists { display: grid; gap: 12px; }
	.list-head { display: flex; justify-content: space-between; gap: 12px; align-items: start; }
	.list-head p, .empty, small, .empty-inline { color: #69746d; }
	.add { display: grid; gap: 12px; margin: 14px 0; }
	.recipient-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 120px; gap: 10px; }
	.members { display: grid; gap: 10px; }
	.member-section {
		display: grid;
		gap: 8px;
		padding: 12px;
		border-radius: 18px;
		background: rgba(23,33,27,.04);
	}
	.member-section > strong { font-size: 13px; letter-spacing: .08em; }
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
	.empty-inline { margin: 0; font-size: 13px; }
	.danger, .plain { background: rgba(191,56,42,.1); color: #a53024; }
	.error { border-radius: 14px; padding: 12px; background: #ffe8e4; color: #a53024; }
	@media (max-width: 620px) {
		header, .list-head { align-items: stretch; flex-direction: column; }
		.recipient-row { grid-template-columns: 1fr; }
	}
	@media (min-width: 960px) {
		.workspace {
			grid-template-columns: minmax(320px, 0.38fr) minmax(0, 1fr);
		}
		.card {
			position: sticky;
			top: 20px;
		}
		.members {
			grid-template-columns: repeat(2, minmax(0, 1fr));
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
	.empty, .empty-inline, small, .row span, .row small, .list-head p, summary span, .tag-panel small, .tags span, header p, .status { color: #8b929d; }
</style>
