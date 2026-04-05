/**
 * ─── ROLE-BASED PERMISSIONS ─────────────────────────────────────────────
 *
 * Centralized permission map for the admin console.
 * Each role has a list of resources/actions it can access.
 * The wildcard '*' grants unrestricted access.
 */

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
  "/admin/tickets": "tickets",
  "/admin/attendees": "attendees",
  "/admin/speakers": "speakers",
  "/admin/sponsors": "sponsors",
  "/admin/sessions": "sessions",
  "/admin/promo-codes": "promo-codes",
  "/admin/check-in": "check-in",
  "/admin/certificates": "certificates",
  "/admin/invoices": "invoices",
  "/admin/analytics": "analytics",
  "/admin/team": "team",
  "/admin/settings": "settings",
}

/**
 * Check if a nav item should be visible for a role.
 * Dashboard is always visible. Team is super_admin only.
 */
export function canAccessNavItem(role: string, href: string): boolean {
  // Dashboard visible to everyone
  if (href === "/admin") return true

  // Team management is super_admin only
  if (href === "/admin/team") return role === "super_admin"

  // Settings visible to admin+
  if (href === "/admin/settings") return role === "super_admin" || role === "admin"

  const resource = NAV_RESOURCE_MAP[href]
  if (!resource) return true // unknown routes default to visible

  return canAccess(role, resource)
}
