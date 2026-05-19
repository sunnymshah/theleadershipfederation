-- =========================================================================
-- Fix: point every legacy past event at its ORIGINAL launch site.
--
-- The /archive cards link out via events.external_url. Where that column
-- is empty (or wrong), the card falls back to the internal /events/[slug]
-- page — i.e. "our" page instead of the event's real site.
--
-- This migration sets external_url for all 18 legacy editions to the
-- original URL that was live when the event launched. Every URL below was
-- verified against the live Tilda sitemaps:
--   • theleadershipfederation.com/sitemap.xml
--   • gcc.theleadershipfederation.com/sitemap.xml
-- and the gcc1–gcc4 edition subdomains (all return HTTP 200).
--
-- GCC Leadership Conclaves  → gcc{1..4}.theleadershipfederation.com
--                             (5th → /pune, AI Summit → /ai)
-- Awards & summits          → theleadershipfederation.com event pages
--
-- Idempotent — safe to re-run. UPDATE no-ops if a row doesn't exist.
-- Apply via the Supabase SQL Editor.
-- =========================================================================

-- ── GCC Leadership Conclave — numbered edition subdomains ────────────────
UPDATE events SET external_url = 'https://gcc1.theleadershipfederation.com/'   WHERE slug = 'legacy-gcc-1';
UPDATE events SET external_url = 'https://gcc2.theleadershipfederation.com/'   WHERE slug = 'legacy-gcc-2';
UPDATE events SET external_url = 'https://gcc3.theleadershipfederation.com/'   WHERE slug = 'legacy-gcc-3';
UPDATE events SET external_url = 'https://gcc4.theleadershipfederation.com/'   WHERE slug = 'legacy-gcc-4';
UPDATE events SET external_url = 'https://gcc.theleadershipfederation.com/pune' WHERE slug = 'legacy-gcc-5';
UPDATE events SET external_url = 'https://gcc.theleadershipfederation.com/ai'   WHERE slug = 'legacy-gcc-ai';

-- ── Asia Leadership Awards ───────────────────────────────────────────────
UPDATE events SET external_url = 'https://theleadershipfederation.com/7th-asia-leadership-awards-kuala-lumpur-malaysia' WHERE slug = 'legacy-ala-7';
UPDATE events SET external_url = 'https://theleadershipfederation.com/6thasialeadershipawardsbangkok'                   WHERE slug = 'legacy-ala-6';
UPDATE events SET external_url = 'https://theleadershipfederation.com/5th-asia-leadership-awards-mumbai'                WHERE slug = 'legacy-ala-5';
UPDATE events SET external_url = 'https://theleadershipfederation.com/asialeadershipawardsbangkok2024'                  WHERE slug = 'legacy-ala-4';
UPDATE events SET external_url = 'https://theleadershipfederation.com/pastwinners-asia-leadership-3rd-edition-mumbai'    WHERE slug = 'legacy-ala-3';
UPDATE events SET external_url = 'https://theleadershipfederation.com/winners-2nd-edition-asia-leadership-awards-2019-mumbai' WHERE slug = 'legacy-ala-2';

-- ── Middle East Asia Leadership Awards ───────────────────────────────────
UPDATE events SET external_url = 'https://theleadershipfederation.com/winners-3rd-edition-middleeastasiaawards-dubai'   WHERE slug = 'legacy-meala-3';
UPDATE events SET external_url = 'https://theleadershipfederation.com/winner-2nd-edition-middle-east-asia-leadership'    WHERE slug = 'legacy-meala-2';

-- ── Bharat Leadership Excellence Awards ──────────────────────────────────
UPDATE events SET external_url = 'https://theleadershipfederation.com/2ndbharatleadershipawards'        WHERE slug = 'legacy-blea-2';
UPDATE events SET external_url = 'https://theleadershipfederation.com/bharatleadershipexcellenceawards' WHERE slug = 'legacy-blea-1';

-- ── Innovation & Startup Summit & Awards ─────────────────────────────────
UPDATE events SET external_url = 'https://theleadershipfederation.com/2ndinnovationandstartupsummitandawardsmumbai' WHERE slug = 'legacy-issa-2';
UPDATE events SET external_url = 'https://theleadershipfederation.com/innovationandstartupsummitandawards'          WHERE slug = 'legacy-issa-1';

-- Sanity check: every legacy row should now have an external_url
-- SELECT slug, title, external_url FROM events WHERE slug LIKE 'legacy-%' ORDER BY start_date DESC;
