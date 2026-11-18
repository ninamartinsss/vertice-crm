create table public.vertice_workspaces (
  owner_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  revision integer not null default 1 check (revision > 0),
  records jsonb not null check (
    jsonb_typeof(records) = 'object'
    and records ?& array['contatos', 'funil', 'agenda', 'empresas', 'tarefas', 'historico']
    and octet_length(records::text) <= 4000000
  )
);
alter table public.vertice_workspaces enable row level security;
revoke all on public.vertice_workspaces from public, anon, authenticated;
grant select, insert, update on public.vertice_workspaces to authenticated;

create policy vertice_read_own on public.vertice_workspaces
for select to authenticated using (owner_id = (select auth.uid()));
create policy vertice_insert_own on public.vertice_workspaces
for insert to authenticated with check (owner_id = (select auth.uid()));
create policy vertice_update_own on public.vertice_workspaces
for update to authenticated using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
