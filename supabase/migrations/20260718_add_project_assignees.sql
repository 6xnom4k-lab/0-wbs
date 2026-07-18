-- Project-scoped assignees for WBS selection (existing DBs)

alter table public.wbs_projects
  add column if not exists assignees jsonb not null default '[]'::jsonb;
