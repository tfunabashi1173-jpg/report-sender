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
2. 招待リンクでユーザー登録（名前/パスワード必須）
3. サーバーが Cookie セッション発行
4. 登録直後にパスキー登録
5. 以降はパスキー、または名前/パスワードでログイン

## Initial Admin

- 管理者が0人の状態では招待リンクを作成できないため、`/login` の「初期管理者を作成」から最初の管理者を1名作成してください。
- 初期管理者作成時は `管理者名 / ログインパスワード` が必須です。
- `/login` では管理者の有無を自動判定し、管理者が存在する場合は初期セットアップを表示しません。
