-- =========================================================================
-- The Leadership Federation — Admin Console Phase 1 Schema
-- Run this in Supabase SQL Editor
-- =========================================================================

-- ─── Events ──────────────────────────────────────────────────────────────

create table events (
  id              uuid default gen_random_uuid() primary key,
  title           text not null,
  slug            text not null unique,
  start_date      timestamptz not null,
  end_date        timestamptz not null,
  venue           text not null,
  description     text,
  status          text not null default 'draft'
                  check (status in ('draft', 'published', 'completed', 'cancelled')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users (id)
);

create index idx_events_slug on events(slug);
create index idx_events_status on events(status);
create index idx_events_start_date on events(start_date);

-- ─── Tickets ─────────────────────────────────────────────────────────────

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

create index idx_tickets_event_id on tickets(event_id);
create index idx_tickets_status on tickets(status);

-- ─── Speakers ────────────────────────────────────────────────────────────

create table speakers (
  id              uuid default gen_random_uuid() primary key,
  event_id        uuid references events (id) on delete cascade not null,
  name            text not null,
  designation     text,
  company         text,
  bio             text,
  image_url       text,
  social_linkedin text,
  social_twitter  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_speakers_event_id on speakers(event_id);

-- ─── Row Level Security ──────────────────────────────────────────────────

alter table events   enable row level security;
alter table tickets  enable row level security;
alter table speakers enable row level security;

-- Admin users (authenticated) can CRUD all events/tickets/speakers
create policy "Admins can read events"
  on events for select to authenticated using (true);

create policy "Admins can insert events"
  on events for insert to authenticated with check (auth.uid() is not null);

create policy "Admins can update events"
  on events for update to authenticated using (true) with check (true);

create policy "Admins can delete events"
  on events for delete to authenticated using (true);

create policy "Admins can read tickets"
  on tickets for select to authenticated using (true);

create policy "Admins can insert tickets"
  on tickets for insert to authenticated with check (auth.uid() is not null);

create policy "Admins can update tickets"
  on tickets for update to authenticated using (true) with check (true);

create policy "Admins can delete tickets"
  on tickets for delete to authenticated using (true);

create policy "Admins can read speakers"
  on speakers for select to authenticated using (true);

create policy "Admins can insert speakers"
  on speakers for insert to authenticated with check (auth.uid() is not null);

create policy "Admins can update speakers"
  on speakers for update to authenticated using (true) with check (true);

create policy "Admins can delete speakers"
  on speakers for delete to authenticated using (true);

-- Public read access for published events (for the website)
create policy "Public can read published events"
  on events for select to anon using (status = 'published');

create policy "Public can read published tickets"
  on tickets for select to anon using (
    exists (select 1 from events where events.id = tickets.event_id and events.status = 'published')
  );

create policy "Public can read published speakers"
  on speakers for select to anon using (
    exists (select 1 from events where events.id = speakers.event_id and events.status = 'published')
  );

-- ─── Seed Data ───────────────────────────────────────────────────────────

insert into events (title, slug, start_date, end_date, venue, description, status) values
  (
    'Asia Leadership Summit 2025',
    'asia-leadership-summit-2025',
    '2025-09-15 09:00:00+05:30',
    '2025-09-16 18:00:00+05:30',
    'Jio World Centre, Mumbai',
    'A premier gathering of CXOs and leaders across Asia',
    'published'
  ),
  (
    'GCC Conclave Dubai 2025',
    'gcc-conclave-dubai-2025',
    '2025-11-20 10:00:00+04:00',
    '2025-11-21 17:00:00+04:00',
    'Madinat Jumeirah, Dubai',
    'Strategic leadership forum for GCC decision makers',
    'draft'
  );

-- Seed tickets for the first event
insert into tickets (event_id, name, description, price_inr, inventory_limit, status) values
  (
    (select id from events where slug = 'asia-leadership-summit-2025'),
    'VIP Pass',
    'Full access + networking dinner',
    25000,
    50,
    'published'
  ),
  (
    (select id from events where slug = 'asia-leadership-summit-2025'),
    'Standard Pass',
    'Full conference access',
    10000,
    500,
    'published'
  ),
  (
    (select id from events where slug = 'asia-leadership-summit-2025'),
    'Student Pass',
    'Student rate (valid ID required)',
    3000,
    100,
    'published'
  );

-- Seed speakers for the first event
insert into speakers (event_id, name, designation, company, bio, social_linkedin) values
  (
    (select id from events where slug = 'asia-leadership-summit-2025'),
    'Rajesh Verma',
    'Chief Executive Officer',
    'Global Tech Solutions',
    'Serial entrepreneur with 20+ years of experience building enterprise software',
    'https://linkedin.com/in/rajesh-verma'
  ),
  (
    (select id from events where slug = 'asia-leadership-summit-2025'),
    'Priya Kapoor',
    'Chief Investment Officer',
    'South Asia Ventures',
    'Leading venture investor focused on climate tech and fintech innovation',
    'https://linkedin.com/in/priya-kapoor'
  );
