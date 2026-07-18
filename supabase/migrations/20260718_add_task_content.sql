-- Add notes and content to project tasks (existing DBs)

alter table public.wbs_project_tasks
  add column if not exists notes text not null default '',
  add column if not exists content text not null default '';
