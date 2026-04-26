-- ── Builder Form submissions ──────────────────────────────────────────
-- For the new Form block (B23). Every public submit goes here. Use the
-- service-role key on the API route; anon clients can't read or write
-- this table directly (RLS).

create table if not exists public.builder_form_submissions (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  form_data   jsonb not null,
  source_page text,
  created_at  timestamptz not null default now()
);

create index if not exists builder_form_submissions_event_created
  on public.builder_form_submissions (event_id, created_at desc);

alter table public.builder_form_submissions enable row level security;

-- Only super_admins can read submissions in the dashboard. The route
-- /api/builder-form writes via service-role.
drop policy if exists "super_admin reads submissions" on public.builder_form_submissions;
create policy "super_admin reads submissions"
  on public.builder_form_submissions
  for select
  to authenticated
  using (public.is_super_admin());

drop policy if exists "no client writes" on public.builder_form_submissions;
create policy "no client writes"
  on public.builder_form_submissions
  for all
  to authenticated
  using (false)
  with check (false);
