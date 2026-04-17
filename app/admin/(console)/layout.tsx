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

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  /* ── Auth gate ──────────────────────────────────────────────────── */
  const cookieStore = await cookies()
  const supabase    = createClient(cookieStore)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/admin/login")
  }

  /* ── Fetch role + assigned profile permissions ──────────────────── *
   * Uses the service-role admin client to dodge the recursive RLS
   * policies on team_members (see fix-team-members-recursion.sql).   */
  const admin = createAdminClient()
  const { data: teamMember } = await admin
    .from("team_members")
    .select("role, profile_id")
    .eq("user_id", user.id)
    .maybeSingle()

  const userRole = teamMember?.role ?? "super_admin"

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
    redirect("/admin")
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
