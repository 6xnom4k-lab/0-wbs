# 0-wbs

WBS（Work Breakdown Structure）を階層的に作成・編集する Web アプリです。

## 技術スタック

- Next.js (App Router)
- TypeScript
- Tailwind CSS

## 開発

```bash
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 画面構成

- `/` — プロジェクト一覧（マスター管理画面）
- `/projects/[id]` — 各プロジェクトの WBS 編集画面

## 機能

- プロジェクトの作成・一覧表示・削除
- プロジェクトごとの WBS 編集画面への遷移
- WBS 項目の追加・名称変更・削除
- 階層コード（1, 1.1, 1.2 ...）の自動採番
- ブラウザ localStorage への自動保存（Supabase 未設定時）
- Supabase PostgreSQL 連携（設定時は全員でデータ共有）

## Supabase 連携

詳細は [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) を参照してください。

1. Supabase でプロジェクト作成
2. `supabase/schema.sql` を SQL Editor で実行
3. `.env.local` に URL と anon key を設定
4. `npm run dev` を再起動

画面上部が **「データ保存先: Supabase（共有DB）」** になれば OK です。

## リポジトリ

https://github.com/6xnom4k-lab/0-wbs
