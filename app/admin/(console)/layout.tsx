/* ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN CONSOLE LAYOUT
 *
 *  Auth-gated: redirects to /admin/login if no session.
 *  Uses AdminLayoutShell for responsive sidebar + header.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { AdminLayoutShell } from "@/components/admin/AdminLayoutShell"

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

  /* ── Fetch user role from team_members ──────────────────────────── */
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .single()

  const userRole = teamMember?.role ?? "super_admin"

  return (
    <AdminLayoutShell userEmail={user.email ?? "admin"} userRole={userRole}>
      {children}
    </AdminLayoutShell>
  )
}
