<script lang="ts">
	import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let phone = $state('');
	let otp = $state('');
	let step = $state<'phone' | 'otp' | 'passkey-register'>('phone');
	let loading = $state(false);
	let error = $state('');
	let hasPasskey = $state(false);

	async function checkPasskey() {
		if (!window.PublicKeyCredential) return;
		const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
		hasPasskey = available && !!localStorage.getItem('passkey_registered');
	}

	$effect(() => {
		checkPasskey();
	});

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

			if (result.token) {
				await data.supabase.auth.setSession({ access_token: result.token, refresh_token: result.refresh_token });
				goto('/dashboard');
			} else {
				error = result.error ?? '認証に失敗しました';
			}
		} catch (e) {
			error = 'パスキー認証に失敗しました。SMSで試してください。';
		} finally {
			loading = false;
		}
	}

	async function sendOtp() {
		loading = true;
		error = '';
		try {
			const normalized = phone.startsWith('+') ? phone : `+81${phone.replace(/^0/, '')}`;
			const { error: err } = await data.supabase.auth.signInWithOtp({ phone: normalized });
			if (err) throw err;
			step = 'otp';
		} catch (e: any) {
			error = e.message ?? 'SMS送信に失敗しました';
		} finally {
			loading = false;
		}
	}

	async function verifyOtp() {
		loading = true;
		error = '';
		try {
			const normalized = phone.startsWith('+') ? phone : `+81${phone.replace(/^0/, '')}`;
			const { error: err } = await data.supabase.auth.verifyOtp({
				phone: normalized,
				token: otp,
				type: 'sms'
			});
			if (err) throw err;

			const passkeyAvailable =
				window.PublicKeyCredential &&
				(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());

			if (passkeyAvailable && !localStorage.getItem('passkey_registered')) {
				step = 'passkey-register';
			} else {
				goto('/dashboard');
			}
		} catch (e: any) {
			error = e.message ?? '確認コードが正しくありません';
		} finally {
			loading = false;
		}
	}

	async function registerPasskey() {
		loading = true;
		error = '';
		try {
			const optRes = await fetch('/api/auth/passkey/register', { method: 'GET' });
			const opts = await optRes.json();

			const credential = await startRegistration({ optionsJSON: opts });

			const verifyRes = await fetch('/api/auth/passkey/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(credential)
			});
			const result = await verifyRes.json();

			if (result.success) {
				localStorage.setItem('passkey_registered', '1');
				goto('/dashboard');
			} else {
				error = result.error ?? '登録に失敗しました';
			}
		} catch (e) {
			error = 'パスキー登録に失敗しました';
		} finally {
			loading = false;
		}
	}
</script>

<main class="login">
	<h1>ログイン</h1>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	{#if step === 'phone'}
		{#if hasPasskey}
			<button class="btn-primary" onclick={loginWithPasskey} disabled={loading}>
				{loading ? '認証中...' : 'Face ID / パスキーでログイン'}
			</button>
			<hr />
			<p class="hint">別の端末・初回ログインの場合</p>
		{/if}

		<label>
			電話番号
			<input type="tel" bind:value={phone} placeholder="090-0000-0000" />
		</label>
		<button class="btn-secondary" onclick={sendOtp} disabled={loading || !phone}>
			{loading ? '送信中...' : 'SMSで確認コードを送る'}
		</button>

	{:else if step === 'otp'}
		<p>{phone} にSMSを送りました</p>
		<label>
			確認コード（6桁）
			<input type="text" inputmode="numeric" maxlength="6" bind:value={otp} placeholder="000000" />
		</label>
		<button class="btn-primary" onclick={verifyOtp} disabled={loading || otp.length < 6}>
			{loading ? '確認中...' : '確認する'}
		</button>
		<button class="btn-link" onclick={() => (step = 'phone')}>← 電話番号を変更</button>

	{:else if step === 'passkey-register'}
		<div class="passkey-prompt">
			<p>この端末でFace ID / Touch IDを使ってログインできるようにしますか？</p>
			<button class="btn-primary" onclick={registerPasskey} disabled={loading}>
				{loading ? '登録中...' : 'パスキーを登録する'}
			</button>
			<button class="btn-link" onclick={() => goto('/dashboard')}>スキップ</button>
		</div>
	{/if}
</main>

<style>
	.login {
		max-width: 360px;
		margin: 60px auto;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 14px;
	}
	input {
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 16px;
	}
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
	.btn-secondary {
		padding: 12px;
		background: white;
		color: #0070f3;
		border: 1px solid #0070f3;
		border-radius: 6px;
		font-size: 16px;
		cursor: pointer;
	}
	.btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-link {
		background: none;
		border: none;
		color: #0070f3;
		cursor: pointer;
		font-size: 14px;
	}
	.error {
		color: #e00;
		font-size: 14px;
	}
	.hint {
		font-size: 12px;
		color: #888;
		text-align: center;
	}
	hr { border: none; border-top: 1px solid #eee; }
</style>
