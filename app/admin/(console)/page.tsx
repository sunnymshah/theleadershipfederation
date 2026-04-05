/**
 * ─── ADMIN DASHBOARD — Zoho-Level Analytics Overview ──────────────────
 *
 * Rich analytics page showing:
 * - 6 stat cards (2 rows of 3): events, registrations, revenue,
 *   tickets sold, check-in rate, pending actions
 * - Sales summary by ticket tier (horizontal bar chart)
 * - Registration overview (donut chart)
 * - Revenue trend (last 30 days bar chart)
 * - Event performance table (sortable)
 * - Recent activity feed
 * - Quick actions row
 *
 * All charts are pure CSS (no external libraries).
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { getOverallStats, getDashboardStats } from "@/app/actions/analyticsActions"
import Link from "next/link"
import { DashboardClientParts } from "@/components/admin/DashboardClientParts"

/* ─── Formatters ──────────────────────────────────────────────────────── */

function fmtCurrency(amount: number) {
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(1)}L`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`
  }
  return new Intl.NumberFormat("en-IN").format(amount)
}

function fmtFullCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function fmtShortDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })
}

function fmtNumber(n: number) {
  return new Intl.NumberFormat("en-IN").format(n)
}

/* ─── Status colours ──────────────────────────────────────────────────── */

const statusBadge: Record<string, string> = {
  draft: "text-gray-600 bg-gray-100 border-gray-200",
  published: "text-emerald-700 bg-emerald-50 border-emerald-200",
  completed: "text-blue-700 bg-blue-50 border-blue-200",
  cancelled: "text-red-700 bg-red-50 border-red-200",
}

const registrationStatusBadge: Record<string, string> = {
  registered: "text-blue-700 bg-blue-50",
  checked_in: "text-emerald-700 bg-emerald-50",
  waitlisted: "text-orange-700 bg-orange-50",
  cancelled: "text-red-700 bg-red-50",
  confirmed: "text-indigo-700 bg-indigo-50",
}

/* ─── SVG Icon helpers (inline, no imports needed) ────────────────────── */

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function RupeeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="18" y2="3" />
      <line x1="6" y1="8" x2="18" y2="8" />
      <line x1="6" y1="3" x2="6" y2="8" />
      <path d="M9 8c0 4 3 6 7 6" />
      <path d="M6 21l8-8" />
    </svg>
  )
}

function TicketIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  )
}

function ScanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function TrendUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

function TrendDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  MAIN DASHBOARD — Server Component
 * ═══════════════════════════════════════════════════════════════════════════ */

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch analytics
  const [overallResult, eventStatsResult] = await Promise.all([
    getOverallStats(),
    getDashboardStats(),
  ])

  const overall = overallResult.data
  const eventStats = eventStatsResult.data

  // ─── Compute extended stats ──────────────────────────────────────────
  const totalEvents = overall?.totalEvents ?? 0
  const totalRegistrations = overall?.totalAttendees ?? 0
  const totalRevenue = overall?.totalRevenue ?? 0
  const totalCheckedIn = overall?.totalCheckedIn ?? 0
  const checkInRate = overall?.overallCheckInRate ?? 0

  // Status breakdown counts
  const eventBreakdowns = overall?.eventBreakdowns ?? []
  const draftCount = eventBreakdowns.filter((e) => e.status === "draft").length
  const publishedCount = eventBreakdowns.filter((e) => e.status === "published").length
  const completedCount = eventBreakdowns.filter((e) => e.status === "completed").length

  // Tickets sold / capacity
  const ticketBreakdown = eventStats?.ticketBreakdown ?? []
  const totalSold = ticketBreakdown.reduce((s, t) => s + t.sold, 0)
  const totalCapacity = ticketBreakdown.reduce((s, t) => s + t.limit, 0)
  const soldPct = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0

  // Fetch pending actions (waitlisted + pending payments) across all events
  const { count: waitlistedCount } = await supabase
    .from("attendees")
    .select("id", { count: "exact", head: true })
    .eq("status", "waitlisted")

  const { count: pendingPaymentCount } = await supabase
    .from("attendees")
    .select("id", { count: "exact", head: true })
    .eq("payment_status", "pending")
    .neq("status", "cancelled")

  const pendingActions = (waitlistedCount ?? 0) + (pendingPaymentCount ?? 0)

  // Fetch recent 10 registrations
  const { data: recentRegistrations } = await supabase
    .from("attendees")
    .select("id, name, email, status, registration_date, events(title), tickets(name)")
    .order("registration_date", { ascending: false })
    .limit(10)

  const recentList = (recentRegistrations ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    status: r.status as string,
    registration_date: r.registration_date as string,
    events: Array.isArray(r.events) ? (r.events[0] ?? null) : r.events as { title: string } | null,
    tickets: Array.isArray(r.tickets) ? (r.tickets[0] ?? null) : r.tickets as { name: string } | null,
  }))

  // Registration overview counts (across all events)
  const { count: registeredCount } = await supabase
    .from("attendees")
    .select("id", { count: "exact", head: true })
    .eq("status", "registered")

  const { count: checkedInCount } = await supabase
    .from("attendees")
    .select("id", { count: "exact", head: true })
    .eq("status", "checked_in")

  const { count: allWaitlistedCount } = await supabase
    .from("attendees")
    .select("id", { count: "exact", head: true })
    .eq("status", "waitlisted")

  const { count: cancelledCount } = await supabase
    .from("attendees")
    .select("id", { count: "exact", head: true })
    .eq("status", "cancelled")

  const donutData = [
    { label: "Registered", count: registeredCount ?? 0, color: "#3b82f6" },
    { label: "Checked In", count: checkedInCount ?? 0, color: "#10b981" },
    { label: "Waitlisted", count: allWaitlistedCount ?? 0, color: "#f59e0b" },
    { label: "Cancelled", count: cancelledCount ?? 0, color: "#ef4444" },
  ]
  const donutTotal = donutData.reduce((s, d) => s + d.count, 0)

  // Revenue by day data
  const revenueByDay = eventStats?.revenueByDay ?? []
  const maxDayRevenue = Math.max(...revenueByDay.map((d) => d.revenue), 1)

  // All ticket tiers (across all events for sales summary)
  const { data: allTickets } = await supabase
    .from("tickets")
    .select("id, name, price_inr, sold, inventory_limit, event_id")
    .order("price_inr", { ascending: false })

  const allTicketTiers = (allTickets ?? []) as Array<{
    id: string
    name: string
    price_inr: number
    sold: number
    inventory_limit: number
    event_id: string
  }>

  // Compute revenue per tier
  const tierSales = allTicketTiers.map((t) => {
    const revenue = t.sold * t.price_inr
    const saturation = t.inventory_limit > 0 ? (t.sold / t.inventory_limit) * 100 : 0
    return { ...t, revenue, saturation }
  })
  const maxTierRevenue = Math.max(...tierSales.map((t) => t.revenue), 1)

  // ─── Compute donut segments using conic-gradient ────────────────────
  let donutGradient = "conic-gradient("
  let cumPct = 0
  if (donutTotal === 0) {
    donutGradient = "conic-gradient(#e5e7eb 0deg 360deg)"
  } else {
    const segments: string[] = []
    donutData.forEach((d) => {
      const pct = (d.count / donutTotal) * 100
      segments.push(`${d.color} ${cumPct}% ${cumPct + pct}%`)
      cumPct += pct
    })
    donutGradient = `conic-gradient(${segments.join(", ")})`
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h2>
        <p className="text-sm text-gray-500">
          Analytics and performance overview across all events
        </p>
      </div>

      {/* ═══ ROW 1: Stat Cards (3 columns) ════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Total Events */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Events</p>
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <CalendarIcon />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{totalEvents}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
              {draftCount} Draft
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {publishedCount} Published
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              {completedCount} Completed
            </span>
          </div>
        </div>

        {/* Total Registrations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Registrations</p>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <UsersIcon />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-3xl font-bold text-gray-900">{fmtNumber(totalRegistrations)}</p>
            {totalRegistrations > 0 && (
              <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-medium">
                <TrendUpIcon /> Active
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{fmtNumber(totalCheckedIn)} checked in</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Revenue</p>
            <div className="w-9 h-9 rounded-lg bg-[#e7ab1c]/10 flex items-center justify-center text-[#b8941a]">
              <RupeeIcon />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            ₹{fmtCurrency(totalRevenue)}
          </p>
          <p className="text-xs text-gray-500">{fmtFullCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* ═══ ROW 2: Stat Cards (3 columns) ════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Tickets Sold */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Tickets Sold</p>
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <TicketIcon />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {fmtNumber(totalSold)}{" "}
            <span className="text-sm font-normal text-gray-400">/ {fmtNumber(totalCapacity)}</span>
          </p>
          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${soldPct >= 80 ? "bg-red-500" : soldPct >= 50 ? "bg-yellow-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(soldPct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1.5">{soldPct}% capacity filled</p>
        </div>

        {/* Check-in Rate */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Check-in Rate</p>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <CheckCircleIcon />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Circular progress */}
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path
                  className="text-gray-100"
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-indigo-500"
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${checkInRate}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900">{checkInRate}%</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{fmtNumber(totalCheckedIn)}</p>
              <p className="text-xs text-gray-500">of {fmtNumber(totalRegistrations)} checked in</p>
            </div>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pending Actions</p>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${pendingActions > 0 ? "bg-orange-50 text-orange-600" : "bg-gray-50 text-gray-400"}`}>
              <AlertIcon />
            </div>
          </div>
          <p className={`text-3xl font-bold mb-2 ${pendingActions > 0 ? "text-orange-600" : "text-gray-900"}`}>
            {pendingActions}
          </p>
          <div className="flex flex-col gap-1 text-xs text-gray-500">
            {(waitlistedCount ?? 0) > 0 && (
              <span>{waitlistedCount} waitlisted</span>
            )}
            {(pendingPaymentCount ?? 0) > 0 && (
              <span>{pendingPaymentCount} pending payments</span>
            )}
            {pendingActions === 0 && <span>All clear</span>}
          </div>
        </div>
      </div>

      {/* ═══ Sales Summary — Revenue by Ticket Tier ═══════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="font-semibold text-gray-900 mb-1">Sales Summary</h3>
          <p className="text-sm text-gray-500 mb-5">Revenue by ticket tier</p>

          {tierSales.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No ticket tiers configured</div>
          ) : (
            <div className="space-y-4">
              {tierSales.map((tier) => {
                const barPct = maxTierRevenue > 0 ? (tier.revenue / maxTierRevenue) * 100 : 0
                const barColor =
                  tier.saturation >= 80
                    ? "bg-red-500"
                    : tier.saturation >= 50
                      ? "bg-yellow-500"
                      : "bg-emerald-500"
                return (
                  <div key={tier.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700 truncate mr-3">{tier.name}</span>
                      <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                        <span>{tier.sold} sold</span>
                        <span className="font-semibold text-gray-900">{fmtFullCurrency(tier.revenue)}</span>
                      </div>
                    </div>
                    <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all`}
                        style={{ width: `${Math.max(barPct, 2)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] text-gray-400">
                        ₹{fmtNumber(tier.price_inr)} / ticket
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {Math.round(tier.saturation)}% filled
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ═══ Registration Overview — Donut Chart ════════════════════════ */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="font-semibold text-gray-900 mb-1">Registration Overview</h3>
          <p className="text-sm text-gray-500 mb-5">Status breakdown across all events</p>

          <div className="flex items-center gap-8">
            {/* Donut */}
            <div className="relative w-36 h-36 shrink-0">
              <div
                className="w-full h-full rounded-full"
                style={{ background: donutGradient }}
              />
              <div className="absolute inset-[25%] bg-white rounded-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">{fmtNumber(donutTotal)}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-3">
              {donutData.map((d) => (
                <div key={d.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-sm text-gray-700">{d.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {fmtNumber(d.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Revenue Trend — Last 30 Days Bar Chart ═══════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-8">
        <h3 className="font-semibold text-gray-900 mb-1">Revenue Trend</h3>
        <p className="text-sm text-gray-500 mb-5">Daily revenue from latest event registrations</p>

        {revenueByDay.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No revenue data yet</div>
        ) : (
          <div>
            {/* Bar chart */}
            <div className="flex items-end gap-1 h-52 mb-3">
              {revenueByDay.map((day) => {
                const heightPct = (day.revenue / maxDayRevenue) * 100
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip */}
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-gray-800 text-white text-[11px] whitespace-nowrap z-10 shadow-lg pointer-events-none">
                      <div className="font-semibold">{fmtShortDate(day.date)}</div>
                      <div className="text-white/80">{fmtFullCurrency(day.revenue)}</div>
                      <div className="text-white/60">
                        {day.count} registration{day.count !== 1 ? "s" : ""}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800" />
                    </div>
                    <div
                      className="w-full rounded-t bg-[#e7ab1c]/60 hover:bg-[#e7ab1c] transition-colors cursor-default min-h-[3px]"
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                    />
                  </div>
                )
              })}
            </div>
            {/* X-axis */}
            <div className="flex gap-1">
              {revenueByDay.map((day) => (
                <div key={day.date} className="flex-1 text-center text-[9px] text-gray-400 truncate">
                  {fmtShortDate(day.date)}
                </div>
              ))}
            </div>
            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {revenueByDay.length} day{revenueByDay.length !== 1 ? "s" : ""} of sales
              </span>
              <span className="text-xs font-semibold text-gray-900">
                Total: {fmtFullCurrency(revenueByDay.reduce((sum, d) => sum + d.revenue, 0))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Event Performance Table ══════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Event Performance</h3>
          <p className="text-sm text-gray-500">Click any row to view event details</p>
        </div>

        {eventBreakdowns.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No events yet</div>
        ) : (
          <DashboardClientParts
            eventBreakdowns={eventBreakdowns.map((e) => ({
              ...e,
              start_date_fmt: fmtDate(e.start_date),
              revenue_fmt: e.revenue > 0 ? fmtFullCurrency(e.revenue) : "--",
            }))}
            statusBadge={statusBadge}
          />
        )}
      </div>

      {/* ═══ Recent Activity ══════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            <p className="text-sm text-gray-500">Last 10 registrations</p>
          </div>
          <Link
            href="/admin/attendees"
            className="text-xs font-medium text-[#1a73e8] hover:underline"
          >
            View All
          </Link>
        </div>

        {recentList.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No registrations yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentList.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-5 py-3 text-gray-600">{r.email}</td>
                    <td className="px-5 py-3 text-gray-600">{r.events?.title ?? "--"}</td>
                    <td className="px-5 py-3 text-gray-600">{r.tickets?.name ?? "--"}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {r.registration_date ? fmtDate(r.registration_date) : "--"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${registrationStatusBadge[r.status] ?? "text-gray-600 bg-gray-100"}`}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ Quick Actions ════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/admin/events"
          className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[#1a73e8] hover:shadow-md transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
            <PlusIcon />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Create Event</p>
            <p className="text-[11px] text-gray-400">New event</p>
          </div>
        </Link>

        <Link
          href="/admin/speakers"
          className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[#1a73e8] hover:shadow-md transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
            <MicIcon />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Add Speaker</p>
            <p className="text-[11px] text-gray-400">Manage speakers</p>
          </div>
        </Link>

        <Link
          href="/admin/check-in"
          className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[#1a73e8] hover:shadow-md transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 transition-colors">
            <ScanIcon />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">View Check-ins</p>
            <p className="text-[11px] text-gray-400">QR scanner</p>
          </div>
        </Link>

        <Link
          href="/admin/invoices"
          className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[#1a73e8] hover:shadow-md transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-[#e7ab1c]/10 flex items-center justify-center text-[#b8941a] group-hover:bg-[#e7ab1c]/20 transition-colors">
            <FileIcon />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Generate Report</p>
            <p className="text-[11px] text-gray-400">Invoices & certs</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
