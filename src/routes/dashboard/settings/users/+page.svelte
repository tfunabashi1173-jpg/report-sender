<script lang="ts">
	let { data, form } = $props();

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('ja-JP', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(value));
	}
</script>

<main class="page">
	<a class="back" href="/dashboard/settings">設定へ</a>
	<header>
		<div>
			<p class="eyebrow">Users</p>
			<h1>登録ユーザー管理</h1>
			<p>登録済みユーザーの名前、所属、権限を管理します。</p>
		</div>
		<a class="invite" href="/dashboard/invite">招待リンクを作成</a>
	</header>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}
	{#if data.status === 'saved'}
		<p class="success">ユーザー情報を保存しました</p>
	{:else if data.status === 'deleted'}
		<p class="success">ユーザーを削除しました</p>
	{/if}

	<section class="users">
		{#each data.users as user}
			<article class="user-card">
				<div class="user-head">
					<div>
						<strong>{user.displayName ?? user.loginId ?? '名前未設定'}</strong>
						<small>{user.organization || '所属なし'}</small>
					</div>
					<span class:admin={user.role === 'admin'}>{user.role === 'admin' ? '管理者' : 'ユーザー'}</span>
				</div>
				<div class="meta">
					<span>作成: {formatDate(user.createdAt)}</span>
					<span>パスキー: {user.passkeyCount}件</span>
					{#if user.id === data.currentUserId}<span>ログイン中</span>{/if}
				</div>
				<form class="edit" method="POST" action="?/update">
					<input type="hidden" name="id" value={user.id} />
					<label>
						ユーザー名
						<input name="displayName" required value={user.displayName ?? user.loginId ?? ''} />
					</label>
					<label>
						所属・会社名
						<input name="organization" value={user.organization ?? ''} placeholder="所属なし" />
					</label>
					<label>
						権限
						<select name="role">
							<option value="member" selected={user.role !== 'admin'}>ユーザー</option>
							<option value="admin" selected={user.role === 'admin'}>管理者</option>
						</select>
					</label>
					<button>保存</button>
				</form>
				<form
					method="POST"
					action="?/delete"
					onsubmit={(event) => {
						if (!confirm('このユーザーと関連データを削除します。よろしいですか？')) event.preventDefault();
					}}
				>
					<input type="hidden" name="id" value={user.id} />
					<button class="danger" disabled={user.id === data.currentUserId}>削除</button>
				</form>
			</article>
		{/each}
	</section>
</main>

<style>
	:global(body) { margin: 0; background: #f6f7f9; color: #24262b; font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif; }
	.page { max-width: 1040px; margin: 0 auto; padding: 24px 18px 112px; }
	.back { color: #6b7280; font-size: 13px; font-weight: 650; text-decoration: none; }
	header { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin: 20px 0 22px; }
	.eyebrow { margin: 0 0 8px; color: #9aa0aa; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
	h1 { margin: 0; color: #20242c; font-size: clamp(28px, 5vw, 42px); letter-spacing: -.045em; }
	header p { color: #8b929d; line-height: 1.7; }
	.invite, button { border: 0; border-radius: 16px; background: #1f2937; color: #fff; font-weight: 700; text-decoration: none; padding: 13px 16px; }
	.users { display: grid; gap: 14px; }
	.user-card { display: grid; gap: 14px; border-radius: 24px; background: #fff; box-shadow: 0 22px 54px rgba(16,24,40,.07); padding: 18px; }
	.user-head { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
	.user-head div { display: grid; gap: 4px; }
	.user-head strong { color: #20242c; font-size: 18px; }
	.user-head span { border-radius: 999px; background: #eef2f7; color: #3f4652; font-size: 12px; font-weight: 800; padding: 7px 10px; }
	.user-head span.admin { background: #fff3df; color: #9a5a10; }
	small, .meta, header p { color: #8b929d; }
	.meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; }
	.meta span { border-radius: 999px; background: #f6f7f9; padding: 6px 9px; }
	.edit { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 160px auto; gap: 10px; align-items: end; }
	label { display: grid; gap: 6px; color: #3f4652; font-size: 13px; font-weight: 650; }
	input, select { box-sizing: border-box; width: 100%; border: 1px solid #e6e9ef; border-radius: 16px; background: #fff; color: #24262b; font: inherit; padding: 12px; }
	input:focus, select:focus { outline: 2px solid rgba(31,41,55,.12); border-color: #cfd5df; }
	.danger { width: 100%; background: #fff1f0; color: #b42318; }
	.danger:disabled { opacity: .45; cursor: not-allowed; }
	.error, .success { border-radius: 16px; padding: 12px; }
	.error { background: #fff1f0; color: #b42318; }
	.success { background: #ecfdf3; color: #067647; }
	@media (max-width: 780px) {
		header { display: grid; align-items: start; }
		.invite { text-align: center; }
		.edit { grid-template-columns: 1fr; }
	}
</style>
