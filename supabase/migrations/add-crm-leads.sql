-- ════════════════════════════════════════════════════════════════════════
--  CRM LEADS (Zoho-style pipeline)
--
--  Distinct from `sponsor_leads` (which is booth-scan capture for a
--  specific event + sponsor). This is the federation-wide CRM pipeline:
--  every prospect — speaker outreach, partner inquiry, VIP prospect,
--  site lead — flows through here with stages, owner, notes, activity
--  timeline, and tasks.
--
--  Safe to re-apply: every CREATE uses IF NOT EXISTS.
-- ════════════════════════════════════════════════════════════════════════

-- ── crm_leads ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  first_name  TEXT NOT NULL,
  last_name   TEXT,
  full_name   TEXT GENERATED ALWAYS AS (
    TRIM(BOTH ' ' FROM (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')))
  ) STORED,
  email       TEXT,
  phone       TEXT,

  -- Professional
  company     TEXT,
  title       TEXT,
  industry    TEXT,
  website_url TEXT,
  linkedin_url TEXT,

  -- Location
  city        TEXT,
  country     TEXT,

  -- Pipeline
  status      TEXT NOT NULL DEFAULT 'new'
              CHECK (status IN ('new','contacted','qualified','proposal','won','lost')),
  rating      TEXT DEFAULT 'warm'
              CHECK (rating IN ('hot','warm','cold')),
  score       INT DEFAULT 0,
  lead_value  NUMERIC(12, 2),

  -- Source / attribution
  source      TEXT DEFAULT 'other'
              CHECK (source IN (
                'website','event','referral','import','campaign',
                'linkedin','cold_outreach','sponsor_booth','other'
              )),
  source_detail TEXT,
  utm_source  TEXT,
  utm_medium  TEXT,
  utm_campaign TEXT,

  -- Ownership
  owner_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Tags + free-form
  tags        TEXT[] DEFAULT '{}',
  description TEXT,

  -- Conversion
  converted_at            TIMESTAMPTZ,
  converted_to_attendee_id UUID REFERENCES attendees(id) ON DELETE SET NULL,

  -- Audit
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_status   ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner    ON crm_leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_email    ON crm_leads(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_crm_leads_created  ON crm_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source   ON crm_leads(source);

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

-- Authenticated team can manage leads (gated at app layer via
-- requirePermission("attendees", ...)). Anon has no access.
DROP POLICY IF EXISTS "crm_leads_auth_all" ON crm_leads;
CREATE POLICY "crm_leads_auth_all"
  ON crm_leads FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION crm_leads_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_leads_touch ON crm_leads;
CREATE TRIGGER trg_crm_leads_touch
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION crm_leads_touch_updated_at();


-- ── crm_lead_notes ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_lead_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  author_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_lead_notes_lead ON crm_lead_notes(lead_id, created_at DESC);

ALTER TABLE crm_lead_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crm_lead_notes_auth_all" ON crm_lead_notes;
CREATE POLICY "crm_lead_notes_auth_all"
  ON crm_lead_notes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);


-- ── crm_lead_activities ──────────────────────────────────────────────────
-- Append-only timeline. Auto-logged by the app (status_change,
-- assignment, conversion, note, email, call, import).
CREATE TABLE IF NOT EXISTS crm_lead_activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN (
                'created','status_change','assignment','note','email',
                'call','meeting','import','conversion','task','tag'
              )),
  summary     TEXT NOT NULL,
  payload     JSONB DEFAULT '{}'::jsonb,
  actor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_lead_activities_lead
  ON crm_lead_activities(lead_id, created_at DESC);

ALTER TABLE crm_lead_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crm_lead_activities_auth_read" ON crm_lead_activities;
DROP POLICY IF EXISTS "crm_lead_activities_auth_insert" ON crm_lead_activities;
CREATE POLICY "crm_lead_activities_auth_read"
  ON crm_lead_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_lead_activities_auth_insert"
  ON crm_lead_activities FOR INSERT TO authenticated WITH CHECK (true);


-- ── crm_tasks ────────────────────────────────────────────────────────────
-- Follow-ups attached to a lead (or standalone).
CREATE TABLE IF NOT EXISTS crm_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  due_date     TIMESTAMPTZ,
  assignee_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'open'
               CHECK (status IN ('open','in_progress','done','cancelled')),
  priority     TEXT DEFAULT 'normal'
               CHECK (priority IN ('low','normal','high')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_lead      ON crm_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_assignee  ON crm_tasks(assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due       ON crm_tasks(due_date) WHERE status = 'open';

ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crm_tasks_auth_all" ON crm_tasks;
CREATE POLICY "crm_tasks_auth_all"
  ON crm_tasks FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Auto-complete timestamp when status flips to done
CREATE OR REPLACE FUNCTION crm_tasks_touch_completed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status <> 'done' THEN
    NEW.completed_at = now();
  ELSIF NEW.status <> 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_tasks_completed ON crm_tasks;
CREATE TRIGGER trg_crm_tasks_completed
  BEFORE UPDATE ON crm_tasks
  FOR EACH ROW EXECUTE FUNCTION crm_tasks_touch_completed();
