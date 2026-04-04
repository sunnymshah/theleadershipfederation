"use client"

/**
 * ─── ADMIN SIDEBAR ───────────────────────────────────────────────────────
 *
 * Fixed left sidebar with navigation and active-state highlighting.
 * Client Component because it uses usePathname() for the active link.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  Radio,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AdminLogoutButton } from "./AdminLogoutButton"

const navItems = [
  { label: "Dashboard",  href: "/admin",           icon: LayoutDashboard },
  { label: "Events",     href: "/admin/events",    icon: Calendar },
  { label: "Tickets",    href: "/admin/tickets",   icon: Ticket },
  { label: "Speakers",   href: "/admin/speakers",  icon: Radio },
  { label: "Attendees",  href: "/admin/attendees",  icon: Users },
  { label: "Settings",   href: "/admin/settings",  icon: Settings },
]

export function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()

  return (
    <aside className="w-[240px] shrink-0 bg-[#050505] border-r border-white/[0.06] flex flex-col h-screen sticky top-0">
      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#c9a84c] flex items-center justify-center shrink-0">
            <span className="text-[#050505] text-[11px] font-extrabold tracking-widest">
              TLF
            </span>
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-white/90">
              Leadership Fed.
            </div>
            <div className="text-[10px] text-white/30 tracking-[0.15em] uppercase">
              Admin Console
            </div>
          </div>
        </Link>
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          // Match exact for dashboard, prefix for others
          const isActive =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "bg-white/[0.07] text-white"
                  : "text-white/45 hover:text-white/75 hover:bg-white/[0.03]"
              )}
            >
              <Icon
                size={17}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-[#c9a84c]" : ""
                )}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* ── User & Logout ────────────────────────────────────────── */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="px-3 mb-3">
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">
            Signed in as
          </p>
          <p className="text-[12px] text-white/65 truncate">{userEmail}</p>
        </div>
        <AdminLogoutButton />
      </div>
    </aside>
  )
}
