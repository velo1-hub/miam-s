-- Responsable par dossier et tâches internes (jamais visibles par le client).
alter table public.dossiers add column if not exists assignee text not null default '' check (char_length(assignee) <= 200);

create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers (id) on delete cascade,
  created_at timestamptz not null default now(),
  label      text not null check (char_length(label) between 1 and 300),
  assignee   text not null default '' check (char_length(assignee) <= 200),
  due_date   date,
  done       boolean not null default false
);
create index if not exists tasks_dossier_idx on public.tasks (dossier_id);
create index if not exists tasks_open_idx on public.tasks (done, due_date);
alter table public.tasks enable row level security;
create policy tasks_staff on public.tasks for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
revoke all on public.tasks from anon;
grant select, insert, update, delete on public.tasks to authenticated;
