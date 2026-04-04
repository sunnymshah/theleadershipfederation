/**
 * ─── ADMIN CONSOLE LAYOUT ────────────────────────────────────────────────
 *
 * This layout wraps ONLY authenticated admin pages (not /admin/login).
 * It provides:
 *   1. Auth gate → redirects to login if session is missing
 *   2. Fixed left sidebar with navigation
 *   3. Scrollable main content area
 *
 * The (console) route group means this layout does NOT affect /admin/login.
 */

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ── Auth gate ────────────────────────────────────────────────────────
  const cookieStore = await cookies()
  const supabase    = createClient(cookieStore)

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/admin/login")
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Fixed sidebar */}
      <AdminSidebar userEmail={user.email ?? "admin"} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 shrink-0 border-b border-white/[0.06] flex items-center px-8 bg-[#0a0a0a]">
          <span className="text-[13px] text-white/30 font-medium">
            The Leadership Federation — Admin Console
          </span>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
