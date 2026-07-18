-- 対応予定日時カラムを追加（既存 Supabase プロジェクト向け）
-- Supabase Dashboard → SQL Editor で実行してください。

alter table public.wbs_project_tasks
  add column if not exists scheduled_at text not null default '',
  add column if not exists scheduled_end_at text not null default '',
  add column if not exists google_calendar_event_url text not null default '';
