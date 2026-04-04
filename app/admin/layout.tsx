import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  Radio,
  Settings,
  LogOut,
} from "lucide-react"
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton"

export const metadata = {
  title: "Admin Console — The Leadership Federation",
}

/**
 * Admin Layout
 *
 * Provides the master shell for the admin console:
 * - Fixed left sidebar with navigation
 * - Top header showing user info
 * - Main content area for child routes
 *
 * Auth gate: Redirects unauthenticated users to /admin/login
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // ── Auth gate ────────────────────────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/admin/login")
  }

  // ── Navigation links ─────────────────────────────────────────────────
  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Events", href: "/admin/events", icon: Calendar },
    { label: "Tickets", href: "/admin/tickets", icon: Ticket },
    { label: "Speakers", href: "/admin/speakers", icon: Radio },
    { label: "Attendees", href: "/admin/attendees", icon: Users },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* ─────── LEFT SIDEBAR ──────────────────────────────────────────── */}
      <aside className="w-64 bg-[#050505] border-r border-white/[0.08] flex flex-col">
        {/* Logo / Branding */}
        <div className="px-6 py-6 border-b border-white/[0.08]">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#c9a84c] flex items-center justify-center">
              <span className="text-[#050505] text-xs font-bold">TLF</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-white/90">
                Leadership
              </div>
              <div className="text-[10px] text-white/40 tracking-wide">
                ADMIN CONSOLE
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/60 hover:text-white/90 hover:bg-white/[0.05] rounded-lg transition-colors"
            >
              <Icon size={18} className="shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="px-3 py-4 border-t border-white/[0.08] space-y-3">
          <div className="px-3 py-2 text-xs">
            <p className="text-white/40 tracking-wide mb-0.5">SIGNED IN</p>
            <p className="text-white/80 truncate text-[13px]">{user.email}</p>
          </div>
          <AdminLogoutButton />
        </div>
      </aside>

      {/* ─────── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-[#0a0a0a] border-b border-white/[0.08] flex items-center px-8">
          <h1 className="text-white/90 text-lg font-semibold">
            The Leadership Federation Admin
          </h1>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-[#0a0a0a]">{children}</main>
      </div>
    </div>
  )
}
