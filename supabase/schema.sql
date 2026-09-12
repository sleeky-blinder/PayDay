-- Payday · Supabase schema
-- Run this once in the SQL editor of your Supabase project.

create table if not exists public.docs (
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  path       text        not null,                 -- 'money/state' or 'ledger/2026-10'
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, path)
);

alter table public.docs enable row level security;

drop policy if exists "own rows: read"   on public.docs;
drop policy if exists "own rows: insert" on public.docs;
drop policy if exists "own rows: update" on public.docs;
drop policy if exists "own rows: delete" on public.docs;

create policy "own rows: read"   on public.docs for select using  (auth.uid() = user_id);
create policy "own rows: insert" on public.docs for insert with check (auth.uid() = user_id);
create policy "own rows: update" on public.docs for update using  (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows: delete" on public.docs for delete using  (auth.uid() = user_id);

-- Merge a batch of ledger entries (keyed by id) into one month document.
-- Creates the month if it does not exist. Tombstones ({id, del:true, ts}) merge the same way.
create or replace function public.merge_items(p_path text, p_items jsonb)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.docs (user_id, path, data, updated_at)
  values (auth.uid(), p_path, jsonb_build_object('items', coalesce(p_items, '{}'::jsonb)), now())
  on conflict (user_id, path) do update
    set data = jsonb_set(coalesce(public.docs.data, '{}'::jsonb), '{items}',
                         coalesce(public.docs.data->'items', '{}'::jsonb) || coalesce(excluded.data->'items', '{}'::jsonb)),
        updated_at = now();
$$;

grant execute on function public.merge_items(text, jsonb) to authenticated;

-- Live updates to every signed-in device.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'docs'
  ) then
    alter publication supabase_realtime add table public.docs;
  end if;
end $$;

alter table public.docs replica identity full;
