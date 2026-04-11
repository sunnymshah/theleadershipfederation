"use client"

/* ═══════════════════════════════════════════════════════════════════════════
 *  ADMIN SIDEBAR — Zoho-Style Grouped Navigation
 *
 *  Sections: MAIN, REGISTRATIONS, CONTENT, FINANCE, PEOPLE, SETTINGS
 *  Each section has a small uppercase header and divider.
 *
 *  Role-based: nav items filtered via canAccessNavItem from lib/permissions.
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { canAccessNavItem } from "@/lib/permissions"
import { AdminLogoutButton } from "./AdminLogoutButton"

/* ─── Section definitions ─────────────────────────────────────────────── */

interface NavItem {
  label: string
  href: string
  icon: React.FC<{ active: boolean }>
}

interface NavSection {
  title: string
  items: NavItem[]
}

/* ─── Inline SVG Icons (simple, thin stroke) ──────────────────────────── */

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function TicketIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  )
}

function UsersIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ClockIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function ScanIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  )
}

function TagIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}

function LiveIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h2l3-9 4 18 4-18 3 9h2" />
      {/* Small "LIVE" pulse dot rendered as a filled circle */}
      <circle cx="20" cy="4" r="2" fill={active ? "#e7ab1c" : "#ef4444"} stroke="none" />
    </svg>
  )
}

function FeedbackIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 9h2" />
      <path d="M14 9h2" />
      <path d="M9 13c.6.6 1.4 1 2.5 1s1.9-.4 2.5-1" />
    </svg>
  )
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  )
}

function ClipboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="16" y2="16" />
    </svg>
  )
}

function BuildingIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <line x1="8" y1="6" x2="8.01" y2="6" />
      <line x1="16" y1="6" x2="16.01" y2="6" />
      <line x1="8" y1="10" x2="8.01" y2="10" />
      <line x1="16" y1="10" x2="16.01" y2="10" />
      <line x1="8" y1="14" x2="8.01" y2="14" />
      <line x1="16" y1="14" x2="16.01" y2="14" />
    </svg>
  )
}

function CreditCardIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}

function ReceiptIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M8 10h8" />
      <path d="M8 14h4" />
    </svg>
  )
}

function AwardIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  )
}

function UsersRoundIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 21a8 8 0 0 0-16 0" />
      <circle cx="10" cy="8" r="5" />
      <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
    </svg>
  )
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function ShieldCheckIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function BadgeIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M15 10h2" />
      <path d="M15 14h2" />
      <path d="M7 16c0-1.1.9-2 2-2h0c1.1 0 2 .9 2 2" />
    </svg>
  )
}

function ReportIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function MailTemplateIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function CampaignIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  )
}

function LeadCaptureIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  )
}

function AgendaIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  )
}

function PollIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="8" rx="1" /><rect x="10" y="8" width="4" height="12" rx="1" /><rect x="17" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}

function QAIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M12 7v2" /><path d="M12 13h.01" />
    </svg>
  )
}

function AutomationIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function RefundIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  )
}

function IntegrationIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function AnalyticsIcon({ active }: { active: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  )
}

/* ─── Section data ────────────────────────────────────────────────────── */

