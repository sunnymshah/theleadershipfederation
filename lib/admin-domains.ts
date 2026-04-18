/**
 * ─── ADMIN DOMAINS ──────────────────────────────────────────────────────
 *
 * A single source of truth for the top-level grouping of the admin
 * console. Used by:
 *   - the post-login tile grid on /admin (Netflix-style "which workspace
 *     are you opening today" landing),
 *   - the sidebar (future re-org into collapsible domain groups),
 *   - the access-denied page (to suggest what the user CAN access).
 *
 * Permission gating is profile-driven, not hardcoded: each domain
 * declares which `ProfilePermissions` module.action it needs, and the
 * runtime checks against the current user's profile. Super admins
 * bypass all gates.
 *
 * NOTE: keep this module pure (no async exports, no "use server") so it
 * can be imported from both server and client components.
 */

import type { ProfilePermissions } from "@/app/actions/profileActions"
import { canAccessWithProfile } from "@/lib/permissions"

export type DomainSlug =
  | "crm"
  | "events"
  | "people"
  | "marketing"
  | "finance"
  | "content"
  | "team"
  | "integrations"
  | "analytics"

/**
 * A subsection under a domain. Shown in the sidebar when the domain is
 * expanded and as quick links inside the domain's tile detail view.
 */
export interface DomainSection {
  /** Sidebar label */
  label: string
  /** Route. Supports both existing admin paths and future CRM subsections. */
  href: string
  /** Permission module + action required. If omitted, section inherits
   *  the parent domain's gate. */
  permission?: { module: keyof ProfilePermissions; action: string }
}

export interface AdminDomain {
  slug: DomainSlug
  name: string
  /** One-liner shown under the name on the tile */
  tagline: string
  /** Longer description shown on hover / in detail view */
  description: string
  /** Hex accent colour used for the tile gradient + icon chip */
  accent: string
  /** Default landing route when a user clicks the tile */
  href: string
  /** Named icon — matches the iconMap in AdminHomeTiles.tsx */
  icon: IconName
  /** Primary permission gate for seeing the tile at all */
  gate: { module: keyof ProfilePermissions; action: string }
  /** Sub-sections that the sidebar (and future detail view) renders */
  sections: DomainSection[]
}

export type IconName =
  | "crm"
  | "calendar"
  | "users"
  | "megaphone"
  | "wallet"
  | "pages"
  | "shield"
  | "plug"
  | "chart"

/**
 * The nine domains. Order here = order in the tile grid and sidebar.
 *
 * The CRM domain is new — its routes (`/admin/crm/*`) are reserved here
 * but will be implemented in a follow-up. Until then, clicking the tile
 * lands on `/admin/leads` (closest existing analogue) via the href below.
 */
