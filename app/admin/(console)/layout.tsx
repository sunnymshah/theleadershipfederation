/* ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN CONSOLE LAYOUT
 *
 *  Auth-gated: redirects to /admin/login if no session.
 *  Uses AdminLayoutShell for responsive sidebar + header.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { AdminLayoutShell } from "@/components/admin/AdminLayoutShell"
import { canAccessNavItem } from "@/lib/permissions"
import type { ProfilePermissions } from "@/app/actions/profileActions"

/**
 * Parse a comma-separated list of emails from an env var. Returns empty
 * array when unset. Case-insensitive.
 */
function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  /* ── Layer 1: authenticated? ────────────────────────────────────── */
  const cookieStore = await cookies()
  const supabase    = createClient(cookieStore)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/admin/login")
  }

  /* ── Layer 2: authorized? ───────────────────────────────────────── *
   * Fetch the caller's team_members row via service-role admin client
   * (dodges recursive RLS on team_members). If there's no row we do
   * NOT implicitly grant super_admin — that was a privilege-escalation
   * hole: anyone who signed up via Supabase Auth could walk into the
   * admin console as super_admin.
   *
   * Allowed paths:
   *   (a) user has a team_members row → use its role/profile
   *   (b) table is empty AND user's email matches ADMIN_BOOTSTRAP_EMAIL
   *       → one-time first-time-setup bootstrap (auto-provisions row)
   *   (c) otherwise → force sign-out and send back to /admin/login
   */
  const admin = createAdminClient()
  const { data: teamMember } = await admin
    .from("team_members")
    .select("role, profile_id")
    .eq("user_id", user.id)
    .maybeSingle()

  let userRole: string
  if (teamMember?.role) {
    userRole = teamMember.role
  } else {
    // No row for this user — check bootstrap case
    const bootstrapAllowlist = parseAllowlist(process.env.ADMIN_BOOTSTRAP_EMAIL)
    const userEmail = (user.email ?? "").toLowerCase()
    const { count: totalMembers } = await admin
      .from("team_members")
      .select("*", { count: "exact", head: true })

    if ((totalMembers ?? 0) === 0 && bootstrapAllowlist.includes(userEmail)) {
      // First-time setup: auto-provision a super_admin row so subsequent
      // visits don't keep hitting the bootstrap branch. This can only
      // fire exactly once per fresh install.
      await admin.from("team_members").insert({
        user_id: user.id,
        email: user.email,
        name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Admin",
        role: "super_admin",
      })
      userRole = "super_admin"
    } else {
      // Not in team_members, not a bootstrap candidate → force sign-out
      // so the session cookie is cleared (prevents repeated hitting of
      // this branch with a stale token) and send to login with an
      // access-denied message.
      await supabase.auth.signOut()
      redirect("/admin/login?error=access-denied")
    }
  }

  // Super admins always see the full console — their profile (if any) does
  // NOT restrict them. For every other role, if they have a profile_id we
  // fetch the permissions JSON so the sidebar can gate nav items.
  let profilePermissions: ProfilePermissions | null = null
  if (userRole !== "super_admin" && teamMember?.profile_id) {
    const { data: profile } = await admin
      .from("access_profiles")
      .select("permissions")
      .eq("id", teamMember.profile_id)
      .eq("is_active", true)
      .maybeSingle()
    profilePermissions = (profile?.permissions as ProfilePermissions) ?? null
  }

  /* ── Page-level gate ────────────────────────────────────────────── *
   * Defense-in-depth: the sidebar already hides disallowed links, but
   * a user could type /admin/invoices directly. Read the pathname from
   * the header the proxy injects and redirect to /admin (dashboard, the
   * universal fallback) if the profile doesn't permit this route.      */
  const hdrs = await headers()
  const pathname = hdrs.get("x-pathname") ?? "/admin"
  // Normalize: take only the first two segments so "/admin/events/123" still
  // gates via "/admin/events".
  const segments = pathname.split("/").filter(Boolean)
  const gatePath =
    segments.length >= 2 ? `/${segments[0]}/${segments[1]}` : `/${segments[0] ?? ""}`
  if (!canAccessNavItem(userRole, gatePath, profilePermissions)) {
    // Redirect to the access-denied landing with the attempted path so
    // the page can tell the user what they tried to open and suggest
    // what they CAN access. Previously this silently bounced to /admin
    // which was confusing — users didn't understand why their click
    // "did nothing".
    redirect(`/admin/denied?from=${encodeURIComponent(pathname)}`)
  }

  return (
    <AdminLayoutShell
      userEmail={user.email ?? "admin"}
      userRole={userRole}
      profilePermissions={profilePermissions}
    >
      {children}
    </AdminLayoutShell>
  )
}
