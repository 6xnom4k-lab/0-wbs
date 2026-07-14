-- 0-wbs Supabase schema
-- Supabase Dashboard → SQL Editor でこのファイルを実行してください。

create extension if not exists "pgcrypto";

create table if not exists public.wbs_projects (
  id text primary key,
  name text not null,
  root jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wbs_project_tasks (
  id text primary key,
  project_id text not null references public.wbs_projects (id) on delete cascade,
  category text not null default '',
  title text not null,
  detail text not null default '',
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  start_date text not null default '',
  end_date text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wbs_project_tasks_project_id_idx
  on public.wbs_project_tasks (project_id);

create table if not exists public.wbs_accounts (
  id text primary key,
  display_name text not null default '',
  email text not null default '',
  department text not null default '',
  role text not null default '',
  permission text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists wbs_projects_set_updated_at on public.wbs_projects;
create trigger wbs_projects_set_updated_at
before update on public.wbs_projects
for each row execute function public.set_updated_at();

drop trigger if exists wbs_project_tasks_set_updated_at on public.wbs_project_tasks;
create trigger wbs_project_tasks_set_updated_at
before update on public.wbs_project_tasks
for each row execute function public.set_updated_at();

drop trigger if exists wbs_accounts_set_updated_at on public.wbs_accounts;
create trigger wbs_accounts_set_updated_at
before update on public.wbs_accounts
for each row execute function public.set_updated_at();

alter table public.wbs_projects enable row level security;
alter table public.wbs_project_tasks enable row level security;
alter table public.wbs_accounts enable row level security;

-- テスト段階: 匿名キーでも読み書き可能（本番前に認証 + RLS に差し替え）
drop policy if exists "wbs_projects_public_all" on public.wbs_projects;
create policy "wbs_projects_public_all"
on public.wbs_projects
for all
using (true)
with check (true);

drop policy if exists "wbs_project_tasks_public_all" on public.wbs_project_tasks;
create policy "wbs_project_tasks_public_all"
on public.wbs_project_tasks
for all
using (true)
with check (true);

drop policy if exists "wbs_accounts_public_all" on public.wbs_accounts;
create policy "wbs_accounts_public_all"
on public.wbs_accounts
for all
using (true)
with check (true);
