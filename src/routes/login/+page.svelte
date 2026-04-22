<script lang="ts">
	import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let loading = $state(false);
	let error = $state('');
	let hasAdmin = $state<boolean | null>(null);

	let displayName = $state('');
	let password = $state('');
	let passwordLoading = $state(false);

	let setupName = $state('');
	let setupPassword = $state('');
	let setupLoading = $state(false);

	async function loadBootstrapStatus() {
		try {
			const res = await fetch('/api/bootstrap/status');
			const result = await res.json();
			hasAdmin = Boolean(result.hasAdmin);
		} catch {
			hasAdmin = true;
		}
	}

	async function loginWithPasskey() {
		loading = true;
		error = '';
		try {
			const optRes = await fetch('/api/auth/passkey/authenticate', { method: 'GET' });
			const opts = await optRes.json();
			if (!optRes.ok) throw new Error(opts.error ?? 'パスキー認証を開始できません');

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
				error = 'パスキーでログインできませんでした';
			}
		} finally {
			loading = false;
		}
	}

	async function loginWithPassword() {
		if (!displayName.trim() || !password) {
			error = '名前とパスワードを入力してください';
			return;
		}

		passwordLoading = true;
		error = '';
		try {
			const res = await fetch('/api/auth/password/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ displayName, password })
			});
			const result = await res.json();
			if (!res.ok) throw new Error(result.error ?? 'パスワードログインに失敗しました');
			goto('/dashboard');
		} catch (e: any) {
			error = e.message;
		} finally {
			passwordLoading = false;
		}
	}

	async function createFirstAdmin() {
		if (!setupName.trim() || !setupPassword) {
			error = '管理者名とログインパスワードは必須です';
			return;
		}
		if (setupPassword.length < 8) {
			error = 'ログインパスワードは8文字以上で入力してください';
			return;
		}

		setupLoading = true;
		error = '';
		try {
			const res = await fetch('/api/bootstrap/first-admin', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					displayName: setupName,
					password: setupPassword
				})
			});
			const result = await res.json();
			if (!res.ok) throw new Error(result.error ?? '初期管理者の作成に失敗しました');
			hasAdmin = true;
			await registerCurrentUserPasskey();
			goto('/dashboard');
		} catch (e: any) {
			error = e.message;
			await loadBootstrapStatus();
		} finally {
			setupLoading = false;
		}
	}

	async function registerCurrentUserPasskey() {
		if (
			!window.PublicKeyCredential ||
			!(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
		) {
			throw new Error('この端末ではパスキーを作成できません');
		}

		const optRes = await fetch('/api/auth/passkey/register', { method: 'GET' });
		const opts = await optRes.json();
		if (!optRes.ok) throw new Error(opts.error ?? 'パスキー登録開始に失敗しました');

		const credential = await startRegistration({ optionsJSON: opts });
		const verifyRes = await fetch('/api/auth/passkey/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(credential)
		});
		const verifyResult = await verifyRes.json();
		if (!verifyRes.ok || !verifyResult.success) {
			throw new Error(verifyResult.error ?? 'パスキー登録に失敗しました');
		}
	}

	onMount(async () => {
		await loadBootstrapStatus();
	});
</script>

<main class="login">
	<h1>ログイン</h1>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<button class="btn-primary" onclick={loginWithPasskey} disabled={loading}>
		{loading ? '認証中...' : 'Face ID / パスキーでログイン'}
	</button>

	{#if hasAdmin === null}
		<p class="hint">状態を確認中...</p>
	{:else if hasAdmin}
		<p class="hint">パスキーが使えない場合は、名前とパスワードでログインしてください。</p>

		<section class="setup">
			<h2>パスワードログイン</h2>
			<label>
				名前
				<input type="text" bind:value={displayName} placeholder="山田 太郎" />
			</label>
			<label>
				ログインパスワード
				<input type="password" bind:value={password} placeholder="8文字以上" />
			</label>
			<button class="btn-secondary" onclick={loginWithPassword} disabled={passwordLoading || !displayName.trim() || !password}>
				{passwordLoading ? 'ログイン中...' : '名前とパスワードでログイン'}
			</button>
		</section>
	{:else}
		<p class="hint">初回起動です。初期管理者を作成してください。</p>

		<section class="setup">
			<h2>初期セットアップ</h2>
			<label>
				管理者名
				<input type="text" bind:value={setupName} placeholder="管理者" />
			</label>
			<label>
				ログインパスワード
				<input type="password" bind:value={setupPassword} placeholder="8文字以上" />
			</label>
			<button
				class="btn-secondary"
				onclick={createFirstAdmin}
				disabled={setupLoading || !setupName.trim() || !setupPassword}
			>
				{setupLoading ? '作成中...' : '初期管理者を作成してパスキー登録'}
			</button>
		</section>
	{/if}
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
