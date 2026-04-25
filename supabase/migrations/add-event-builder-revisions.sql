-- ── Event builder revisions ───────────────────────────────────────────
-- Append-only history of published builder snapshots. Lets admins roll
-- back to any prior published state. INSERTed by publishBuilderAtomic
-- every time a publish succeeds.
--
-- Apply via Supabase SQL Editor (no CLI in this workflow).

create table if not exists public.event_builder_revisions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  data jsonb not null,
  pages jsonb not null default '{}'::jsonb,
  published_by uuid references auth.users(id) on delete set null,
  label text,
  created_at timestamptz not null default now()
);

create index if not exists event_builder_revisions_event_created
  on public.event_builder_revisions (event_id, created_at desc);

alter table public.event_builder_revisions enable row level security;

-- Only super_admins read revisions; other paths go through server
-- actions that use the service-role key.
drop policy if exists "super_admin read revisions" on public.event_builder_revisions;
create policy "super_admin read revisions"
  on public.event_builder_revisions
  for select
  to authenticated
  using (public.is_super_admin());

-- No client-side inserts/updates — server actions write via service-role.
drop policy if exists "block client writes" on public.event_builder_revisions;
create policy "block client writes"
  on public.event_builder_revisions
  for all
  to authenticated
  using (false)
  with check (false);
