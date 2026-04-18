/**
 * ─── ADMIN WORKSPACES ───────────────────────────────────────────────────
 *
 * Single source of truth for the top-level structure of the admin.
 *
 * Post-login the user lands on a workspace picker — four distinct
 * products in one app:
 *
 *   Backstage   event operations (events, sessions, tickets, check-in, …)
 *   CRM         people & relationships (leads, memberships, partners, …)
 *   Studio      content & communications (email, campaigns, site pages)
 *   Finance     payments, invoices, reports
 *
 * Plus a persistent `FOUNDATION` rail (team, settings, integrations,
 * audit log, analytics) pinned to the sidebar bottom for super_admin
 * and anyone with the relevant gates.
 *
 * Everything is permission-driven from ProfilePermissions; nothing is
 * hardcoded to a user or email. Super admins bypass all gates.
 *
 * Keep this module pure (no async exports, no "use server") so both
 * server and client components can import it.
 */

import type { ProfilePermissions } from "@/app/actions/profileActions"
import { canAccessWithProfile } from "@/lib/permissions"

/* ── Types ──────────────────────────────────────────────────────────── */

export type WorkspaceSlug = "backstage" | "crm" | "studio" | "finance"

/** Kept for the legacy `AdminDomain` alias used by the denied page. */
export type DomainSlug = WorkspaceSlug | "foundation"

export type IconName =
  | "calendar"
  | "users"
  | "megaphone"
  | "wallet"
  | "shield"
  | "chart"

export interface WorkspaceSection {
  label: string
  href: string
  icon?: IconName
  /** Permission module + action required. Inherits workspace gate if omitted. */
  permission?: { module: keyof ProfilePermissions; action: string }
}

export interface WorkspaceGroup {
  /** Sub-group inside a workspace's sidebar (e.g. "Run the event"). */
  title: string
  items: WorkspaceSection[]
}

export interface AdminWorkspace {
  slug: WorkspaceSlug
  name: string
  tagline: string
  description: string
  /** Hex used for accent stripe + icon chip. */
  accent: string
  /** Default landing route when a user enters the workspace. */
  href: string
  icon: IconName
  /** Primary permission gate for seeing the workspace at all. */
  gate: { module: keyof ProfilePermissions; action: string }
  /** Grouped sidebar nav inside the workspace. */
  groups: WorkspaceGroup[]
}

/* Backward-compat aliases — the denied page + a few call sites still
 * refer to AdminDomain/DomainSection. New code should use AdminWorkspace. */
export type AdminDomain = AdminWorkspace
export type DomainSection = WorkspaceSection

/* ── The four workspaces ────────────────────────────────────────────── */

