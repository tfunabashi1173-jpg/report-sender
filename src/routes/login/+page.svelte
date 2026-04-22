<script lang="ts">
	import { startAuthentication } from '@simplewebauthn/browser';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let loading = $state(false);
	let error = $state('');
	let setupName = $state('');
	let setupKey = $state('');
	let setupLoading = $state(false);

	async function loginWithPasskey() {
		loading = true;
		error = '';
		try {
			const optRes = await fetch('/api/auth/passkey/authenticate', { method: 'GET' });
			const opts = await optRes.json();

			const credential = await startAuthentication({ optionsJSON: opts });

			const verifyRes = await fetch('/api/auth/passkey/authenticate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(credential)
			});
			const result = await verifyRes.json();

			if (result.success) {
				goto('/dashboard');
			} else {
				error = result.error ?? '認証に失敗しました';
			}
		} catch (e: any) {
			if (e?.name === 'NotAllowedError') {
				error = 'キャンセルされました';
			} else {
				error = 'パスキーが見つかりません。管理者に招待リンクを依頼してください。';
			}
		} finally {
			loading = false;
		}
	}

	async function createFirstAdmin() {
		setupLoading = true;
		error = '';
		try {
			const res = await fetch('/api/bootstrap/first-admin', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					displayName: setupName,
					bootstrapKey: setupKey
				})
			});
			const result = await res.json();
			if (!res.ok) throw new Error(result.error ?? '初期管理者の作成に失敗しました');
			goto('/dashboard');
		} catch (e: any) {
			error = e.message;
		} finally {
			setupLoading = false;
		}
	}
</script>

<main class="login">
	<h1>ログイン</h1>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<button class="btn-primary" onclick={loginWithPasskey} disabled={loading}>
		{loading ? '認証中...' : 'Face ID / パスキーでログイン'}
	</button>

	<p class="hint">
		初めてご利用の方は管理者から招待リンクを受け取ってください。
	</p>

	<section class="setup">
		<h2>初期セットアップ（管理者未作成時のみ）</h2>
		<label>
			管理者名
			<input type="text" bind:value={setupName} placeholder="管理者" />
		</label>
		<label>
			初期化キー（任意）
			<input type="password" bind:value={setupKey} placeholder="環境変数で設定した場合のみ入力" />
		</label>
		<button class="btn-secondary" onclick={createFirstAdmin} disabled={setupLoading}>
			{setupLoading ? '作成中...' : '初期管理者を作成'}
		</button>
	</section>
</main>

<style>
	.login {
		max-width: 360px;
		margin: 60px auto;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		text-align: center;
	}
	.btn-primary {
		padding: 14px;
		background: #0070f3;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		cursor: pointer;
	}
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-secondary {
		padding: 12px;
		background: white;
		color: #0070f3;
		border: 1px solid #0070f3;
		border-radius: 8px;
		font-size: 14px;
		cursor: pointer;
	}
	.btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
	.setup {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 12px;
		padding-top: 16px;
		border-top: 1px solid #e5e5e5;
		text-align: left;
	}
	.setup h2 {
		margin: 0;
		font-size: 14px;
	}
	.setup label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 13px;
	}
	.setup input {
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 14px;
	}
	.hint { font-size: 13px; color: #888; }
	.error { color: #e00; font-size: 14px; }
</style>
