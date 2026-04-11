/* ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN CONSOLE LAYOUT — 1-to-1 Zoho Backstage Replica
 *
 *  Structural shell:
 *    ┌──────────────────────────────────────────────────────────────┐
 *    │  TOP CONTEXT BAR  — Event Switcher · Admin Profile          │
 *    ├────────────┬─────────────────────────────────────────────────┤
 *    │            │                                                │
 *    │  LEFT      │  MAIN WORKSPACE                                │
 *    │  SIDEBAR   │  (grey #f4f5f7 background,                     │
 *    │  (white)   │   crisp white elevated data tables)            │
 *    │            │                                                │
 *    └────────────┴─────────────────────────────────────────────────┘
 *
 *  Modules match Zoho Backstage exactly:
 *    Dashboard, Microsite, Tickets, Attendees, Orders,
 *    Speakers, Sponsors, Settings
 *
 *  Auth-gated: redirects to /admin/login if no session.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

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

  // Default to super_admin if no team_members entry (first user / legacy setup)
  const userRole = teamMember?.role ?? "super_admin"

  return (
    <div className="flex min-h-screen bg-[#f4f5f7] admin-scrollbar">
      {/* ── Fixed Zoho-style sidebar (white, elevated) ──────────── */}
      <AdminSidebar userEmail={user.email ?? "admin"} userRole={userRole} />

      {/* ── Right side: top bar + workspace ─────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top context bar — Zoho's slim header */}
        <header className="h-[52px] shrink-0 bg-white border-b border-[#e0e0e0] flex items-center justify-between px-6 shadow-[0_1px_3px_rgba(26, 26, 46,0.04)]">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-semibold text-[#333]">
              The Leadership Federation
            </span>
            <span className="text-[11px] text-[#888] px-2 py-0.5 bg-[#f0f0f0] rounded font-medium">
              Admin Console
            </span>
          </div>

          {/* Admin profile indicator */}
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#666] hidden sm:block">{user.email}</span>
            <div className="w-8 h-8 rounded-full bg-[#e7ab1c] flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">
                {(user.email?.[0] ?? "A").toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable grey workspace (Zoho-exact #f4f5f7 bg) */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
