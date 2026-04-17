# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

The Leadership Federation — a premium events platform. Public marketing site + a ~40-section admin console on a single Next.js 16 app, deployed to Vercel.

- Tech: Next.js 16.2.4 (App Router, Turbopack) · React 19.2.4 · Tailwind v4 (CSS-based via `@theme`) · Supabase (DB + Auth + Storage) · Razorpay (payments) · Resend (email) · jsPDF (invoices + certificates) · qrcode / html5-qrcode (badges + check-in)
- Canonical URL (pre-domain-migration): `https://theleadershipfederation.vercel.app`
- Post-migration target domain: `www.leadershipfederation.com`
- GitHub: `sunnymshah/theleadershipfederation` on branch `main`

## Commands

```bash
npm run dev      # turbopack dev server on :3000
npm run build    # production build
npm run start    # run the production build locally
npm run lint     # ESLint
```

There is no test suite.

## Auto-deploy

A `Stop` hook auto-commits and pushes to `origin/main` after every Claude Code turn that changes files. Vercel picks up the push and deploys prod.

- Hook config: `.claude/settings.local.json` (gitignored)
- Script: `.claude/scripts/auto-deploy.sh` (tracked)
- Log: `.claude/auto-deploy.log` (gitignored)
- Commit prefix: `auto: <first 3 changed paths>`

If you want a carefully-worded commit, make it manually before the turn ends.

## High-level architecture

### Route groups (`app/`)

- `app/(site)/` — public marketing site
  - Pages: `/`, `/about`, `/platforms`, `/memberships`, `/events`, `/events/[slug]`, `/archive` (past events), `/contact`, `/partners`, `/advisory-board`, `/media`, `/inner-circle`, `/register`, `/my-tickets`, `/terms`, `/privacy-policy`, `/refund-policy`, `/sponsor-portal/*`, `/feedback/[eventSlug]`
- `app/admin/(auth)/login/` — admin sign-in (Supabase auth via a server action, not direct client call)
- `app/admin/(console)/` — auth-gated admin workspace (~40 sections: events, tickets, speakers, attendees, registrations, check-in, live, sessions, agenda, badges, certificates, invoices, payments, promo-codes, waitlist, leads, campaigns, email-templates, polls, qa, analytics, reports, approvals, automations, integrations, memberships, inner-circle, contact, contact-inquiries, feedback, testimonials, media, partners, platforms, newsletter, advisory-board, team, faqs, settings, audit-log)
- `app/api/` — API routes (admin, attendee, badges, certificates, custom-fields, invoices, payments, promo-codes, qr, reports, track/click, track/open, webhooks/razorpay)
- `app/actions/` — 47 server-action modules (contactActions, eventActions, speakerActions, ticketActions, profileActions, authActions, eventSectionActions, uploadActions, …)

### Shared infra (`lib/`, `utils/`, `components/`)

