-- =========================================================================
-- The Leadership Federation — Database Schema
-- Run this in Supabase SQL Editor (supabase.com → project → SQL Editor)
-- =========================================================================

-- ─── Profiles (linked to Supabase Auth) ──────────────────────────────────

create table profiles (
  id          uuid references auth.users (id) on delete cascade primary key,
  email       text not null,
  full_name   text,
  role        text not null default 'admin'
              check (role in ('admin', 'editor', 'viewer')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create a profile row when a new user signs up via Supabase Auth
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'admin');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Events ──────────────────────────────────────────────────────────────

create table events (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  date        timestamptz not null,
  venue       text not null,
  status      text not null default 'draft'
              check (status in ('draft', 'published', 'completed', 'cancelled')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Tickets ─────────────────────────────────────────────────────────────

create table tickets (
  id              uuid default gen_random_uuid() primary key,
  event_id        uuid references events (id) on delete cascade not null,
  name            text not null,
  price_in_inr    integer not null default 0,
  total_inventory integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Row Level Security ──────────────────────────────────────────────────

alter table profiles enable row level security;
alter table events   enable row level security;
alter table tickets  enable row level security;

-- Profiles: users can read their own profile
create policy "Users can read own profile"
  on profiles for select
  to authenticated
  using (id = auth.uid());

-- Events: any authenticated user (admin) can CRUD
create policy "Admins can read events"
  on events for select to authenticated using (true);

create policy "Admins can insert events"
  on events for insert to authenticated with check (true);

create policy "Admins can update events"
  on events for update to authenticated using (true);

create policy "Admins can delete events"
  on events for delete to authenticated using (true);

-- Tickets: any authenticated user (admin) can CRUD
create policy "Admins can read tickets"
  on tickets for select to authenticated using (true);

create policy "Admins can insert tickets"
  on tickets for insert to authenticated with check (true);

create policy "Admins can update tickets"
  on tickets for update to authenticated using (true);

create policy "Admins can delete tickets"
  on tickets for delete to authenticated using (true);

-- ─── Seed data ───────────────────────────────────────────────────────────

insert into events (title, date, venue, status) values
  ('Asia Leadership Summit 2025', '2025-09-15 09:00:00+05:30', 'Jio World Centre, Mumbai', 'published'),
  ('GCC Conclave Dubai 2025', '2025-11-20 10:00:00+04:00', 'Madinat Jumeirah, Dubai', 'draft');
