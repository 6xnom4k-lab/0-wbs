-- Progress percent for manual project tasks (existing DBs)

alter table public.wbs_project_tasks
  add column if not exists progress_percent integer check (progress_percent >= 0 and progress_percent <= 100);