export const ADMIN_WORKSPACES: AdminWorkspace[] = [
  {
    slug: "backstage",
    name: "Backstage",
    tagline: "Run events end-to-end",
    description:
      "Every tool for running a Leadership Federation event — build the page, sell tickets, manage attendees, check them in, and run the room live.",
    accent: "#2563eb",
    href: "/admin/events",
    icon: "calendar",
    gate: { module: "events", action: "view" },
    groups: [
      {
        title: "Build",
        items: [
          { label: "All events",    href: "/admin/events" },
          { label: "Page Builder",  href: "/admin/builder", permission: { module: "events", action: "edit" } },
          { label: "Sessions",      href: "/admin/sessions" },
          { label: "Agenda",        href: "/admin/agenda" },
          { label: "Speakers",      href: "/admin/advisory-board", permission: { module: "speakers", action: "view" } },
          { label: "Tickets",       href: "/admin/tickets",        permission: { module: "tickets",  action: "view" } },
          { label: "Promo codes",   href: "/admin/promo-codes",    permission: { module: "promo_codes", action: "view" } },
        ],
      },
      {
        title: "Attendees",
        items: [
          { label: "Attendees",     href: "/admin/attendees",     permission: { module: "attendees", action: "view" } },
          { label: "Registrations", href: "/admin/registrations", permission: { module: "attendees", action: "view" } },
          { label: "Waitlist",      href: "/admin/waitlist",      permission: { module: "attendees", action: "view" } },
          { label: "Approvals",     href: "/admin/approvals",     permission: { module: "attendees", action: "view" } },
        ],
      },
      {
        title: "Run the room",
        items: [
          { label: "Live dashboard", href: "/admin/live",      permission: { module: "check_in", action: "perform" } },
          { label: "Check-in",       href: "/admin/check-in",  permission: { module: "check_in", action: "perform" } },
          { label: "Badges",         href: "/admin/badges",    permission: { module: "attendees", action: "view" } },
          { label: "Polls",          href: "/admin/polls",     permission: { module: "check_in", action: "perform" } },
          { label: "Q&A",            href: "/admin/qa",        permission: { module: "check_in", action: "perform" } },
        ],
      },
      {
        title: "After",
        items: [
          { label: "Certificates", href: "/admin/certificates", permission: { module: "certificates", action: "view" } },
          { label: "Feedback",     href: "/admin/feedback",     permission: { module: "attendees", action: "view" } },
        ],
      },
    ],
  },
  {
    slug: "crm",
    name: "CRM",
    tagline: "Relationships & pipeline",
    description:
      "Every person and company the federation talks to — site leads, sponsor prospects, members, partners, and delegate testimonials — in one place.",
    accent: "#c9a84c",
    href: "/admin/leads",
    icon: "users",
    gate: { module: "attendees", action: "view" },
    groups: [
      {
        title: "Pipeline",
        items: [
          { label: "Leads",             href: "/admin/leads" },
          { label: "Sponsor leads",     href: "/admin/sponsor-leads", permission: { module: "sponsors", action: "view" } },
          { label: "Contact inquiries", href: "/admin/contact-inquiries" },
        ],
      },
      {
        title: "Community",
        items: [
          { label: "Memberships",  href: "/admin/memberships" },
          { label: "Inner Circle", href: "/admin/inner-circle" },
          { label: "Newsletter",   href: "/admin/newsletter" },
        ],
      },
      {
        title: "Partners",
        items: [
          { label: "Partners",     href: "/admin/partners",     permission: { module: "sponsors", action: "view" } },
          { label: "Platforms",    href: "/admin/platforms",    permission: { module: "sponsors", action: "view" } },
          { label: "Testimonials", href: "/admin/testimonials" },
        ],
      },
    ],
  },
  {
    slug: "studio",
    name: "Studio",
    tagline: "Email, campaigns & site pages",
    description:
      "Outbound comms and the public marketing site — campaigns, email templates, automations, newsletter, and the editable site pages (About, Media, FAQs).",
    accent: "#7c3aed",
    href: "/admin/campaigns",
    icon: "megaphone",
    gate: { module: "attendees", action: "view" },
    groups: [
      {
        title: "Comms",
        items: [
          { label: "Campaigns",       href: "/admin/campaigns" },
          { label: "Email templates", href: "/admin/email-templates" },
          { label: "Automations",     href: "/admin/automations" },
        ],
      },
      {
        title: "Site pages",
        items: [
          { label: "About",   href: "/admin/about" },
          { label: "Contact", href: "/admin/contact" },
          { label: "Media",   href: "/admin/media" },
          { label: "FAQs",    href: "/admin/faqs" },
        ],
      },
    ],
  },
  {
    slug: "finance",
    name: "Finance",
    tagline: "Payments, invoices & reports",
    description:
      "Money in, money reported. Razorpay payments, invoice generation, and revenue reports. Gated strictly on finance permissions.",
    accent: "#16a34a",
    href: "/admin/payments",
    icon: "wallet",
    gate: { module: "payments", action: "view" },
    groups: [
      {
        title: "Transactions",
        items: [
          { label: "Payments", href: "/admin/payments", permission: { module: "payments", action: "view" } },
          { label: "Invoices", href: "/admin/invoices", permission: { module: "invoices", action: "view" } },
        ],
      },
      {
        title: "Reporting",
        items: [
          { label: "Reports", href: "/admin/reports", permission: { module: "analytics", action: "view" } },
        ],
      },
    ],
  },
]