- `utils/supabase/server.ts` — cookie-backed SSR client (auth-scoped)
- `utils/supabase/client.ts` — browser client (anon key; always RLS-bound)
- `utils/supabase/admin.ts` — **service-role** admin client; server-only, bypasses RLS. Required for several admin operations; fails loudly if `SUPABASE_SERVICE_ROLE_KEY` is missing.
- `utils/supabase/middleware.ts` — called from `proxy.ts`; refreshes the auth token, injects `x-pathname` + per-request CSP `x-nonce`, and enforces `ADMIN_IP_ALLOWLIST` at the edge for `/admin/*`.
- `lib/permissions.ts` — `canAccessNavItem(role, href, permissions)` and `canAccessWithProfile(perms, module, action)`. Nav map + role defaults.
- `lib/server-permissions.ts` — `requirePermission(module, action)` (throws), `canCurrentUser(module, action)` (boolean), `getCurrentUserContext()`. Server-only. Strict model: only `super_admin` gets unconditional access; everyone else needs an explicit profile.
- `lib/security.ts` — `isValidUUID`, `isValidEmail`, `writeAuditEvent`, `recordLoginAttempt`, `isAccountLockedOut`, `rateLimitDb`, `isIpBlocked`, `adminIpAllowlist`. Server-only.
- `lib/rate-limit.ts` — in-memory sliding-window limiter (per serverless instance).
- `lib/event-sections.ts` — `SECTION_KINDS` + `EventSection` types (plain module; non-async exports can't live in `"use server"` files).
- `lib/get-event.ts` — 3-tier tolerant event lookup (anon exact → admin exact → admin ILIKE). Logs every path.
- `components/admin/AdminLayoutShell.tsx` — client shell that wraps `AdminSidebar`, injects the `AdminPermissionsProvider`.
- `components/admin/AdminPermissionsContext.tsx` — `useAdminPermissions()` hook + `<PermissionGate>` for UI gating.
- `components/admin/ImageUploadCrop.tsx` — drag-pan + zoom + rule-of-thirds crop, uploads base64 to Supabase Storage via `uploadImageDataUrl`.
- `components/site/EventSections.tsx` — renderer for the event page builder (`hero`, `rich_text`, `stats_row`, `speakers_grid`, `agenda`, `tickets_cta`, `sponsors_grid`, `video`, `gallery`, `cta_button`, `faqs`).

### Permission system (critical)

Four layers, every one enforced:

1. **Authenticated** — `(console)/layout.tsx` checks Supabase session; unauth → `/admin/login`.
2. **Authorized** — `team_members` row must exist for the user. One-shot bootstrap via `ADMIN_BOOTSTRAP_EMAIL` env when the table is empty. Unauthorized users get `signOut()` + redirect with `?error=access-denied`.
3. **Path** — `(console)/layout.tsx` reads `x-pathname` from the proxy and calls `canAccessNavItem(role, path, profilePermissions)`; forbidden → redirect to `/admin`.
4. **Action** — every sensitive server action calls `requirePermission(module, action)`. 37 mutation endpoints across event/attendee/ticket/session/speaker/sponsor/promo/certificate/invoice actions are guarded.

No `admin-without-profile = full access` escape hatch. The only unconditional role is `super_admin`.

### Event page builder (zoho-backstage-style)

- Schema: `event_sections` table with JSONB `data` (generic block types).
- Admin UI: `/admin/events/[id]/builder` — dark-chrome shell with left icon rail, top bar (Preview/View Website/Publish), center canvas that renders the REAL `EventSectionsRenderer` inline, right-side slide-in edit drawer.
- Renderer: `components/site/EventSections.tsx`. `/events/[slug]` dispatches to it when any `event_sections` rows exist; else falls back to the legacy per-event layout.
- Block kinds: `hero`, `rich_text`, `stats_row`, `speakers_grid`, `agenda`, `tickets_cta`, `sponsors_grid`, `video`, `gallery`, `cta_button`, `faqs`. `speakers_grid`/`agenda`/`sponsors_grid` auto-populate from the event's own tables.

### Security infrastructure

- **Audit log** — append-only `security_events` table. `writeAuditEvent()` is fire-and-forget; RLS gives `super_admin` SELECT and blocks UPDATE/DELETE for everyone. Viewer at `/admin/audit-log`.
- **Brute-force lockout** — `login_attempts` table + `isAccountLockedOut()` (5 email failures or 10 IP failures in 15 min → lock).
- **Rate limits** — in-memory limiter (`lib/rate-limit.ts`) on contact form / attendee lookup / payment verify. Durable DB-backed version (`rateLimitDb`) available in `lib/security.ts`.
- **IP allow-list / blocklist** — `ADMIN_IP_ALLOWLIST` env (enforced in `utils/supabase/middleware.ts` edge) + `ip_blocklist` table (admin-controlled).
- **CSP** — tight directive list in `next.config.ts` (self + Razorpay + Supabase + YouTube + Google Fonts; `object-src none`; `form-action self`; `frame-ancestors self`). Per-request nonce available via `x-nonce` header for future tightening (removing `'unsafe-inline'`).
- **Payment signatures** — `/api/payments/verify` and `/api/webhooks/razorpay` use `crypto.timingSafeEqual` for HMAC comparison.
- **Input validation** — `isValidUUID` on every dynamic API route (invoices/certificates/badges/reports/custom-fields/attendee/*); `isValidEmail` with length + injection-char rejection on contact + lookup endpoints.
- **Honeypots** — hidden `company_website` field on login + contact forms; bot submissions are silently dropped.
- **robots.txt** — `app/robots.ts` blocks `/admin`, `/api/`, `/sponsor-portal`, `/my-tickets`, `/feedback/*`, `/register`.
- **Security headers** — HSTS 2y preload, X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy (camera/mic/geo/browsing-topics off), COOP same-origin, CORP same-site, Origin-Agent-Cluster ?1, X-Permitted-Cross-Domain-Policies none, X-Powered-By stripped.

## Next.js 16 gotchas (that trip up training data)

- `revalidatePath(path)` on server functions is **immediate** and triggers a synchronous re-render. Wrap it in `try/catch` so a downstream render error doesn't fail the mutation.
- For literal paths, **omit the `"page"` type arg** (`revalidatePath("/admin/settings")` — not `revalidatePath("/admin/settings", "page")`).
- Middleware file is `proxy.ts`, not `middleware.ts`. Matcher already set to `/admin/:path*`.
- `"use server"` files may **only export async functions**. Exporting an object/array/const from one throws `A "use server" file can only export async functions, found object.` — put shared constants in `lib/` (see `lib/event-sections.ts`).
- `cookies()` and `headers()` are async — always `await` them.
- `params` on dynamic pages is now a Promise — `const { slug } = await params`.
- `"use client"` required on any component that imports Framer Motion, `usePathname`, or hooks.
- Always consult `node_modules/next/dist/docs/` before assuming a Next API shape.

## Environment variables

Required in Vercel (Production scope):

```
NEXT_PUBLIC_SUPABASE_URL                          # public
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY      # public; anon-bound; RLS gates access
SUPABASE_SERVICE_ROLE_KEY                         # server-only; bypasses RLS
RESEND_API_KEY                                    # required for email
RESEND_FROM_ADDRESS                               # sender identity (must be verified domain in prod)
RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET             # payments server-side
NEXT_PUBLIC_RAZORPAY_KEY_ID                       # checkout widget
RAZORPAY_WEBHOOK_SECRET                           # webhook signature verification
```

Optional:

```
CONTACT_NOTIFY_EMAIL          # default sunnymshah@gmail.com
ADMIN_BOOTSTRAP_EMAIL         # first-login provisioning; remove after first sign-in
ADMIN_IP_ALLOWLIST            # comma-separated; if set, only these IPs can reach /admin
NEXT_PUBLIC_SITE_URL          # used in email link-backs
NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY  # not yet wired
```

## Database (Supabase)

- Project ref: `lfaoenulcskvhgckylsh`
- Migrations live in `supabase/migrations/`. There is **no Supabase CLI** in this workflow; migrations are applied manually via the Supabase SQL Editor.
- RLS is the primary security boundary. The service-role key is the only path that bypasses it.

### Migrations that must be applied in order

1. `fix-team-members-recursion.sql` — replaces recursive `USING (EXISTS(SELECT FROM team_members ...))` policies with a SECURITY DEFINER helper (`public.is_super_admin()`).
2. `fix-form-submission-rls.sql` — anon INSERT on `contact_inquiries` + `newsletter_subscribers`.
3. `setup-public-images-bucket.sql` — creates the `public_images` storage bucket with 5 MB limit + policies. Required for image uploads.
4. `seed-legacy-past-events.sql` — adds 20 historical events (external-URL links to the old TLF site) + `events.external_url` + `events.series` columns.
5. `add-event-sections.sql` — page builder's data table.
6. `add-security-tables.sql` — `security_events`, `login_attempts`, `rate_limits`, `ip_blocklist`.
7. **RLS lockdown (run last)** — the comprehensive audit that ENABLEs RLS on every public table, drops `USING (true) TO anon` permissive policies, and re-adds narrow policies per table. See the "Lock down everything" SQL in CHAT_LOG context.

If you're seeing 404s on `/events/[slug]`, the `getEvent` helper has a 3-tier fallback (anon exact → admin exact → admin ILIKE). Failed lookups log `[getEvent]` lines to Vercel Function logs with the attempted slug.

## Admin flow specifics

- Admin login goes through the `adminSignIn` server action (NOT `supabase.auth.signInWithPassword` from the client). This is what wires up lockout, audit events, IP blocklist, and honeypot.
- The admin pages **heavily use** the client-side Supabase browser client (`utils/supabase/client.ts`) for reads. RLS is enforced on every table they touch — verify this after any schema change.
- Adding a new mutation server action: wrap the body with `await requirePermission("module", "action")` and `writeAuditEvent({...})` on success.
- Adding a new admin route: add it to `NAV_RESOURCE_MAP` + `navToModule` in `lib/permissions.ts` so the URL gate works.

## Do not

- Remove `"use client"` from components using Framer Motion / usePathname / hooks.
- Store API keys or passwords in code. All secrets go in Vercel env.
- Skip `requirePermission()` on mutation server actions.
- Use `.single()` for possibly-missing rows — it throws. Use `.maybeSingle()`.
- Assume Next 15 behaviour for `revalidatePath`, middleware filenames, or params.
