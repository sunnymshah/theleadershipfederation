-- =========================================================================
-- Security infrastructure tables
--
-- 1. security_events      — immutable audit log of every admin mutation
-- 2. login_attempts       — tracks failed logins for brute-force lockout
-- 3. rate_limits          — durable rate-limit buckets (multi-instance safe)
-- 4. ip_blocklist         — manually blocked IPs (admin UI can add rows)
--
-- All four tables are admin-only via RLS. Writes go through server actions
-- using the service-role admin client.
-- =========================================================================

-- ── 1. AUDIT LOG ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security_events (
  id          bigint generated always as identity primary key,
  actor_id    uuid,                        -- auth.users.id; null for system
  actor_email text,
  action      text NOT NULL,               -- e.g. "event.create", "profile.delete"
  target_type text,                        -- e.g. "event", "attendee", "team_member"
  target_id   text,                        -- UUID / slug / whatever identifies the target
  ip          text,
  user_agent  text,
  metadata    jsonb,                       -- arbitrary extra context (before/after snapshot, etc.)
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_actor
  ON security_events (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_action
  ON security_events (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_target
  ON security_events (target_type, target_id);

-- Rows are append-only. Deny UPDATE/DELETE even to authenticated.
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_events superadmin read" ON security_events;
CREATE POLICY "security_events superadmin read"
  ON security_events FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- No INSERT policy for authenticated — writes happen via service-role
-- admin client from server actions only. That's the audit trail's
-- integrity guarantee: end users cannot forge entries.

-- ── 2. LOGIN ATTEMPTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_attempts (
  id          bigint generated always as identity primary key,
  email       text NOT NULL,
  ip          text,
  success     boolean NOT NULL,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time
  ON login_attempts (email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time
  ON login_attempts (ip, created_at DESC);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "login_attempts superadmin read" ON login_attempts;
CREATE POLICY "login_attempts superadmin read"
  ON login_attempts FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- ── 3. RATE LIMITS (durable, multi-instance safe) ──────────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key   text NOT NULL,    -- e.g. "contact:1.2.3.4", "lookup:1.2.3.4"
  window_start timestamptz NOT NULL,
  hits         int NOT NULL DEFAULT 1,
  PRIMARY KEY (bucket_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key
  ON rate_limits (bucket_key, window_start DESC);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- No public policies — service-role only.

-- Auto-cleanup function: drops buckets older than 24h. Call from a
-- Postgres cron job or invoke manually.
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM rate_limits
  WHERE window_start < now() - interval '24 hours';
$$;

-- ── 4. IP BLOCKLIST ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ip_blocklist (
  ip          text PRIMARY KEY,
  reason      text,
  blocked_by  uuid,         -- auth.users.id of admin who blocked
  blocked_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz   -- null = permanent
);

CREATE INDEX IF NOT EXISTS idx_ip_blocklist_expiry
  ON ip_blocklist (expires_at);

ALTER TABLE ip_blocklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ip_blocklist superadmin all" ON ip_blocklist;
CREATE POLICY "ip_blocklist superadmin all"
  ON ip_blocklist FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
