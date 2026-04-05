"use client"

/* ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN SIDEBAR — 1-to-1 Zoho Backstage Replica
 *
 *  Exact Zoho Backstage modules:
 *    Dashboard, Microsite (Website Builder), Tickets, Attendees,
 *    Orders, Speakers, Sponsors, Settings
 *
 *  Visual: White sidebar, #f4f5f7 workspace bg, exact Zoho grey/blue
 *  active states, thin-stroke icons matching Zoho's iconography.
 *
 *  Role-based: nav items are filtered based on the user's team role.
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Globe,
  Ticket,
  Users,
  ShoppingCart,
  Radio,
  Building2,
  ClipboardList,
  Tag,
  ScanLine,
  Settings,
  UserCheck,
  UsersRound,
  Award,
  Receipt,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { canAccessNavItem } from "@/lib/permissions"
import { AdminLogoutButton } from "./AdminLogoutButton"

/* ─── Zoho Backstage exact sidebar modules ─────────────────────────────── */
const navItems = [
  /* Main */
  { label: "Dashboard",    href: "/admin",             icon: LayoutDashboard, section: "main" },
  { label: "Events",       href: "/admin/events",      icon: Globe,           section: "main" },
  /* Manage — matches Zoho's core modules */
  { label: "Tickets",      href: "/admin/tickets",     icon: Ticket,          section: "manage" },
  { label: "Attendees",    href: "/admin/attendees",   icon: Users,           section: "manage" },
  { label: "Speakers",     href: "/admin/speakers",    icon: Radio,           section: "manage" },
  { label: "Sponsors",     href: "/admin/sponsors",    icon: Building2,       section: "manage" },
  { label: "Sessions",     href: "/admin/sessions",    icon: ClipboardList,   section: "manage" },
  { label: "Promo Codes",  href: "/admin/promo-codes", icon: Tag,             section: "manage" },
  /* Operations */
  { label: "Check-In",     href: "/admin/check-in",      icon: ScanLine,        section: "ops" },
  { label: "CRM / Leads",  href: "/admin/attendees",     icon: UserCheck,       section: "ops" },
  { label: "Certificates", href: "/admin/certificates",  icon: Award,           section: "ops" },
  { label: "Invoices",     href: "/admin/invoices",      icon: Receipt,         section: "ops" },
  { label: "Team",         href: "/admin/team",          icon: UsersRound,      section: "ops" },
  { label: "Settings",     href: "/admin/settings",      icon: Settings,        section: "ops" },
]

export function AdminSidebar({ userEmail, userRole = "super_admin" }: { userEmail: string; userRole?: string }) {
  const pathname = usePathname()

  // Filter nav items based on the user's role
  const visibleItems = navItems.filter((item) => canAccessNavItem(userRole, item.href))

  const renderLink = ({ label, href, icon: Icon }: typeof navItems[number]) => {
    const isActive = href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(href)

    return (
      <Link
        key={`${href}-${label}`}
        href={href}
        className={cn(
          "flex items-center gap-3 px-4 py-[10px] rounded-lg text-[13px] font-medium transition-all duration-150",
          isActive
            ? "bg-[#e8f0fe] text-[#1a73e8]"
            : "text-[#5f6368] hover:bg-[#f0f0f0] hover:text-[#333]"
        )}
      >
        <Icon
          size={17}
          strokeWidth={1.6}
          className={cn("shrink-0", isActive ? "text-[#1a73e8]" : "text-[#9aa0a6]")}
        />
        {label}
      </Link>
    )
  }

  return (
    <aside className="w-[250px] shrink-0 bg-white border-r border-[#e0e0e0] flex flex-col h-screen sticky top-0 shadow-[1px_0_4px_rgba(0,0,0,0.04)]">
      {/* ── Logo — Zoho Backstage header style ────────────────────── */}
      <div className="px-5 py-4 border-b border-[#e8e8e8]">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#e7ab1c] flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-extrabold tracking-widest">
              TLF
            </span>
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold text-[#333]">
              Backstage
            </div>
            <div className="text-[10px] text-[#999] tracking-[0.06em]">
              Event Management
            </div>
          </div>
        </Link>
      </div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {/* Main */}
        <div className="space-y-0.5 mb-5">
          {visibleItems.filter(n => n.section === "main").map(renderLink)}
        </div>

        {/* Manage */}
        {visibleItems.filter(n => n.section === "manage").length > 0 && (
          <div className="mb-5">
            <p className="px-4 text-[10px] text-[#999] uppercase tracking-[0.15em] font-semibold mb-2">
              Manage
            </p>
            <div className="space-y-0.5">
              {visibleItems.filter(n => n.section === "manage").map(renderLink)}
            </div>
          </div>
        )}

        {/* Operations */}
        {visibleItems.filter(n => n.section === "ops").length > 0 && (
          <div>
            <p className="px-4 text-[10px] text-[#999] uppercase tracking-[0.15em] font-semibold mb-2">
              Operations
            </p>
            <div className="space-y-0.5">
              {visibleItems.filter(n => n.section === "ops").map(renderLink)}
            </div>
          </div>
        )}
      </nav>

      {/* ── User & Logout (Zoho bottom style) ─────────────────────── */}
      <div className="px-4 py-4 border-t border-[#e8e8e8]">
        <div className="px-1 mb-3">
          <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">
            Signed in as
          </p>
          <p className="text-[12px] text-[#555] truncate">{userEmail}</p>
        </div>
        <AdminLogoutButton />
      </div>
    </aside>
  )
}
