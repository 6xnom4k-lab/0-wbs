-- Add assignee, WBS link, and status to project tasks (existing DBs)

alter table public.wbs_project_tasks
  add column if not exists assignee text not null default '',
  add column if not exists wbs_node_id text not null default '',
  add column if not exists status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'done', 'on_hold'));

create index if not exists wbs_project_tasks_wbs_node_id_idx
  on public.wbs_project_tasks (wbs_node_id);

create index if not exists wbs_project_tasks_assignee_idx
  on public.wbs_project_tasks (assignee);
