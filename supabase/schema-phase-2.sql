-- =========================================================================
-- The Leadership Federation — Admin Console Phase 2
-- Run this AFTER schema-phase-1.sql in Supabase → SQL Editor
-- Adds: attendees, sessions, session_speakers, sponsors, promo_codes
-- =========================================================================


-- ─── ATTENDEES ──────────────────────────────────────────────────────────
-- Registrations / ticket holders for each event

create table attendees (
  id                uuid default gen_random_uuid() primary key,
  event_id          uuid references events (id) on delete cascade not null,
  ticket_id         uuid references tickets (id) on delete set null,
  name              text not null,
  email             text not null,
  phone             text,
  company           text,
  designation       text,
  registration_date timestamptz not null default now(),
  check_in_at       timestamptz,
  status            text not null default 'registered'
                    check (status in ('registered', 'confirmed', 'checked_in', 'cancelled', 'waitlisted')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_attendees_event  on attendees (event_id);
create index idx_attendees_email  on attendees (email);
create index idx_attendees_status on attendees (status);


-- ─── SESSIONS / AGENDA ──────────────────────────────────────────────────
-- Individual sessions within an event (keynote, panel, workshop, break)

create table sessions (
  id           uuid default gen_random_uuid() primary key,
  event_id     uuid references events (id) on delete cascade not null,
  title        text not null,
  description  text,
  start_time   timestamptz not null,
  end_time     timestamptz not null,
  track        text,
  session_type text not null default 'session'
               check (session_type in ('keynote', 'session', 'panel', 'workshop', 'break', 'networking')),
  room         text,
  capacity     integer,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_sessions_event on sessions (event_id);


-- ─── SESSION ↔ SPEAKER (many-to-many) ───────────────────────────────────

create table session_speakers (
  session_id uuid references sessions (id) on delete cascade,
  speaker_id uuid references speakers (id) on delete cascade,
  primary key (session_id, speaker_id)
);


-- ─── SPONSORS ───────────────────────────────────────────────────────────
-- Sponsors / partners for each event with tier levels

create table sponsors (
  id          uuid default gen_random_uuid() primary key,
  event_id    uuid references events (id) on delete cascade not null,
  name        text not null,
  tier        text not null default 'gold'
              check (tier in ('title', 'platinum', 'gold', 'silver', 'bronze', 'partner')),
  logo_url    text,
  website     text,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_sponsors_event on sponsors (event_id);


-- ─── PROMO CODES ────────────────────────────────────────────────────────
-- Discount codes for ticket purchases

create table promo_codes (
  id             uuid default gen_random_uuid() primary key,
  event_id       uuid references events (id) on delete cascade not null,
  code           text not null,
  discount_type  text not null default 'percentage'
                 check (discount_type in ('percentage', 'flat')),
  discount_value integer not null,
  max_uses       integer,
  used_count     integer not null default 0,
  valid_from     timestamptz,
  valid_until    timestamptz,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create index idx_promo_codes_event on promo_codes (event_id);
create unique index idx_promo_codes_code on promo_codes (event_id, code);


-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────

alter table attendees       enable row level security;
alter table sessions        enable row level security;
alter table session_speakers enable row level security;
alter table sponsors        enable row level security;
alter table promo_codes     enable row level security;

-- Authenticated: full CRUD
create policy "auth_attendees_select"  on attendees  for select to authenticated using (true);
create policy "auth_attendees_insert"  on attendees  for insert to authenticated with check (true);
create policy "auth_attendees_update"  on attendees  for update to authenticated using (true);
create policy "auth_attendees_delete"  on attendees  for delete to authenticated using (true);

create policy "auth_sessions_select"   on sessions   for select to authenticated using (true);
create policy "auth_sessions_insert"   on sessions   for insert to authenticated with check (true);
create policy "auth_sessions_update"   on sessions   for update to authenticated using (true);
create policy "auth_sessions_delete"   on sessions   for delete to authenticated using (true);

create policy "auth_ss_select" on session_speakers for select to authenticated using (true);
create policy "auth_ss_insert" on session_speakers for insert to authenticated with check (true);
create policy "auth_ss_delete" on session_speakers for delete to authenticated using (true);

create policy "auth_sponsors_select"   on sponsors   for select to authenticated using (true);
create policy "auth_sponsors_insert"   on sponsors   for insert to authenticated with check (true);
create policy "auth_sponsors_update"   on sponsors   for update to authenticated using (true);
create policy "auth_sponsors_delete"   on sponsors   for delete to authenticated using (true);

create policy "auth_promo_select"      on promo_codes for select to authenticated using (true);
create policy "auth_promo_insert"      on promo_codes for insert to authenticated with check (true);
create policy "auth_promo_update"      on promo_codes for update to authenticated using (true);
create policy "auth_promo_delete"      on promo_codes for delete to authenticated using (true);

-- Anonymous: read published event data
create policy "anon_sessions_select" on sessions for select to anon
  using (exists (
    select 1 from events where events.id = sessions.event_id and events.status = 'published'
  ));

create policy "anon_ss_select" on session_speakers for select to anon
  using (exists (
    select 1 from sessions s
    join events e on e.id = s.event_id
    where s.id = session_speakers.session_id and e.status = 'published'
  ));

create policy "anon_sponsors_select" on sponsors for select to anon
  using (exists (
    select 1 from events where events.id = sponsors.event_id and events.status = 'published'
  ));
