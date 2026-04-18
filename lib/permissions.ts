/**
 * ─── ROLE-BASED PERMISSIONS ─────────────────────────────────────────────
 *
 * Centralized permission map for the admin console.
 * Each role has a list of resources/actions it can access.
 * The wildcard '*' grants unrestricted access.
 *
 * Also includes profile-based (JSONB) permission checking for
 * the Access Profiles system.
 */

import type { ProfilePermissions } from "@/app/actions/profileActions"

export type TeamRole = "super_admin" | "admin" | "manager" | "check_in_staff" | "viewer"

export const ROLE_LABELS: Record<TeamRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  check_in_staff: "Check-In Staff",
  viewer: "Viewer",
}

export const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  super_admin: "Full access, can manage team members",
  admin: "Full access except team management",
  manager: "Can manage events, speakers, sessions, sponsors. Cannot delete.",
  check_in_staff: "Can only access the check-in page",
  viewer: "Read-only access to dashboard and data",
}

export const ROLE_PERMISSIONS: Record<TeamRole, string[]> = {
  super_admin: ["*"],
  admin: [
    "events",
    "speakers",
    "sessions",
    "tickets",
    "sponsors",
    "attendees",
    "check-in",
    "promo-codes",
    "analytics",
    "certificates",
    "invoices",
  ],
  manager: [
    "events.read",
    "events.write",
    "speakers",
    "sessions",
    "tickets",
    "sponsors",
    "attendees.read",
  ],
  check_in_staff: ["check-in"],
  viewer: [
    "events.read",
    "speakers.read",
    "sessions.read",
    "tickets.read",
    "attendees.read",
    "analytics.read",
  ],
}

/**
 * Check whether a role can access a given resource.
 *
 * Matching rules:
 *  1. Wildcard '*' matches everything.
 *  2. Exact match: "events" matches "events".
 *  3. Prefix match: "events" permission grants "events.read", "events.write", etc.
 *  4. Sub-action match: "events.read" permission matches resource "events".
 */
export function canAccess(role: string, resource: string): boolean {
  const perms = ROLE_PERMISSIONS[role as TeamRole]
  if (!perms) return false

  // Wildcard grants everything
  if (perms.includes("*")) return true

  // Exact match
  if (perms.includes(resource)) return true

  // The permission "events" should also grant "events.read", "events.write"
  const resourceBase = resource.split(".")[0]
  if (perms.includes(resourceBase)) return true

  // The permission "events.read" should grant access to "events" (the page)
  for (const perm of perms) {
    const permBase = perm.split(".")[0]
    if (permBase === resource) return true
  }

  return false
}

/**
 * Navigation items visible to a given role.
 * Maps sidebar href segments to resource names.
 */
export const NAV_RESOURCE_MAP: Record<string, string> = {
  "/admin": "dashboard",
  "/admin/events": "events",
  "/admin/builder": "events",
  "/admin/tickets": "tickets",
  "/admin/attendees": "attendees",
  "/admin/waitlist": "attendees",
  "/admin/approvals": "attendees",
  "/admin/sessions": "sessions",
  "/admin/promo-codes": "promo-codes",
  "/admin/check-in": "check-in",
  "/admin/live": "check-in",
  "/admin/leads": "attendees",
  "/admin/sponsor-leads": "sponsors",
  "/admin/campaigns": "attendees",
  "/admin/email-templates": "attendees",
  "/admin/feedback": "attendees",
  "/admin/payments": "invoices",
  "/admin/certificates": "certificates",
  "/admin/invoices": "invoices",
  "/admin/analytics": "analytics",
  "/admin/polls": "check-in",
  "/admin/qa": "check-in",
  "/admin/automations": "attendees",
  "/admin/agenda": "sessions",
  "/admin/integrations": "settings",
  "/admin/team": "team",
  "/admin/settings": "settings",
  "/admin/reports": "analytics",
  "/admin/memberships": "attendees",
  "/admin/registrations": "attendees",
  "/admin/contact-inquiries": "attendees",
  "/admin/newsletter": "attendees",
  "/admin/advisory-board": "speakers",
  "/admin/testimonials": "attendees",
  "/admin/badges": "attendees",
  "/admin/partners": "sponsors",
  "/admin/platforms": "sponsors",
  "/admin/about": "sponsors",
  "/admin/contact": "sponsors",
  "/admin/media": "sponsors",
  "/admin/inner-circle": "sponsors",
  "/admin/faqs": "attendees",
}

/**
 * Check if a nav item should be visible for a role.
 * Dashboard is always visible. Team is super_admin only.
 *
 * If profilePermissions are provided, uses profile-based checking
 * in addition to the role-based fallback.
 */
export function canAccessNavItem(
  role: string,
  href: string,
  profilePermissions?: ProfilePermissions | null
): boolean {
  // Dashboard visible to everyone
  if (href === "/admin") return true
  // Access-denied landing must be reachable regardless of permission state —
  // otherwise the layout's "redirect on forbidden" loops into itself.
  if (href === "/admin/denied") return true

  // Super admins ALWAYS see everything — their profile (if any) doesn't gate.
  if (role === "super_admin") return true

  // If profile permissions are available, use them
  if (profilePermissions) {
    const resource = NAV_RESOURCE_MAP[href]
    if (!resource) return true // unknown routes default to visible

    // Map nav resources to profile permission modules
    const navToModule: Record<string, string> = {
      dashboard: "events",
      events: "events",
      tickets: "tickets",
      attendees: "attendees",
      speakers: "speakers",
      sponsors: "sponsors",
      sessions: "sessions",
      "promo-codes": "promo_codes",
      "check-in": "check_in",
      certificates: "certificates",
      invoices: "invoices",
      analytics: "analytics",
      team: "team",
      settings: "settings",
    }

    const module = navToModule[resource]
    if (module) {
      // For nav visibility, check the "view" action (or "perform" for check_in, "manage" for team)
      const viewAction = module === "check_in" ? "perform" : module === "team" ? "view" : "view"
      return canAccessWithProfile(profilePermissions, module, viewAction)
    }
  }

  // Fallback to role-based checking
  // Team management is super_admin only
  if (href === "/admin/team") return role === "super_admin"

  // Settings visible to admin+
  if (href === "/admin/settings") return role === "super_admin" || role === "admin"

  // Finance section (payments, invoices, certificates): admin and super_admin only
  if (href === "/admin/payments" || href === "/admin/invoices" || href === "/admin/certificates") {
    return role === "super_admin" || role === "admin"
  }

  const resource = NAV_RESOURCE_MAP[href]
  if (!resource) return true // unknown routes default to visible

  return canAccess(role, resource)
}

/* ── Profile-based (JSONB) permission checking ────────────────────────── */

/**
 * Check whether a profile's JSONB permissions grant access to a
 * specific module + action combination.
 *
 * @param permissions - The ProfilePermissions object from a profile's JSONB
 * @param module - The module key (e.g. "events", "attendees", "check_in")
 * @param action - The action key (e.g. "view", "create", "edit", "delete", "perform")
 * @returns true if access is granted, false otherwise
 */
export function canAccessWithProfile(
  permissions: ProfilePermissions | null | undefined,
  module: string,
  action: string
): boolean {
  if (!permissions) return false

  const modulePerms = permissions[module as keyof ProfilePermissions]
  if (!modulePerms) return false

  const actionValue = (modulePerms as Record<string, boolean>)[action]
  return actionValue === true
}
