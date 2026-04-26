<script lang="ts">
	import { onDestroy } from 'svelte';

	let { data, form } = $props();
	type Contact = { id: string; name: string; email: string; organization: string | null };
	type PreviewImage = { name: string; size: string; url: string };

	let selectedTemplateId = $state('');
	let appliedTemplateId = $state('');
	let selectedFloor = $state('');
	let selectedPercent = $state('');
	let selectedMailingListId = $state('');
	let selectedToContactIds = $state<string[]>([]);
	let selectedCcContactIds = $state<string[]>([]);
	let openToOrganizations = $state<string[]>([]);
	let openCcOrganizations = $state<string[]>([]);
	let subject = $state('');
	let body = $state('');
	let attachmentInput: HTMLInputElement;
	let sendSubmitButton: HTMLButtonElement;
	let attachmentStatus = $state('');
	let compressingAttachments = $state(false);
	let confirmOpen = $state(false);
	let confirmedSend = $state(false);
	let previewImages = $state<PreviewImage[]>([]);

	const floors = Array.from({ length: 60 }, (_, index) => `${index + 1}階`);
	const percents = Array.from({ length: 10 }, (_, index) => `${(index + 1) * 10}%`);
	const tags = [
		{ label: '今日の日付', token: '{today}' },
		{ label: 'フロア', token: '{floor}' },
		{ label: '割合', token: '{%}' }
	];
	const imageMaxSide = 1600;
	const imageQuality = 0.72;
	const imageAccept = 'image/*,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif';
	const contactGroups = $derived(groupContactsByOrganization(data.contacts));
	const contactsById = $derived(new Map<string, Contact>(data.contacts.map((contact: Contact) => [contact.id, contact])));
	const previewSubject = $derived(applyTags(subject));
	const previewBody = $derived(applyTags(body));
	const previewToRecipients = $derived(resolvePreviewToRecipients());
	const previewCcRecipients = $derived(resolvePreviewCcRecipients());

	function groupContactsByOrganization(
		contacts: Array<{ id: string; name: string; email: string; organization: string | null }>
	) {
		const groups = new Map<string, { name: string; contacts: typeof contacts }>();
		for (const contact of contacts) {
			const name = contact.organization?.trim() || '所属なし';
			if (!groups.has(name)) groups.set(name, { name, contacts: [] });
			groups.get(name)?.contacts.push(contact);
		}
		return [...groups.values()];
	}

	function toggleOrganization(kind: 'to' | 'cc', name: string) {
		const current = kind === 'to' ? openToOrganizations : openCcOrganizations;
		const next = current.includes(name) ? current.filter((item) => item !== name) : [...current, name];
		if (kind === 'to') openToOrganizations = next;
		else openCcOrganizations = next;
	}

	function isOrganizationOpen(kind: 'to' | 'cc', name: string) {
		return (kind === 'to' ? openToOrganizations : openCcOrganizations).includes(name);
	}

	function formatToday() {
		const now = new Date();
		const pad = (value: number) => String(value).padStart(2, '0');
		return `${now.getMonth() + 1}月${now.getDate()}日 ${pad(now.getHours())}時${pad(now.getMinutes())}分`;
	}

	function applyTags(value: string) {
		return value
			.replaceAll('{today}', formatToday())
			.replaceAll('{{today}}', formatToday())
			.replaceAll('{site}', data.siteName ?? '')
			.replaceAll('{{site}}', data.siteName ?? '')
			.replaceAll('{floor}', selectedFloor)
			.replaceAll('{{floor}}', selectedFloor)
			.replaceAll('{%}', selectedPercent);
	}

	function prepareSubmit() {
		subject = applyTags(subject);
		body = applyTags(body);
	}

	function applyTemplate() {
		const template = data.templates.find((item) => item.id === selectedTemplateId);
		if (!template) {
			appliedTemplateId = '';
			subject = '';
			body = '';
			return;
		}
		appliedTemplateId = template.id;
		subject = applyTags(template.subject);
		body = applyTags(template.body);
		selectedMailingListId = template.toListIds[0] ?? template.ccListIds[0] ?? '';
	}

	$effect(() => {
		if (!appliedTemplateId) return;
		const template = data.templates.find((item) => item.id === appliedTemplateId);
		if (!template) return;
		subject = applyTags(template.subject);
		body = applyTags(template.body);
	});

	function formatFileSize(bytes: number) {
		if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
	}

	function replaceExtension(name: string) {
		const base = name.replace(/\.[^.]+$/, '');
		return `${base || 'image'}.jpg`;
	}

	function isCompressibleImage(file: File) {
		return file.type.startsWith('image/') && file.type !== 'image/gif' && file.type !== 'image/svg+xml';
	}

	function applyImageStampTags(value: string) {
		return value
			.replaceAll('{name}', data.userName ?? '')
			.replaceAll('{today}', formatToday())
			.replaceAll('{floor}', selectedFloor)
			.replaceAll('{%}', selectedPercent);
	}

	function imageStampLines() {
		return String(data.imageStampTemplate ?? '')
			.split(/\r?\n/)
			.map((line) => applyImageStampTags(line).trim())
			.filter((line) => line.length > 0);
	}

	function uniqueByEmail(recipients: Contact[]) {
		const merged = new Map<string, Contact>();
		for (const recipient of recipients) merged.set(recipient.email.toLowerCase(), recipient);
		return [...merged.values()];
	}

	function resolvePreviewRecipientsByKind(kind: 'to' | 'cc'): Contact[] {
		const selectedListMembers = selectedMailingListId
			? data.listMembers.filter((member: Contact & { listId: string; kind: 'to' | 'cc' }) => member.listId === selectedMailingListId && member.kind === kind)
			: [];
		const manualIds = kind === 'to' ? selectedToContactIds : selectedCcContactIds;
		const manualRecipients = manualIds.map((id) => contactsById.get(id)).filter((contact): contact is Contact => Boolean(contact));
		return uniqueByEmail([...selectedListMembers, ...manualRecipients]);
	}

	function resolvePreviewToRecipients(): Contact[] {
		return resolvePreviewRecipientsByKind('to');
	}

	function resolvePreviewCcRecipients(): Contact[] {
		const recipients = resolvePreviewRecipientsByKind('cc');
		const toEmails = new Set<string>(resolvePreviewToRecipients().map((recipient: Contact) => recipient.email.toLowerCase()));
		return recipients.filter((recipient: Contact) => !toEmails.has(recipient.email.toLowerCase()));
	}

	function clearPreviewImages() {
		for (const image of previewImages) URL.revokeObjectURL(image.url);
		previewImages = [];
	}

	function refreshPreviewImages() {
		clearPreviewImages();
		previewImages = Array.from(attachmentInput?.files ?? [])
			.filter((file) => file.type.startsWith('image/'))
			.map((file) => ({
				name: file.name,
				size: formatFileSize(file.size),
				url: URL.createObjectURL(file)
			}));
	}

	function openSendConfirm() {
		if (!subject.trim() || !body.trim()) {
			attachmentStatus = '件名と本文を入力してください。';
			return;
		}
		if (previewToRecipients.length === 0) {
			attachmentStatus = 'メイン宛先を1件以上選択してください。';
			return;
		}
		refreshPreviewImages();
		confirmOpen = true;
	}

	function closeSendConfirm() {
		confirmOpen = false;
	}

	function cancelSendConfirm() {
		closeSendConfirm();
		clearPreviewImages();
	}

	function confirmSend() {
		confirmedSend = true;
		closeSendConfirm();
		sendSubmitButton?.click();
	}

	function handleSubmit(event: SubmitEvent) {
		const submitter = event.submitter as HTMLButtonElement | null;
		if (submitter?.dataset.confirmSend === 'true' && !confirmedSend) {
			event.preventDefault();
			openSendConfirm();
			return;
		}
		prepareSubmit();
	}

	onDestroy(clearPreviewImages);

	function drawImageStamp(context: CanvasRenderingContext2D, width: number, height: number) {
		const lines = imageStampLines();
		if (lines.length === 0) return;

		const fontSize = Math.max(24, Math.round(Math.min(width, height) * 0.032));
		const padding = Math.round(fontSize * 0.75);
		const lineHeight = Math.round(fontSize * 1.35);
		context.font = `700 ${fontSize}px "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif`;
		const textWidth = Math.max(...lines.map((line) => context.measureText(line).width));
		const boxWidth = Math.ceil(textWidth + padding * 2);
		const boxHeight = lineHeight * lines.length + padding * 2;
		const x = Math.max(padding, width - boxWidth - padding);
		const y = Math.max(padding, height - boxHeight - padding);

		context.fillStyle = 'rgba(0, 0, 0, 0.48)';
		context.fillRect(x, y, boxWidth, boxHeight);
		context.fillStyle = '#fff';
		context.shadowColor = 'rgba(0, 0, 0, 0.65)';
		context.shadowBlur = 3;
		context.shadowOffsetY = 1;
		lines.forEach((line, index) => {
			context.fillText(line, x + padding, y + padding + fontSize + index * lineHeight);
		});
		context.shadowColor = 'transparent';
	}

	async function decodeImage(file: File) {
		if ('createImageBitmap' in window) {
			return createImageBitmap(file, { imageOrientation: 'from-image' });
		}

		const url = URL.createObjectURL(file);
		try {
			const image = new Image();
			image.decoding = 'async';
			await new Promise<void>((resolve, reject) => {
				image.onload = () => resolve();
				image.onerror = () => reject(new Error('画像を読み込めませんでした'));
				image.src = url;
			});
			return image;
		} finally {
			URL.revokeObjectURL(url);
		}
	}

	async function compressImage(file: File) {
		if (!isCompressibleImage(file)) return file;

		const image = await decodeImage(file);
		const scale = Math.min(1, imageMaxSide / Math.max(image.width, image.height));
		const width = Math.max(1, Math.round(image.width * scale));
		const height = Math.max(1, Math.round(image.height * scale));
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext('2d');
		context?.drawImage(image, 0, 0, width, height);
		if (context) drawImageStamp(context, width, height);
		if ('close' in image && typeof image.close === 'function') image.close();

		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', imageQuality));
		if (!blob || blob.size >= file.size) return file;
		return new File([blob], replaceExtension(file.name), { type: 'image/jpeg', lastModified: Date.now() });
	}

	async function compressAttachments() {
		const files = Array.from(attachmentInput?.files ?? []);
		if (files.length === 0) {
			attachmentStatus = '';
			return;
		}

		compressingAttachments = true;
		attachmentStatus = '画像を圧縮しています...';
		try {
			const compressed = await Promise.all(files.map((file) => compressImage(file)));
			const transfer = new DataTransfer();
			for (const file of compressed) transfer.items.add(file);
			attachmentInput.files = transfer.files;

			const before = files.reduce((total, file) => total + file.size, 0);
			const after = compressed.reduce((total, file) => total + file.size, 0);
			attachmentStatus = `添付画像に必要な文字を入れ、${formatFileSize(before)} から ${formatFileSize(after)} に圧縮しました。`;
		} catch {
			attachmentStatus = '画像圧縮に失敗しました。元画像のまま添付します。';
		} finally {
			compressingAttachments = false;
		}
	}
