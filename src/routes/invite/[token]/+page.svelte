<script lang="ts">
	import { startRegistration } from '@simplewebauthn/browser';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let displayName = $state(data.inviteData?.displayName ?? '');
	let loading = $state(false);
	let error = $state(data.error ?? '');

	async function register() {
		loading = true;
		error = '';
		try {
			const res = await fetch(`/api/invite/${data.token}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ displayName })
			});
			const result = await res.json();
			if (!res.ok) throw new Error(result.error);

			await registerPasskey();
			goto('/dashboard');
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function registerPasskey() {
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
		const result = await verifyRes.json();
		if (!verifyRes.ok || !result.success) {
			throw new Error(result.error ?? 'パスキー登録に失敗しました');
		}
		localStorage.setItem('passkey_registered', '1');
	}
</script>

<main class="invite">
	{#if data.error}
		<div class="error-page">
			<h1>⚠️ リンクが無効です</h1>
			<p>{data.error}</p>
		</div>
	{:else}
		<h1>ユーザー登録</h1>
		<p class="subtitle">登録後にそのままパスキーを作成します</p>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<label>
			お名前
			<input type="text" bind:value={displayName} placeholder="山田 太郎" />
		</label>

		<button class="btn-primary" onclick={register} disabled={loading || !displayName}>
			{loading ? '登録中...' : '登録してパスキーを作成'}
		</button>
	{/if}
</main>

<style>
	.invite {
		max-width: 360px;
		margin: 60px auto;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.subtitle { color: #666; font-size: 14px; margin-top: -8px; }
	label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
	input { padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 16px; }
	.btn-primary {
		padding: 12px;
		background: #0070f3;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 16px;
		cursor: pointer;
	}
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
	.error { color: #e00; font-size: 14px; }
	.error-page { text-align: center; padding: 40px; }
</style>