/* ── Foundation rail (always-on admin utilities) ────────────────────── */

export interface FoundationItem {
  label: string
  href: string
  gate: { module: keyof ProfilePermissions; action: string } | "super_admin_only"
}

export const FOUNDATION_ITEMS: FoundationItem[] = [
  { label: "Analytics",    href: "/admin/analytics",    gate: { module: "analytics", action: "view" } },
  { label: "Team",         href: "/admin/team",         gate: "super_admin_only" },
  { label: "Settings",     href: "/admin/settings",     gate: { module: "settings", action: "view" } },
  { label: "Integrations", href: "/admin/integrations", gate: { module: "settings", action: "view" } },
  { label: "Audit log",    href: "/admin/audit-log",    gate: "super_admin_only" },
]

/* ── Permission helpers ─────────────────────────────────────────────── */

export function canAccessWorkspace(
  w: AdminWorkspace,
  role: string,
  perms: ProfilePermissions | null | undefined,
): boolean {
  if (role === "super_admin") return true
  if (!perms) return false
  return canAccessWithProfile(perms, w.gate.module, w.gate.action)
}

export function canAccessSection(
  s: WorkspaceSection,
  parent: AdminWorkspace,
  role: string,
  perms: ProfilePermissions | null | undefined,
): boolean {
  if (role === "super_admin") return true
  if (!perms) return false
  const gate = s.permission ?? parent.gate
  return canAccessWithProfile(perms, gate.module, gate.action)
}

export function canAccessFoundation(
  f: FoundationItem,
  role: string,
  perms: ProfilePermissions | null | undefined,
): boolean {
  if (role === "super_admin") return true
  if (f.gate === "super_admin_only") return false
  if (!perms) return false
  return canAccessWithProfile(perms, f.gate.module, f.gate.action)
}

export function accessibleWorkspaces(
  role: string,
  perms: ProfilePermissions | null | undefined,
): AdminWorkspace[] {
  return ADMIN_WORKSPACES.filter((w) => canAccessWorkspace(w, role, perms))
}

export function accessibleFoundation(
  role: string,
  perms: ProfilePermissions | null | undefined,
): FoundationItem[] {
  return FOUNDATION_ITEMS.filter((f) => canAccessFoundation(f, role, perms))
}

/**
 * Resolve an arbitrary admin path to its owning workspace.
 * Returns null for foundation paths and the home page itself.
 */
export function workspaceForPath(pathname: string): AdminWorkspace | null {
  const normalized = pathname.replace(/\/+$/, "") || "/admin"
  if (normalized === "/admin" || normalized.startsWith("/admin/denied")) return null
  if (FOUNDATION_ITEMS.some((f) => normalized === f.href || normalized.startsWith(f.href + "/"))) {
    return null
  }
  for (const w of ADMIN_WORKSPACES) {
    if (normalized === w.href || normalized.startsWith(w.href + "/")) return w
    for (const g of w.groups) {
      if (g.items.some((s) => normalized === s.href || normalized.startsWith(s.href + "/"))) {
        return w
      }
    }
  }
  return null
}

/* ── Legacy aliases ─────────────────────────────────────────────────── */
/* Kept so the denied page (and anything else still importing the old
 * API) keeps compiling. Prefer the new names in new code. */

export const ADMIN_DOMAINS = ADMIN_WORKSPACES

/** @deprecated use accessibleWorkspaces */
export const accessibleDomains = accessibleWorkspaces

/** @deprecated use workspaceForPath */
export const domainForPath = workspaceForPath

/** @deprecated use canAccessWorkspace */
export const canAccessDomain = canAccessWorkspace