</script>

<main class="page">
	<a class="back" href="/dashboard">ダッシュボードへ</a>
	<header>
		<p class="eyebrow">Compose</p>
		<h1>報告メール作成</h1>
	</header>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}
	{#if !data.mailConfigured}
		<p class="error">送信メール設定が未設定です。管理者が設定するとサーバー送信できます。</p>
	{/if}

	<form class="composer" method="POST" enctype="multipart/form-data" onsubmit={handleSubmit}>
		<section class="card">
			<h2>本文</h2>
			<div class="tag-panel">
				<p>使えるタグ</p>
				<div class="tags">
					{#each tags as tag}
						<div class="tag-chip">
							<strong>{tag.token}</strong>
							<span>{tag.label}</span>
						</div>
					{/each}
				</div>
			</div>
			<label>
				定型文
				<div class="template-row">
					<select bind:value={selectedTemplateId}>
						<option value="">選択しない</option>
						{#each data.templates as template}
							<option value={template.id}>{applyTags(template.name)}</option>
						{/each}
					</select>
					<button type="button" class="sub-button" onclick={applyTemplate}>反映</button>
				</div>
			</label>
			<label>
				フロア
				<select bind:value={selectedFloor}>
					<option value="">選択しない</option>
					{#each floors as floor}
						<option value={floor}>{floor}</option>
					{/each}
				</select>
				<small>定型文内の {'{floor}'} に代入します。</small>
			</label>
			<label>
				割合
				<select bind:value={selectedPercent}>
					<option value="">選択しない</option>
					{#each percents as percent}
						<option value={percent}>{percent}</option>
					{/each}
				</select>
				<small>定型文内の {'{%}'} に代入します。</small>
			</label>
			<label>
				件名
				<input name="subject" bind:value={subject} required placeholder="本日の活動報告" />
			</label>
			<label>
				本文
				<textarea name="body" bind:value={body} rows="12" required placeholder="報告内容を入力"></textarea>
			</label>
		</section>

		<section class="card">
			<h2>宛先</h2>
			<label>
				メーリングリスト
				<select name="toListIds" bind:value={selectedMailingListId}>
					<option value="">選択しない</option>
					{#each data.lists as list}
						<option value={list.id}>{list.name}</option>
					{/each}
				</select>
				<small>リスト内のTO/CC設定を使って送信します。</small>
			</label>
			<h2 class="recipient-title">メイン宛先</h2>
			<div class="checks">
				{#each contactGroups as group}
					<div class="recipient-group">
						<button type="button" class="group-toggle" aria-expanded={isOrganizationOpen('to', group.name)} onclick={() => toggleOrganization('to', group.name)}>
							<span>{group.name}</span>
							<small>{group.contacts.length}名</small>
							<strong>{isOrganizationOpen('to', group.name) ? '閉じる' : '開く'}</strong>
						</button>
						<div class="group-members" hidden={!isOrganizationOpen('to', group.name)}>
							{#each group.contacts as contact}
								<label class="check">
									<input bind:group={selectedToContactIds} type="checkbox" name="toContactIds" value={contact.id} />
									<span>{contact.name}<small>{contact.email}</small></span>
								</label>
							{/each}
						</div>
					</div>
				{/each}
			</div>
			<h2 class="cc-title">CC</h2>
			<div class="checks">
				{#each contactGroups as group}
					<div class="recipient-group">
						<button type="button" class="group-toggle" aria-expanded={isOrganizationOpen('cc', group.name)} onclick={() => toggleOrganization('cc', group.name)}>
							<span>{group.name}</span>
							<small>{group.contacts.length}名</small>
							<strong>{isOrganizationOpen('cc', group.name) ? '閉じる' : '開く'}</strong>
						</button>
						<div class="group-members" hidden={!isOrganizationOpen('cc', group.name)}>
							{#each group.contacts as contact}
								<label class="check">
									<input bind:group={selectedCcContactIds} type="checkbox" name="ccContactIds" value={contact.id} />
									<span>{contact.name}<small>{contact.email}</small></span>
								</label>
							{/each}
						</div>
					</div>
				{/each}
			</div>
			<label class="attachment">
				画像添付
				<input bind:this={attachmentInput} onchange={compressAttachments} name="attachments" type="file" accept={imageAccept} multiple />
				<small>JPG/PNG/WebP/HEIC/HEIFを選択できます。スマホではカメラまたはライブラリから選択できます。選択後に自動で圧縮し、保存せず送信時だけ添付します。</small>
				{#if attachmentStatus}
					<small class:working={compressingAttachments}>{attachmentStatus}</small>
				{/if}
			</label>
			{#if data.contacts.length === 0}
				<p class="empty">送信先がありません。<a href="/dashboard/contacts">連絡先を追加</a>してください。</p>
			{/if}
		</section>

		<div class="actions">
			<button formaction="?/draft" class="secondary">下書き保存</button>
			<button type="button" class="primary" disabled={!data.mailConfigured || compressingAttachments} onclick={openSendConfirm}>サーバーから送信</button>
			<button bind:this={sendSubmitButton} class="sr-only" formaction="?/send" data-confirm-send="true" aria-hidden="true" tabindex="-1">送信</button>
		</div>
	</form>

	{#if confirmOpen}
		<div class="modal-backdrop" role="presentation">
			<div class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
				<div class="modal-head">
					<p class="eyebrow">Confirm</p>
					<h2 id="confirm-title">送信内容の確認</h2>
				</div>
				<div class="confirm-grid">
					<section>
						<h3>宛先 TO</h3>
						{#if previewToRecipients.length === 0}
							<p class="empty">未選択</p>
						{:else}
							<div class="recipient-preview">
								{#each previewToRecipients as recipient}
									<span>{recipient.name}<small>{recipient.email}</small></span>
								{/each}
							</div>
						{/if}
					</section>
					<section>
						<h3>宛先 CC</h3>
						{#if previewCcRecipients.length === 0}
							<p class="empty">なし</p>
						{:else}
							<div class="recipient-preview">
								{#each previewCcRecipients as recipient}
									<span>{recipient.name}<small>{recipient.email}</small></span>
								{/each}
							</div>
						{/if}
					</section>
					<section class="wide">
						<h3>タイトル</h3>
						<p class="subject-preview">{previewSubject}</p>
					</section>
					<section class="wide">
						<h3>本文</h3>
						<pre class="body-preview">{previewBody}</pre>
					</section>
					<section class="wide">
						<h3>画像</h3>
						{#if previewImages.length === 0}
							<p class="empty">添付画像なし</p>
						{:else}
							<div class="thumbs">
								{#each previewImages as image}
									<figure>
										<img src={image.url} alt={image.name} />
										<figcaption>{image.name}<small>{image.size}</small></figcaption>
									</figure>
								{/each}
							</div>
						{/if}
					</section>
				</div>
				<div class="modal-actions">
					<button type="button" class="secondary" onclick={confirmSend}>送信</button>
					<button type="button" class="subtle" onclick={closeSendConfirm}>戻る</button>
					<button type="button" class="danger" onclick={cancelSendConfirm}>中止</button>
				</div>
			</div>
		</div>
	{/if}
</main>

<style>
	:global(body) { margin: 0; background: linear-gradient(150deg, #f7efe1, #e6f0ee); font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif; color: #17211b; }
	.page { max-width: 1180px; margin: 0 auto; padding: 24px 20px 92px; }
	.back { color: #6d4d21; font-weight: 800; text-decoration: none; }
	header { margin: 22px 0; }
	.eyebrow { margin: 0 0 6px; color: #93621f; font-size: 12px; font-weight: 800; letter-spacing: .14em; }
	h1 { margin: 0; font-size: 42px; letter-spacing: -.05em; }
	.composer { display: grid; gap: 14px; align-items: start; }
	.card {
		border: 1px solid rgba(23,33,27,.12);
		border-radius: 22px;
		background: rgba(255,255,255,.82);
		box-shadow: 0 14px 36px rgba(23,33,27,.08);
		padding: 18px;
	}
	h2 { margin: 0 0 14px; font-size: 18px; }
	.recipient-title { margin-top: 18px; }
	.cc-title { margin-top: 20px; }
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
	.tag-chip {
		display: grid;
		gap: 3px;
		border-radius: 14px;
		background: white;
		padding: 10px;
	}
	.tag-chip strong {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 13px;
	}
	.tag-chip span {
		color: #69746d;
		font-size: 12px;
	}
	label { display: grid; gap: 6px; margin-top: 12px; font-size: 13px; font-weight: 800; }
	input, textarea, select {
		box-sizing: border-box;
		width: 100%;
		border: 1px solid rgba(23,33,27,.18);
		border-radius: 14px;
		padding: 12px;
		font: inherit;
		background: white;
	}
	.template-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
	.checks { display: grid; gap: 8px; }
	.recipient-group {
		display: grid;
		gap: 8px;
	}
	.group-toggle {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 10px;
		width: 100%;
		border-radius: 16px;
		background: #f8fafc;
		color: #24262b;
		padding: 12px;
		text-align: left;
	}
	.group-toggle span {
		overflow: hidden;
		font-weight: 750;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.group-toggle strong {
		color: #1f2937;
		font-size: 12px;
	}
	.group-toggle:hover {
		background: #eef2f7;
		color: #24262b;
	}
	.group-toggle:hover,
	.group-toggle:hover strong,
	.group-toggle:hover small {
		color: #24262b;
	}
	.group-members {
		display: grid;
		gap: 8px;
		padding-left: 10px;
	}
	.group-members[hidden] {
		display: none !important;
	}
	.check {
		display: flex;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 10px;
		margin: 0;
		padding: 12px;
		border-radius: 14px;
		background: rgba(23,33,27,.06);
	}
	.check input { width: auto; }
	.check span { display: grid; gap: 2px; }
	.attachment { padding-top: 14px; border-top: 1px solid rgba(23,33,27,.12); }
	small, .empty { color: #69746d; }
	.working { color: #93621f; }
	.actions {
		position: sticky;
		bottom: 12px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		padding: 10px;
		border-radius: 22px;
		background: rgba(255,255,255,.88);
		backdrop-filter: blur(10px);
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: grid;
		place-items: center;
		background: rgba(15, 23, 42, .42);
		padding: 18px;
		backdrop-filter: blur(12px);
	}
	.confirm-modal {
		display: grid;
		gap: 18px;
		width: min(920px, 100%);
		max-height: min(86vh, 900px);
		overflow: auto;
		border-radius: 28px;
		background: #fff;
		box-shadow: 0 30px 90px rgba(15, 23, 42, .28);
		padding: 22px;
	}
	.modal-head h2 {
		margin: 0;
	}
	.confirm-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}
	.confirm-grid section {
		border-radius: 18px;
		background: #f8fafc;
		padding: 14px;
	}
	.confirm-grid .wide {
		grid-column: 1 / -1;
	}
	h3 {
		margin: 0 0 10px;
		color: #262a33;
		font-size: 13px;
		font-weight: 800;
	}
	.recipient-preview {
		display: grid;
		gap: 8px;
	}
	.recipient-preview span {
		display: grid;
		gap: 2px;
		border-radius: 14px;
		background: #fff;
		padding: 10px;
		font-weight: 700;
	}
	.subject-preview {
		margin: 0;
		font-weight: 750;
		line-height: 1.7;
	}
	.body-preview {
		max-height: 260px;
		overflow: auto;
		margin: 0;
		white-space: pre-wrap;
		font: inherit;
		line-height: 1.7;
	}
	.thumbs {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 10px;
	}
	.thumbs figure {
		display: grid;
		gap: 8px;
		margin: 0;
	}
	.thumbs img {
		width: 100%;
		aspect-ratio: 4 / 3;
		border-radius: 14px;
		object-fit: cover;
		background: #e5e7eb;
	}
	.thumbs figcaption {
		display: grid;
		gap: 2px;
		color: #3f4652;
		font-size: 12px;
		overflow-wrap: anywhere;
	}
	.modal-actions {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 10px;
	}
	.subtle {
		background: #eef2f7;
		color: #24262b;
	}
	.subtle:hover {
		background: #e5e7eb;
		color: #24262b;
	}
	button { border: none; border-radius: 14px; font-weight: 900; padding: 14px; }
	button:disabled { opacity: .55; cursor: not-allowed; }
	.primary, .sub-button { background: #f08a24; color: #1c1207; }
	.primary:hover, .sub-button:hover { background: #dd7b1b; color: #1c1207; }
	.secondary { background: #17211b; color: white; }
	.secondary:hover { background: #24352c; color: white; }
	.error { border-radius: 14px; padding: 12px; background: #ffe8e4; color: #a53024; }
	@media (max-width: 620px) {
		.template-row, .actions, .confirm-grid, .modal-actions { grid-template-columns: 1fr; }
	}
	@media (min-width: 621px) and (max-width: 1023px) {
		.actions {
			max-width: 520px;
			margin: 0 auto;
		}
	}
	@media (min-width: 1024px) {
		.composer {
			grid-template-columns: minmax(0, 1fr) 360px;
		}
		.card:first-child {
			min-height: 640px;
		}
		.card:first-child textarea {
			min-height: 420px;
		}
		.card:nth-child(2) {
			position: sticky;
			top: 20px;
			max-height: calc(100vh - 40px);
			overflow: auto;
		}
		.actions {
			grid-column: 1;
			position: static;
			grid-template-columns: 1fr 1fr;
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
	.group-toggle:hover { background: #eef2f7 !important; color: #24262b !important; }
	.primary:hover, .sub-button:hover { background: #dd7b1b !important; color: #1c1207 !important; }
	.secondary:hover { background: #24352c !important; color: #fff !important; }
	.subtle, .subtle:hover { background: #eef2f7 !important; color: #24262b !important; }
	.danger, .plain { background: #fff1f0 !important; color: #b42318 !important; }
	.error { border: 0; border-radius: 16px; background: #fff1f0; color: #b42318; }
	.success { border: 0; border-radius: 16px; background: #ecfdf3; color: #067647; }
	.empty, small, .row span, .row small, .list-head p, summary span, .tag-panel small, .tags span, header p, .status { color: #8b929d; }
	.group-toggle:hover,
	.group-toggle:hover strong,
	.group-toggle:hover small {
		color: #24262b !important;
	}
</style>
