# report-sender

Cloudflare Workers (SvelteKit) で動く報告メール送信システムです。
現在は `Cloudflare D1 + R2` 前提です。

## Stack

- SvelteKit + adapter-cloudflare
- D1: ユーザー、招待、パスキー、セッション管理
- R2: ファイル保管（今後の添付/テンプレート用途）
- WebAuthn: パスキー認証

## Setup

1. 依存インストール

```sh
npm install
```

2. D1 スキーマ適用

```sh
wrangler d1 execute report-sender --file=./db/schema.sql
```

3. `wrangler.jsonc` の値を設定
- `d1_databases[0].database_id`
- `r2_buckets[0].bucket_name`

4. 開発起動

```sh
npm run dev
```

## Auth Flow

1. 管理者が招待リンク作成
2. 招待リンクでユーザー登録
3. サーバーが Cookie セッション発行
4. 任意でパスキー登録、次回以降ログイン

## Initial Admin

- 管理者が0人の状態では招待リンクを作成できないため、`/login` の「初期管理者を作成」から最初の管理者を1名作成してください。
- `BOOTSTRAP_ADMIN_KEY` を Workers 環境変数に設定した場合、同じ値の入力が必要です。
- 既存管理者がログイン状態を失った場合は、`/login` の「管理者キーでログイン」を使って復旧できます（`BOOTSTRAP_ADMIN_KEY` 必須）。
