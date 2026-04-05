/**
 * ─── ADMIN DASHBOARD — Analytics Overview ──────────────────────────────
 *
 * Rich analytics page showing:
 * - Overall stat cards (events, registrations, revenue, check-in rate)
 * - Per-event breakdown table
 * - Ticket tier breakdown for latest event
 * - Revenue by day chart (simple bar chart)
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { getOverallStats, getDashboardStats } from "@/app/actions/analyticsActions"
import {
  Calendar,
  Users,
  IndianRupee,
  UserCheck,
  TrendingUp,
  Ticket,
  BarChart3,
  Trophy,
} from "lucide-react"

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

const statusColors: Record<string, string> = {
  draft: "text-yellow-700 bg-yellow-50",
  published: "text-emerald-700 bg-emerald-50",
  completed: "text-blue-700 bg-blue-50",
  cancelled: "text-red-700 bg-red-50",
}

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
    getDashboardStats(), // latest event
  ])

  const overall = overallResult.data
  const eventStats = eventStatsResult.data

  // Top-level stat cards
  const statCards = [
    {
      label: "Total Events",
      value: String(overall?.totalEvents ?? 0),
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "Total Registrations",
      value: String(overall?.totalAttendees ?? 0),
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: "Total Revenue",
      value: overall?.totalRevenue
        ? `₹${fmtCurrency(overall.totalRevenue)}`
        : "₹0",
      icon: IndianRupee,
      color: "text-[#b8941a]",
      bg: "bg-[#e7ab1c]/10",
      border: "border-[#e7ab1c]/20",
    },
    {
      label: "Check-in Rate",
      value: `${overall?.overallCheckInRate ?? 0}%`,
      icon: UserCheck,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
    },
  ]

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#333] mb-1">Dashboard</h2>
        <p className="text-sm text-[#888]">
          Analytics and performance overview across all events
        </p>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className={`p-5 rounded-xl border ${border} bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]`}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-[#888] font-medium uppercase tracking-wider">
                {label}
              </p>
              <div
                className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}
              >
                <Icon size={16} className={color} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Top Event Highlight ──────────────────────────────────── */}
      {overall?.topEventByRegistrations && (
        <div className="mb-8 p-4 rounded-xl border border-[#e7ab1c]/20 bg-[#e7ab1c]/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#e7ab1c]/10 flex items-center justify-center shrink-0">
            <Trophy size={18} className="text-[#b8941a]" />
          </div>
          <div>
            <p className="text-xs text-[#888] font-medium uppercase tracking-wider">
              Top Event by Registrations
            </p>
            <p className="text-sm font-semibold text-[#333]">
              {overall.topEventByRegistrations.title}{" "}
              <span className="text-[#b8941a] font-bold">
                ({overall.topEventByRegistrations.count} registrations)
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ── Per-Event Breakdown ──────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-[#888]" />
          <h3 className="text-lg font-semibold text-[#333]">Event Breakdown</h3>
        </div>
        <div className="rounded-xl border border-[#e0e0e0] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {!overall?.eventBreakdowns || overall.eventBreakdowns.length === 0 ? (
            <div className="py-12 text-center text-[#999] text-sm">
              No events yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#eee] bg-[#fafafa]">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                    Event
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                    Registrations
                  </th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                    Check-in %
                  </th>
                </tr>
              </thead>
              <tbody>
                {overall.eventBreakdowns.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-[#f0f0f0] last:border-0 hover:bg-[#fafafa] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#333]">
                        {event.title}
                      </div>
                      <div className="text-[11px] text-[#bbb]">
                        /{event.slug}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#666] text-xs">
                      {fmtDate(event.start_date)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${statusColors[event.status] ?? "text-[#888] bg-[#f5f5f5]"}`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-[#333] font-semibold tabular-nums">
                        {event.totalRegistrations}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-[#333] font-semibold tabular-nums">
                        {event.revenue > 0
                          ? fmtFullCurrency(event.revenue)
                          : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[#f0f0f0] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${event.checkInRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#666] tabular-nums w-8 text-right">
                          {event.checkInRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Ticket Breakdown + Revenue Chart ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Tier Breakdown */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Ticket size={18} className="text-[#888]" />
            <h3 className="text-lg font-semibold text-[#333]">
              Ticket Tiers
              <span className="text-xs text-[#aaa] font-normal ml-2">
                (Latest Event)
              </span>
            </h3>
          </div>
          <div className="rounded-xl border border-[#e0e0e0] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {!eventStats?.ticketBreakdown ||
            eventStats.ticketBreakdown.length === 0 ? (
              <div className="py-10 text-center text-[#999] text-sm">
                No ticket tiers configured
              </div>
            ) : (
              <div className="divide-y divide-[#f0f0f0]">
                {eventStats.ticketBreakdown.map((t) => {
                  const pct =
                    t.limit > 0 ? Math.round((t.sold / t.limit) * 100) : 0
                  return (
                    <div
                      key={t.id}
                      className="px-5 py-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-[#333]">
                            {t.name}
                          </span>
                          <span className="text-xs text-[#888] tabular-nums">
                            {t.sold} / {t.limit} sold
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#f0f0f0] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[11px] text-[#aaa]">
                            ₹{new Intl.NumberFormat("en-IN").format(t.price_inr)}{" "}
                            / ticket
                          </span>
                          <span className="text-[11px] text-[#aaa] tabular-nums">
                            {t.revenue > 0
                              ? `Revenue: ${fmtFullCurrency(t.revenue)}`
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Revenue by Day */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-[#888]" />
            <h3 className="text-lg font-semibold text-[#333]">
              Revenue by Day
              <span className="text-xs text-[#aaa] font-normal ml-2">
                (Latest Event)
              </span>
            </h3>
          </div>
          <div className="rounded-xl border border-[#e0e0e0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {!eventStats?.revenueByDay ||
            eventStats.revenueByDay.length === 0 ? (
              <div className="py-10 text-center text-[#999] text-sm">
                No revenue data yet
              </div>
            ) : (
              <div>
                {/* Simple bar chart */}
                <div className="flex items-end gap-1.5 h-40 mb-4">
                  {(() => {
                    const maxRevenue = Math.max(
                      ...eventStats.revenueByDay.map((d) => d.revenue),
                      1
                    )
                    return eventStats.revenueByDay.map((day) => {
                      const heightPct = (day.revenue / maxRevenue) * 100
                      return (
                        <div
                          key={day.date}
                          className="flex-1 flex flex-col items-center justify-end h-full group"
                        >
                          {/* Tooltip on hover */}
                          <div className="relative">
                            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-[#333] text-white text-[10px] whitespace-nowrap z-10 shadow-lg">
                              <div className="font-semibold">
                                {fmtFullCurrency(day.revenue)}
                              </div>
                              <div className="text-white/60">
                                {day.count} registration
                                {day.count !== 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>
                          <div
                            className="w-full rounded-t-md bg-[#e7ab1c]/70 hover:bg-[#e7ab1c] transition-colors cursor-default min-h-[4px]"
                            style={{ height: `${Math.max(heightPct, 3)}%` }}
                          />
                        </div>
                      )
                    })
                  })()}
                </div>
                {/* X-axis labels */}
                <div className="flex gap-1.5">
                  {eventStats.revenueByDay.map((day) => (
                    <div
                      key={day.date}
                      className="flex-1 text-center text-[9px] text-[#aaa] truncate"
                    >
                      {fmtShortDate(day.date)}
                    </div>
                  ))}
                </div>
                {/* Summary */}
                <div className="mt-4 pt-4 border-t border-[#f0f0f0] flex items-center justify-between">
                  <span className="text-xs text-[#888]">
                    {eventStats.revenueByDay.length} day
                    {eventStats.revenueByDay.length !== 1 ? "s" : ""} of sales
                  </span>
                  <span className="text-xs font-semibold text-[#333]">
                    Total:{" "}
                    {fmtFullCurrency(
                      eventStats.revenueByDay.reduce(
                        (sum, d) => sum + d.revenue,
                        0
                      )
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