export const ADMIN_DOMAINS: AdminDomain[] = [
  {
    slug: "crm",
    name: "CRM",
    tagline: "Contacts, leads, deals, pipeline",
    description:
      "Unified view of every person and company the federation talks to. Leads from the site, attendees from events, sponsor prospects, and deal pipeline.",
    accent: "#c9a84c",
    href: "/admin/leads",
    icon: "crm",
    // CRM rolls up several modules — `attendees.view` is the tightest
    // approximation of "can see people data" with the current schema.
    gate: { module: "attendees", action: "view" },
    sections: [
      { label: "Leads",             href: "/admin/leads" },
      { label: "Contact inquiries", href: "/admin/contact-inquiries" },
      { label: "Newsletter",        href: "/admin/newsletter" },
      { label: "Memberships",       href: "/admin/memberships" },
      { label: "Inner Circle",      href: "/admin/inner-circle" },
    ],
  },
  {
    slug: "events",
    name: "Events",
    tagline: "End-to-end event lifecycle",
    description:
      "Build and run events: agenda, sessions, speakers, tickets, promo codes, live engagement, check-in, and post-event artefacts.",
    accent: "#2563eb",
    href: "/admin/events",
    icon: "calendar",
    gate: { module: "events", action: "view" },
    sections: [
      { label: "All events",     href: "/admin/events" },
      { label: "Sessions",       href: "/admin/sessions" },
      { label: "Agenda",         href: "/admin/agenda" },
      { label: "Speakers",       href: "/admin/advisory-board", permission: { module: "speakers", action: "view" } },
      { label: "Tickets",        href: "/admin/tickets",        permission: { module: "tickets",  action: "view" } },
      { label: "Promo codes",    href: "/admin/promo-codes",    permission: { module: "promo_codes", action: "view" } },
      { label: "Waitlist",       href: "/admin/waitlist" },
      { label: "Live",           href: "/admin/live",           permission: { module: "check_in", action: "perform" } },
      { label: "Polls",          href: "/admin/polls",          permission: { module: "check_in", action: "perform" } },
      { label: "Q&A",            href: "/admin/qa",             permission: { module: "check_in", action: "perform" } },
      { label: "Check-in",       href: "/admin/check-in",       permission: { module: "check_in", action: "perform" } },
      { label: "Badges",         href: "/admin/badges" },
      { label: "Certificates",   href: "/admin/certificates",   permission: { module: "certificates", action: "view" } },
    ],
  },
  {
    slug: "people",
    name: "People",
    tagline: "Attendees, registrations, directory",
    description:
      "Every human record in the federation: attendees, registrations, approvals queue, advisory board, and the delegate directory.",
    accent: "#0d9488",
    href: "/admin/attendees",
    icon: "users",
    gate: { module: "attendees", action: "view" },
    sections: [
      { label: "Attendees",       href: "/admin/attendees" },
      { label: "Registrations",   href: "/admin/registrations" },
      { label: "Approvals",       href: "/admin/approvals" },
      { label: "Advisory board",  href: "/admin/advisory-board", permission: { module: "speakers", action: "view" } },
    ],
  },
  {
    slug: "marketing",
    name: "Marketing",
    tagline: "Campaigns, email, feedback",
    description:
      "Outbound: campaigns, email templates, testimonials, media, and post-event feedback loops.",
    accent: "#db2777",
    href: "/admin/campaigns",
    icon: "megaphone",
    gate: { module: "attendees", action: "view" },
    sections: [
      { label: "Campaigns",       href: "/admin/campaigns" },
      { label: "Email templates", href: "/admin/email-templates" },
      { label: "Feedback",        href: "/admin/feedback" },
      { label: "Testimonials",    href: "/admin/testimonials" },
      { label: "Media",           href: "/admin/media" },
    ],
  },
  {
    slug: "finance",
    name: "Finance",
    tagline: "Payments, invoices, revenue",
    description:
      "Razorpay payments, invoice generation, and revenue reporting. Sensitive — gated strictly on finance permissions.",
    accent: "#16a34a",
    href: "/admin/payments",
    icon: "wallet",
    gate: { module: "payments", action: "view" },
    sections: [
      { label: "Payments", href: "/admin/payments",  permission: { module: "payments", action: "view" } },
      { label: "Invoices", href: "/admin/invoices",  permission: { module: "invoices", action: "view" } },
      { label: "Reports",  href: "/admin/reports",   permission: { module: "analytics", action: "view" } },
    ],
  },
  {
    slug: "content",
    name: "Content",
    tagline: "Public pages + partners",
    description:
      "Edit the public marketing site: About, Platforms, Partners, Sponsors, FAQs, and the contact endpoint.",
    accent: "#7c3aed",
    href: "/admin/about",
    icon: "pages",
    gate: { module: "sponsors", action: "view" },
    sections: [
      { label: "About",    href: "/admin/about" },
      { label: "Platforms", href: "/admin/platforms" },
      { label: "Partners",  href: "/admin/partners",  permission: { module: "sponsors", action: "view" } },
      { label: "FAQs",      href: "/admin/faqs" },
      { label: "Contact",   href: "/admin/contact" },
    ],
  },
  {
    slug: "team",
    name: "Team & Access",
    tagline: "Members, roles, approvals, audit",
    description:
      "Manage team members, access profiles, approvals queue, automations, and the security audit log.",
    accent: "#ea580c",
    href: "/admin/team",
    icon: "shield",
    gate: { module: "team", action: "view" },
    sections: [
      { label: "Team members",   href: "/admin/team" },
      { label: "Approvals",      href: "/admin/approvals" },
      { label: "Automations",    href: "/admin/automations" },
      { label: "Audit log",      href: "/admin/audit-log" },
      { label: "Settings",       href: "/admin/settings",     permission: { module: "settings", action: "view" } },
    ],
  },
  {
    slug: "integrations",
    name: "Integrations",
    tagline: "Zoho, Razorpay, Resend, webhooks",
    description:
      "External system connectors. Zoho CRM sync, Razorpay, Resend, and webhook endpoints.",
    accent: "#0891b2",
    href: "/admin/integrations",
    icon: "plug",
    gate: { module: "settings", action: "view" },
    sections: [
      { label: "Integrations", href: "/admin/integrations" },
    ],
  },
  {
    slug: "analytics",
    name: "Analytics",
    tagline: "Dashboards + cross-domain reports",
    description:
      "Event performance, revenue trends, registration funnel, and custom reports.",
    accent: "#4f46e5",
    href: "/admin/analytics",
    icon: "chart",
    gate: { module: "analytics", action: "view" },
    sections: [
      { label: "Analytics", href: "/admin/analytics" },
      { label: "Reports",   href: "/admin/reports" },
    ],
  },
]

/**
 * Can the caller access a domain? Super admins bypass all gates; others
 * are checked against their profile's permissions JSON.
 */
export function canAccessDomain(
  domain: AdminDomain,
  role: string,
  profilePermissions: ProfilePermissions | null | undefined,
): boolean {
  if (role === "super_admin") return true
  // Admin-without-profile used to escalate implicitly; that was removed
  // server-side. Here we keep it strict: no profile = no tile.
  if (!profilePermissions) return false
  return canAccessWithProfile(profilePermissions, domain.gate.module, domain.gate.action)
}

/**
 * Filter domains to only those the caller can see. Preserves source
 * order. Used by AdminHomeTiles to render the tile grid and by the
 * sidebar for the collapsible domain list.
 */
export function accessibleDomains(
  role: string,
  profilePermissions: ProfilePermissions | null | undefined,
): AdminDomain[] {
  return ADMIN_DOMAINS.filter((d) => canAccessDomain(d, role, profilePermissions))
}

/**
 * Resolve an arbitrary admin path to its owning domain. Used by the
 * denied page to show "you tried to open X which lives under Y —
 * here's what you CAN access instead".
 */
export function domainForPath(pathname: string): AdminDomain | null {
  const normalized = pathname.replace(/\/+$/, "") || "/admin"
  for (const d of ADMIN_DOMAINS) {
    if (normalized === d.href) return d
    if (d.sections.some((s) => normalized === s.href || normalized.startsWith(s.href + "/"))) {
      return d
    }
  }
  return null
}