const sections: NavSection[] = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", href: "/admin", icon: DashboardIcon },
      { label: "Events", href: "/admin/events", icon: CalendarIcon },
    ],
  },
  {
    title: "REGISTRATIONS",
    items: [
      { label: "Tickets", href: "/admin/tickets", icon: TicketIcon },
      { label: "Attendees", href: "/admin/attendees", icon: UsersIcon },
      { label: "Waitlist", href: "/admin/waitlist", icon: ClockIcon },
      { label: "Approvals", href: "/admin/approvals", icon: ShieldCheckIcon },
      { label: "Check-In", href: "/admin/check-in", icon: ScanIcon },
      { label: "Live Dashboard", href: "/admin/live", icon: LiveIcon },
      { label: "Feedback", href: "/admin/feedback", icon: FeedbackIcon },
      { label: "Lead Capture", href: "/admin/leads", icon: LeadCaptureIcon },
      { label: "Promo Codes", href: "/admin/promo-codes", icon: TagIcon },
    ],
  },
  {
    title: "LIVE ENGAGEMENT",
    items: [
      { label: "Polls", href: "/admin/polls", icon: PollIcon },
      { label: "Q&A Wall", href: "/admin/qa", icon: QAIcon },
    ],
  },
  {
    title: "CONTENT",
    items: [
      { label: "Speakers", href: "/admin/speakers", icon: MicIcon },
      { label: "Sessions", href: "/admin/sessions", icon: ClipboardIcon },
      { label: "Agenda Builder", href: "/admin/agenda", icon: AgendaIcon },
      { label: "Sponsors", href: "/admin/sponsors", icon: BuildingIcon },
      { label: "Testimonials", href: "/admin/testimonials", icon: FeedbackIcon },
      { label: "Advisory Board", href: "/admin/advisory-board", icon: UsersRoundIcon },
    ],
  },
  {
    title: "COMMUNICATE",
    items: [
      { label: "Campaigns", href: "/admin/campaigns", icon: CampaignIcon },
      { label: "Automations", href: "/admin/automations", icon: AutomationIcon },
      { label: "Email Templates", href: "/admin/email-templates", icon: MailTemplateIcon },
    ],
  },
  {
    title: "FINANCE",
    items: [
      { label: "Payments", href: "/admin/payments", icon: CreditCardIcon },
      { label: "Invoices", href: "/admin/invoices", icon: ReceiptIcon },
      { label: "Refunds", href: "/admin/integrations?tab=refunds", icon: RefundIcon },
      { label: "Certificates", href: "/admin/certificates", icon: AwardIcon },
    ],
  },
  {
    title: "PEOPLE",
    items: [
      { label: "Team", href: "/admin/team", icon: UsersRoundIcon },
      { label: "Profiles", href: "/admin/settings?tab=profiles", icon: UserIcon },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { label: "Settings", href: "/admin/settings", icon: SettingsIcon },
      { label: "Integrations", href: "/admin/integrations", icon: IntegrationIcon },
      { label: "Analytics", href: "/admin/analytics", icon: AnalyticsIcon },
    ],
  },
]

/* ═══════════════════════════════════════════════════════════════════════════
 *  AdminSidebar Component
 * ═══════════════════════════════════════════════════════════════════════════ */

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
    // Strip query params for matching
    const base = href.split("?")[0]
    return pathname.startsWith(base)
  }

  // Filter sections and items based on role
  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // Use the base path (without query) for permission check
        const basePath = item.href.split("?")[0]
        return canAccessNavItem(userRole, basePath)
      }),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <aside className="w-[250px] shrink-0 bg-white border-r border-[#e0e0e0] flex flex-col h-screen sticky top-0 shadow-[1px_0_4px_rgba(26, 26, 46,0.04)]">
      {/* ── Logo / Branding ──────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-[#e8e8e8]">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#e7ab1c] flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-extrabold tracking-widest">
              TLF
            </span>
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold text-[#333]">Backstage</div>
            <div className="text-[10px] text-[#999] tracking-[0.06em]">
              Event Management
            </div>
          </div>
        </Link>
      </div>

      {/* ── Navigation Sections ──────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {visibleSections.map((section, idx) => (
          <div key={section.title}>
            {/* Section divider (skip for first section) */}
            {idx > 0 && (
              <div className="mx-2 my-1 border-t border-[#e5e7eb]" />
            )}

            {/* Section header */}
            <p
              className="px-4 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8e9298] select-none"
            >
              {section.title}
            </p>

            {/* Nav items */}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                      active
                        ? "bg-[#e8f0fe] text-[#1a73e8] font-medium"
                        : "text-[#5f6368] hover:bg-[#f0f0f0] hover:text-[#333]"
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0",
                        active ? "text-[#1a73e8]" : "text-[#9aa0a6]"
                      )}
                    >
                      <Icon active={active} />
                    </span>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User & Logout ────────────────────────────────────────────── */}
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
