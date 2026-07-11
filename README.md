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
- ブラウザ localStorage への自動保存

## リポジトリ

https://github.com/6xnom4k-lab/0-wbs
