-- ── Per-event editorial team ──────────────────────────────────────────
-- Lets a super_admin grant builder access to an individual editor for a
-- single event without giving them edit rights to every event. Used by
-- the row-level gate in app/admin/builder/[id]/page.tsx.
--
-- Apply via Supabase SQL Editor (no CLI in this workflow).

create table if not exists public.event_team_members (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  role     text not null default 'editor',
  added_by uuid references auth.users(id) on delete set null,
  added_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index if not exists event_team_members_user
  on public.event_team_members (user_id);

alter table public.event_team_members enable row level security;

drop policy if exists "super_admin manage event team" on public.event_team_members;
create policy "super_admin manage event team"
  on public.event_team_members
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "users see their own membership" on public.event_team_members;
create policy "users see their own membership"
  on public.event_team_members
  for select
  to authenticated
  using (user_id = auth.uid());
