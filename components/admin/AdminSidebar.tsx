"use client"

/* ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN SIDEBAR — Collapsible Grouped Navigation
 *
 *  Each major topic is a collapsible group (click chevron to expand/collapse).
 *  State persists via localStorage across navigations.
 *  Auto-expands the group containing the active route.
 *
 *  Role-based: nav items filtered via canAccessNavItem from lib/permissions.
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { canAccessNavItem } from "@/lib/permissions"
import { AdminLogoutButton } from "./AdminLogoutButton"
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Calendar,
  ListChecks,
  Layout,
  ScanLine,
  Radio,
  Clock,
  Users,
  UserRound,
  Users2,
  UserCheck,
  Ticket,
  CreditCard,
  Receipt,
  Award,
  Tag,
  RotateCcw,
  Crown,
  UserPlus,
  ShieldCheck,
  BarChartHorizontal,
  MessageSquare,
  MessageCircle,
  ThumbsUp,
  Flame,
  Megaphone,
  Zap,
  Mail,
  MailOpen,
  Building2,
  Quote,
  IdCard,
  Settings,
  Plug,
  Inbox,
  ChevronDown,
  Handshake,
  Layers,
  Info,
  HelpCircle,
  Newspaper,
  BadgeCheck,
} from "lucide-react"

/* ─── Section definitions ─────────────────────────────────────────────── */

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
}

interface NavSection {
  title: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  items: NavItem[]
  defaultOpen?: boolean
}

/* ─── Section data ────────────────────────────────────────────────────── */

const sections: NavSection[] = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Reports", href: "/admin/reports", icon: FileText },
    ],
  },
  {
    title: "Events",
    icon: Calendar,
    items: [
      { label: "All Events", href: "/admin/events", icon: Calendar },
      { label: "Sessions", href: "/admin/sessions", icon: ListChecks },
      { label: "Agenda Builder", href: "/admin/agenda", icon: Layout },
      { label: "Check-In", href: "/admin/check-in", icon: ScanLine },
      { label: "Live Dashboard", href: "/admin/live", icon: Radio },
      { label: "Waitlist", href: "/admin/waitlist", icon: Clock },
    ],
  },
  {
    title: "People",
    icon: Users,
    items: [
      { label: "Attendees", href: "/admin/attendees", icon: Users },
      { label: "Advisory Board", href: "/admin/advisory-board", icon: Users2 },
      { label: "Team", href: "/admin/team", icon: UserRound },
    ],
  },
  {
    title: "Commerce",
    icon: CreditCard,
    items: [
      { label: "Tickets", href: "/admin/tickets", icon: Ticket },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Invoices", href: "/admin/invoices", icon: Receipt },
      { label: "Refunds", href: "/admin/integrations?tab=refunds", icon: RotateCcw },
      { label: "Promo Codes", href: "/admin/promo-codes", icon: Tag },
      { label: "Certificates", href: "/admin/certificates", icon: Award },
    ],
  },
  {
    title: "Growth",
    icon: Crown,
    items: [
      { label: "Memberships", href: "/admin/memberships", icon: Crown },
      { label: "Registrations", href: "/admin/registrations", icon: UserPlus },
      { label: "Approvals", href: "/admin/approvals", icon: ShieldCheck },
    ],
  },
  {
    title: "Engagement",
    icon: MessageSquare,
    items: [
      { label: "Polls", href: "/admin/polls", icon: BarChartHorizontal },
      { label: "Q&A Wall", href: "/admin/qa", icon: MessageCircle },
      { label: "Feedback", href: "/admin/feedback", icon: ThumbsUp },
      { label: "Lead Capture", href: "/admin/leads", icon: Flame },
    ],
  },
  {
    title: "Marketing",
    icon: Megaphone,
    items: [
      { label: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
      { label: "Automations", href: "/admin/automations", icon: Zap },
      { label: "Email Templates", href: "/admin/email-templates", icon: Mail },
      { label: "Newsletter", href: "/admin/newsletter", icon: MailOpen },
    ],
  },
  {
    title: "Messages",
    icon: Inbox,
    items: [
      { label: "Contact Inquiries", href: "/admin/contact-inquiries", icon: Inbox },
    ],
  },
  {
    title: "Content",
    icon: Building2,
    items: [
      { label: "Partners", href: "/admin/partners", icon: Handshake },
      { label: "Platforms", href: "/admin/platforms", icon: Layers },
      { label: "About Page", href: "/admin/about", icon: Info },
      { label: "Contact Page", href: "/admin/contact", icon: Inbox },
      { label: "Media / Press", href: "/admin/media", icon: Newspaper },
      { label: "Inner Circle", href: "/admin/inner-circle", icon: BadgeCheck },
      { label: "FAQs", href: "/admin/faqs", icon: HelpCircle },
      { label: "Testimonials", href: "/admin/testimonials", icon: Quote },
      { label: "Badges", href: "/admin/badges", icon: IdCard },
    ],
  },
  {
    title: "System",
    icon: Settings,
    items: [
      { label: "Integrations", href: "/admin/integrations", icon: Plug },
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Profile Access", href: "/admin/settings?tab=profiles", icon: UserCheck },
    ],
  },
]

