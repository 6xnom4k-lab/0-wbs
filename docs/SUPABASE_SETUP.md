# Supabase セットアップ（0-wbs）

アカウント: **6xnom4k@gmail.com** で作成済みの Supabase を使います。

## 1. プロジェクトを作成

1. [Supabase Dashboard](https://supabase.com/dashboard) に **6xnom4k@gmail.com** でログイン
2. **New project**
3. 設定例:
   - **Name**: `0-wbs`
   - **Database Password**: 安全なパスワード（メモしておく）
   - **Region**: `Northeast Asia (Tokyo)` 推奨
4. プロジェクトの作成完了を待つ（1〜2分）

## 2. テーブルを作成

1. 左メニュー **SQL Editor** → **New query**
2. リポジトリの [`supabase/schema.sql`](../supabase/schema.sql) の内容をすべてコピー
3. **Run** を実行
4. `Success` と表示されれば OK

## 3. API キーを取得

1. 左メニュー **Project Settings** → **API**
2. 次の2つをコピー:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. ローカル環境変数

プロジェクトルートに `.env.local` を作成:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

開発サーバーを再起動:

```bash
npm run dev
```

画面上部に **「データ保存先: Supabase（共有DB）」** と表示されれば接続成功です。

## 5. 既存の localStorage データを移行（任意）

ブラウザに既にプロジェクトがある場合:

1. DevTools → Console で次を実行（または今後 UI ボタンを追加予定）

```javascript
// 移行はアプリ内から行う場合、プロジェクト一覧画面の移行機能を利用
```

コードから移行する場合:

```typescript
import { migrateLocalProjectsToSupabase } from "@/lib/project-store";

const count = await migrateLocalProjectsToSupabase();
console.log(`${count} 件移行しました`);
```

## 6. Vercel にデプロイする場合

Vercel プロジェクトの **Environment Variables** に同じ2変数を設定し、Redeploy します。

## セキュリティ（テスト後に必ず）

現在の `schema.sql` は **テスト用** に anon キーで誰でも読み書きできる RLS になっています。

本番・社外テスト前に:

1. Supabase **Authentication** でログインを有効化
2. RLS を `auth.uid()` ベースに変更
3. プロジェクトごとに `owner_id` カラムを追加

## トラブルシュート

| 症状 | 対処 |
|---|---|
| 画面上部が amber（localStorage）のまま | `.env.local` を確認し `npm run dev` を再起動 |
| `relation "wbs_projects" does not exist` | `schema.sql` を SQL Editor で実行 |
| 1週間触らないと止まる | Supabase 無料枠: Dashboard から **Restore project** |
| データが他ユーザーに見える | テスト用設定のため正常。RLS を強化する |

## データ構造

| テーブル | 内容 |
|---|---|
| `wbs_projects` | WBS プロジェクト（`root` は JSON ツリー） |
| `wbs_project_tasks` | タスク管理画面のタスク |
| `wbs_accounts` | 担当者マスタ |
