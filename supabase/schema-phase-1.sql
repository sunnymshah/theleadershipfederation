-- =========================================================================
-- The Leadership Federation — Admin Console Phase 1
-- Run this ONCE in Supabase → SQL Editor → New Query → Run
-- =========================================================================
-- If you ran the old schema.sql, drop those tables first:
--   drop table if exists tickets cascade;
--   drop table if exists speakers cascade;
--   drop table if exists events cascade;
--   drop table if exists profiles cascade;
-- =========================================================================


-- ─── EVENTS ──────────────────────────────────────────────────────────────
-- Core entity. Every ticket and speaker belongs to an event.

create table events (
  id              uuid default gen_random_uuid() primary key,
  title           text not null,
  slug            text not null unique,
  start_date      timestamptz not null,
  end_date        timestamptz not null,
  venue           text not null,
  description     text,
  cover_image_url text,
  status          text not null default 'draft'
                  check (status in ('draft', 'published', 'completed', 'cancelled')),
  created_by      uuid references auth.users (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_events_slug       on events (slug);
create index idx_events_status     on events (status);
create index idx_events_start_date on events (start_date desc);


-- ─── TICKETS ─────────────────────────────────────────────────────────────
-- Each event can have multiple ticket tiers (VIP, Standard, Student, etc.)

create table tickets (
  id              uuid default gen_random_uuid() primary key,
  event_id        uuid references events (id) on delete cascade not null,
  name            text not null,
  description     text,
  price_inr       integer not null default 0,
  inventory_limit integer not null default 0,
  sold            integer not null default 0,
  status          text not null default 'draft'
                  check (status in ('draft', 'published', 'archived')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_tickets_event on tickets (event_id);


-- ─── SPEAKERS ────────────────────────────────────────────────────────────
-- Each event has a lineup of speakers

create table speakers (
  id              uuid default gen_random_uuid() primary key,
  event_id        uuid references events (id) on delete cascade not null,
  name            text not null,
  designation     text,
  company         text,
  bio             text,
  image_url       text,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_speakers_event on speakers (event_id);


-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────

alter table events   enable row level security;
alter table tickets  enable row level security;
alter table speakers enable row level security;

-- Authenticated admins: full CRUD on all tables
create policy "auth_events_select"   on events   for select to authenticated using (true);
create policy "auth_events_insert"   on events   for insert to authenticated with check (true);
create policy "auth_events_update"   on events   for update to authenticated using (true);
create policy "auth_events_delete"   on events   for delete to authenticated using (true);

create policy "auth_tickets_select"  on tickets  for select to authenticated using (true);
create policy "auth_tickets_insert"  on tickets  for insert to authenticated with check (true);
create policy "auth_tickets_update"  on tickets  for update to authenticated using (true);
create policy "auth_tickets_delete"  on tickets  for delete to authenticated using (true);

create policy "auth_speakers_select" on speakers for select to authenticated using (true);
create policy "auth_speakers_insert" on speakers for insert to authenticated with check (true);
create policy "auth_speakers_update" on speakers for update to authenticated using (true);
create policy "auth_speakers_delete" on speakers for delete to authenticated using (true);

-- Anonymous visitors: read-only for published events and their children
create policy "anon_events_select" on events for select to anon
  using (status = 'published');

create policy "anon_tickets_select" on tickets for select to anon
  using (exists (
    select 1 from events where events.id = tickets.event_id and events.status = 'published'
  ));

create policy "anon_speakers_select" on speakers for select to anon
  using (exists (
    select 1 from events where events.id = speakers.event_id and events.status = 'published'
  ));


-- ─── SEED DATA ───────────────────────────────────────────────────────────

insert into events (title, slug, start_date, end_date, venue, description, status) values
  (
    'Asia Leadership Summit 2025',
    'asia-leadership-summit-2025',
    '2025-09-15 09:00:00+05:30',
    '2025-09-16 18:00:00+05:30',
    'Jio World Centre, Mumbai',
    'A premier gathering of CXOs and leaders across Asia.',
    'published'
  ),
  (
    'GCC Conclave Dubai 2025',
    'gcc-conclave-dubai-2025',
    '2025-11-20 10:00:00+04:00',
    '2025-11-21 17:00:00+04:00',
    'Madinat Jumeirah, Dubai',
    'Strategic leadership forum for GCC decision makers.',
    'draft'
  );

insert into tickets (event_id, name, description, price_inr, inventory_limit, status)
  select id, 'VIP Pass', 'Full access + networking dinner', 25000, 50, 'published'
  from events where slug = 'asia-leadership-summit-2025';

insert into tickets (event_id, name, description, price_inr, inventory_limit, status)
  select id, 'Standard Pass', 'Conference access', 10000, 500, 'published'
  from events where slug = 'asia-leadership-summit-2025';

insert into speakers (event_id, name, designation, company, bio)
  select id, 'Rajesh Verma', 'CEO', 'Global Tech Solutions',
         'Serial entrepreneur with 20+ years in enterprise software.'
  from events where slug = 'asia-leadership-summit-2025';

insert into speakers (event_id, name, designation, company, bio)
  select id, 'Priya Kapoor', 'CIO', 'South Asia Ventures',
         'Leading venture investor in climate tech and fintech.'
  from events where slug = 'asia-leadership-summit-2025';