/* ═══════════════════════════════════════════════════════════════════════════
 *  AdminSidebar Component
 * ═══════════════════════════════════════════════════════════════════════════ */

const LS_KEY = "tlf-admin-sidebar-open"

export function AdminSidebar({
  userEmail,
  userRole = "super_admin",
}: {
  userEmail: string
  userRole?: string
}) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin"
    const base = href.split("?")[0]
    return pathname.startsWith(base)
  }

  // Filter sections and items based on role
  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const basePath = item.href.split("?")[0]
        return canAccessNavItem(userRole, basePath)
      }),
    }))
    .filter((section) => section.items.length > 0)

  // Track which sections are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {}
    for (const s of visibleSections) defaults[s.title] = !!s.defaultOpen
    return defaults
  })

  // On mount: hydrate from localStorage and auto-open the group containing active route
  useEffect(() => {
    let stored: Record<string, boolean> = {}
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) stored = JSON.parse(raw)
    } catch {
      stored = {}
    }

    const next: Record<string, boolean> = {}
    for (const s of visibleSections) {
      const hasActive = s.items.some((i) => isActive(i.href))
      // Priority: active group open > stored state > default
      if (hasActive) next[s.title] = true
      else if (s.title in stored) next[s.title] = stored[s.title]
      else next[s.title] = !!s.defaultOpen
    }
    setOpenSections(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  function toggleSection(title: string) {
    setOpenSections((prev) => {
      const next = { ...prev, [title]: !prev[title] }
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  return (
    <aside className="w-[260px] shrink-0 bg-white border-r border-[#e5e7eb] flex flex-col h-screen sticky top-0">
      {/* ── Logo / Branding ──────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-[#e5e7eb]">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#e7ab1c] flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-extrabold tracking-widest">
              TLF
            </span>
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold text-[#1a1a2e]">Backstage</div>
            <div className="text-[10px] text-[#9aa0a6] tracking-[0.06em]">
              Event Management
            </div>
          </div>
        </Link>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {visibleSections.map((section) => {
          const open = openSections[section.title] ?? false
          const SectionIcon = section.icon
          const hasActive = section.items.some((i) => isActive(i.href))

          return (
            <div key={section.title} className="mb-0.5">
              {/* Group header — clickable */}
              <button
                onClick={() => toggleSection(section.title)}
                className={cn(
                  "group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors",
                  hasActive
                    ? "text-[#1a1a2e]"
                    : "text-[#5f6368] hover:bg-[#f6f7f9] hover:text-[#1a1a2e]"
                )}
                aria-expanded={open}
              >
                <SectionIcon
                  size={15}
                  strokeWidth={1.7}
                  className={cn(
                    "shrink-0",
                    hasActive ? "text-[#e7ab1c]" : "text-[#9aa0a6] group-hover:text-[#1a1a2e]"
                  )}
                />
                <span className="text-[12px] font-semibold uppercase tracking-[0.05em] flex-1 text-left">
                  {section.title}
                </span>
                <ChevronDown
                  size={14}
                  strokeWidth={1.8}
                  className={cn(
                    "shrink-0 transition-transform duration-200 text-[#9aa0a6]",
                    open ? "rotate-0" : "-rotate-90"
                  )}
                />
              </button>

              {/* Items — animated collapse */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200 ease-out",
                  open ? "max-h-[600px] opacity-100 mt-0.5" : "max-h-0 opacity-0"
                )}
              >
                <div className="pl-2 space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href)
                    const Icon = item.icon
                    return (
                      <Link
                        key={`${item.href}-${item.label}`}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 pl-5 pr-3 py-1.5 rounded-lg text-[13px] transition-all duration-150",
                          active
                            ? "bg-[#e7ab1c]/10 text-[#1a1a2e] font-semibold"
                            : "text-[#5f6368] hover:bg-[#f6f7f9] hover:text-[#1a1a2e] font-medium"
                        )}
                      >
                        <Icon
                          size={14}
                          strokeWidth={active ? 2 : 1.6}
                          className={cn(
                            "shrink-0",
                            active ? "text-[#e7ab1c]" : "text-[#9aa0a6]"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── User & Logout ────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-[#e5e7eb]">
        <div className="px-1 mb-2.5">
          <p className="text-[10px] text-[#9aa0a6] uppercase tracking-wider mb-0.5">
            Signed in as
          </p>
          <p className="text-[12px] text-[#1a1a2e] truncate font-medium">{userEmail}</p>
        </div>
        <AdminLogoutButton />
      </div>
    </aside>
  )
}
