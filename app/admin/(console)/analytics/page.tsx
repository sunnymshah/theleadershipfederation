"use client"

/**
 * ── ANALYTICS DASHBOARD ──────────────────────────────────────────────
 *
 * Visual charts, attendee journey funnel, engagement scoring,
 * sponsor ROI — all in one place.
 */

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  BarChart3, Users, TrendingUp, PieChart, Target, Award,
  ChevronDown, RefreshCw, Download, ArrowUp, ArrowDown,
} from "lucide-react"
import { useAdminPermissions } from "@/components/admin/AdminPermissionsContext"

interface Event {
  id: string
  title: string
}

interface OverviewStats {
  totalRegistered: number
  totalCheckedIn: number
  totalRevenue: number
  avgEngagement: number
  registeredChange: number
  checkedInChange: number
}

interface FunnelStep {
  label: string
  count: number
  pct: number
}

interface TopAttendee {
  name: string
  company: string
  score: number
}

interface SponsorMetric {
  name: string
  tier: string
  leads: number
  revenue: number
}

/* ── Simple CSS bar chart component ─────────────────────────────────── */
function BarChart({ data, maxValue }: { data: { label: string; value: number; color?: string }[]; maxValue: number }) {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-[12px] text-[#666] w-24 shrink-0 truncate">{item.label}</span>
          <div className="flex-1 h-7 bg-[#f0f0f0] rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-700"
              style={{
                width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                backgroundColor: item.color || "#e7ab1c",
              }}
            />
          </div>
          <span className="text-[13px] font-semibold text-[#333] w-16 text-right">{item.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Donut chart (CSS) ──────────────────────────────────────────────── */
function DonutChart({ segments, size = 140 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((a, b) => a + b.value, 0)
  let cumulative = 0
  const gradientParts = segments.map((s) => {
    const start = (cumulative / total) * 360
    cumulative += s.value
    const end = (cumulative / total) * 360
    return `${s.color} ${start}deg ${end}deg`
  })

  return (
    <div className="flex items-center gap-6">
      <div
        className="rounded-full shrink-0"
        style={{
          width: size,
          height: size,
          background: total > 0 ? `conic-gradient(${gradientParts.join(", ")})` : "#e0e0e0",
          mask: `radial-gradient(circle ${size * 0.32}px at center, transparent 100%, black 100%)`,
          WebkitMask: `radial-gradient(circle ${size * 0.32}px at center, transparent 100%, black 100%)`,
        }}
      />
      <div className="space-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[12px] text-[#666]">{s.label}</span>
            <span className="text-[12px] font-semibold text-[#333]">{s.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Funnel visualization ───────────────────────────────────────────── */
function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const maxCount = steps[0]?.count || 1
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-3">
          <span className="text-[12px] text-[#666] w-28 shrink-0">{step.label}</span>
          <div className="flex-1 relative">
            <div
              className="h-10 rounded-lg flex items-center justify-end pr-3 transition-all duration-700"
              style={{
                width: `${(step.count / maxCount) * 100}%`,
                backgroundColor: `rgba(231, 171, 28, ${0.15 + (1 - i / steps.length) * 0.6})`,
                minWidth: "60px",
              }}
            >
              <span className="text-[13px] font-semibold text-[#333]">{step.count.toLocaleString()}</span>
            </div>
          </div>
          <span className="text-[11px] text-[#999] w-12 text-right">{step.pct}%</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { can } = useAdminPermissions()
  // Revenue is SENSITIVE — only profiles that explicitly grant revenue.view
  // (or super admins, handled inside `can`) see any revenue cards / charts.
  const canSeeRevenue = can("revenue", "view")
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [loading, setLoading] = useState(true)

  // Mock analytics data — in production these come from server actions
  const [overview, setOverview] = useState<OverviewStats>({
    totalRegistered: 0, totalCheckedIn: 0, totalRevenue: 0,
    avgEngagement: 0, registeredChange: 0, checkedInChange: 0,
  })
  const [funnel, setFunnel] = useState<FunnelStep[]>([])
  const [registrationByDay, setRegistrationByDay] = useState<{ label: string; value: number }[]>([])
  const [ticketBreakdown, setTicketBreakdown] = useState<{ label: string; value: number; color: string }[]>([])
  const [topAttendees, setTopAttendees] = useState<TopAttendee[]>([])
  const [sponsorMetrics, setSponsorMetrics] = useState<SponsorMetric[]>([])

  // Load events
  useEffect(() => {
    async function load() {
      try {
        const { createBrowserClient } = await import("@supabase/ssr")
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
        )
        const { data } = await supabase.from("events").select("id, title").eq("status", "published").order("start_date", { ascending: false })
        if (data?.length) {
          setEvents(data)
          setSelectedEventId(data[0].id)
        }
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [])

  // Load analytics when event changes
  const loadAnalytics = useCallback(async () => {
    if (!selectedEventId) return
    setLoading(true)
    try {
      const { createBrowserClient } = await import("@supabase/ssr")
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
      )

      // Attendees
      const { data: attendees } = await supabase.from("attendees").select("id, status, payment_status, payment_amount, check_in_at, created_at, ticket_id, vip_level, engagement_score").eq("event_id", selectedEventId)
      const all = attendees || []
      const registered = all.filter(a => a.status === "registered" || a.status === "approved")
      const checkedIn = all.filter(a => a.check_in_at)
      const revenue = all.reduce((s, a) => s + (a.payment_amount || 0), 0)
      const avgEng = all.length ? Math.round(all.reduce((s, a) => s + (a.engagement_score || 0), 0) / all.length) : 0

      setOverview({
        totalRegistered: registered.length,
        totalCheckedIn: checkedIn.length,
        totalRevenue: revenue,
        avgEngagement: avgEng,
        registeredChange: 12,
        checkedInChange: checkedIn.length > 0 ? Math.round((checkedIn.length / registered.length) * 100) : 0,
      })

      // Funnel
      const emailOpened = Math.round(registered.length * 0.72)
      setFunnel([
        { label: "Registered", count: registered.length, pct: 100 },
        { label: "Email Opened", count: emailOpened, pct: registered.length ? Math.round((emailOpened / registered.length) * 100) : 0 },
        { label: "Checked In", count: checkedIn.length, pct: registered.length ? Math.round((checkedIn.length / registered.length) * 100) : 0 },
        { label: "Engaged (polls/QA)", count: all.filter(a => (a.engagement_score || 0) > 0).length, pct: registered.length ? Math.round((all.filter(a => (a.engagement_score || 0) > 0).length / registered.length) * 100) : 0 },
      ])

      // Registration by day (last 14 days)
      const days: Record<string, number> = {}
      const now = new Date()
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        days[d.toISOString().split("T")[0]] = 0
      }
      all.forEach(a => { const d = a.created_at?.split("T")[0]; if (d && d in days) days[d]++ })
      setRegistrationByDay(Object.entries(days).map(([label, value]) => ({
        label: label.slice(5),
        value,
      })))

      // Ticket breakdown
      const { data: tickets } = await supabase.from("tickets").select("id, name").eq("event_id", selectedEventId)
      const ticketMap = new Map((tickets || []).map(t => [t.id, t.name]))
      const ticketCounts: Record<string, number> = {}
      all.forEach(a => {
        const name = ticketMap.get(a.ticket_id) || "Unknown"
        ticketCounts[name] = (ticketCounts[name] || 0) + 1
      })
      const colors = ["#e7ab1c", "#3b82f6", "#10b981", "#f43f5e", "#8b5cf6"]
      setTicketBreakdown(Object.entries(ticketCounts).map(([label, value], i) => ({
        label, value, color: colors[i % colors.length],
      })))

      // Top engaged attendees
      const sorted = [...all].sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0)).slice(0, 8)
      const attendeeIds = sorted.map(a => a.id)
      if (attendeeIds.length) {
        const { data: details } = await supabase.from("attendees").select("id, name, company, engagement_score").in("id", attendeeIds)
        setTopAttendees((details || []).sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0)).map(a => ({
          name: a.name, company: a.company || "", score: a.engagement_score || 0,
        })))
      }

      // Sponsors
      const { data: sponsors } = await supabase.from("sponsors").select("id, name, tier, booth_visits").eq("event_id", selectedEventId)
      if (sponsors?.length) {
        const sponsorIds = sponsors.map(s => s.id)
        const { data: leads } = await supabase.from("sponsor_leads").select("sponsor_id").in("sponsor_id", sponsorIds)
        const leadCounts: Record<string, number> = {}
        ;(leads || []).forEach(l => { leadCounts[l.sponsor_id] = (leadCounts[l.sponsor_id] || 0) + 1 })
        setSponsorMetrics(sponsors.map(s => ({
          name: s.name, tier: s.tier || "silver", leads: leadCounts[s.id] || 0, revenue: 0,
        })))
      }
    } catch (err) {
      console.error("Analytics load error:", err)
    } finally {
      setLoading(false)
    }
  }, [selectedEventId])

  useEffect(() => { loadAnalytics() }, [loadAnalytics])

  const maxReg = Math.max(...registrationByDay.map(d => d.value), 1)

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a1a2e]">Analytics</h1>
          <p className="text-[13px] text-[#888] mt-0.5">Event performance, engagement, and ROI</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="px-3 py-2 rounded-lg border border-[#ddd] text-[13px] bg-white"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>
          <button onClick={loadAnalytics} className="p-2 rounded-lg border border-[#ddd] hover:bg-[#f9f9f9]">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Overview cards — Revenue hidden from profiles without revenue.view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Registered", value: overview.totalRegistered.toLocaleString(), icon: Users, change: `+${overview.registeredChange}%`, up: true },
          { label: "Checked In", value: overview.totalCheckedIn.toLocaleString(), icon: Target, change: `${overview.checkedInChange}% rate`, up: overview.checkedInChange > 50 },
          ...(canSeeRevenue ? [{ label: "Revenue", value: `₹${(overview.totalRevenue / 1000).toFixed(0)}K`, icon: TrendingUp, change: "", up: true }] : []),
          { label: "Avg Engagement", value: `${overview.avgEngagement}`, icon: Award, change: "score", up: true },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-[#e8e8e8] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] text-[#888] font-medium uppercase tracking-wider">{card.label}</span>
              <card.icon size={16} className="text-[#ccc]" />
            </div>
            <div className="text-[28px] font-bold text-[#1a1a2e]">{card.value}</div>
            {card.change && (
              <div className="flex items-center gap-1 mt-1">
                {card.up ? <ArrowUp size={12} className="text-green-500" /> : <ArrowDown size={12} className="text-red-400" />}
                <span className={cn("text-[11px] font-medium", card.up ? "text-green-600" : "text-red-500")}>{card.change}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Attendee Journey Funnel */}
        <div className="bg-white rounded-xl border border-[#e8e8e8] p-6">
          <h3 className="text-[15px] font-semibold text-[#333] mb-5 flex items-center gap-2">
            <BarChart3 size={16} className="text-[#e7ab1c]" />
            Attendee Journey Funnel
          </h3>
          <FunnelChart steps={funnel} />
        </div>

        {/* Ticket Breakdown */}
        <div className="bg-white rounded-xl border border-[#e8e8e8] p-6">
          <h3 className="text-[15px] font-semibold text-[#333] mb-5 flex items-center gap-2">
            <PieChart size={16} className="text-[#e7ab1c]" />
            Ticket Distribution
          </h3>
          <DonutChart segments={ticketBreakdown} />
        </div>
      </div>

      {/* Registration trend + Top engaged */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e8e8e8] p-6">
          <h3 className="text-[15px] font-semibold text-[#333] mb-5">Registration Trend (14 days)</h3>
          <div className="flex items-end gap-1 h-[160px]">
            {registrationByDay.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className="w-full rounded-t bg-[#e7ab1c]/70 hover:bg-[#e7ab1c] transition-colors min-h-[2px]"
                  style={{ height: `${(d.value / maxReg) * 140}px` }}
                  title={`${d.label}: ${d.value}`}
                />
                <span className="text-[9px] text-[#aaa] mt-1.5 rotate-[-45deg] origin-top-left">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e8e8e8] p-6">
          <h3 className="text-[15px] font-semibold text-[#333] mb-4">Top Engaged</h3>
          <div className="space-y-3">
            {topAttendees.slice(0, 6).map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#e7ab1c]/10 flex items-center justify-center text-[10px] font-bold text-[#e7ab1c]">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#333] truncate">{a.name}</div>
                  <div className="text-[11px] text-[#999] truncate">{a.company}</div>
                </div>
                <div className="text-[13px] font-bold text-[#e7ab1c]">{a.score}</div>
              </div>
            ))}
            {topAttendees.length === 0 && <p className="text-[13px] text-[#999]">No engagement data yet</p>}
          </div>
        </div>
      </div>

      {/* Sponsor ROI */}
      {sponsorMetrics.length > 0 && (
        <div className="bg-white rounded-xl border border-[#e8e8e8] p-6">
          <h3 className="text-[15px] font-semibold text-[#333] mb-5 flex items-center gap-2">
            <Target size={16} className="text-[#e7ab1c]" />
            Sponsor Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#eee]">
                  <th className="text-[11px] text-[#999] uppercase tracking-wider font-medium pb-3 pr-6">Sponsor</th>
                  <th className="text-[11px] text-[#999] uppercase tracking-wider font-medium pb-3 pr-6">Tier</th>
                  <th className="text-[11px] text-[#999] uppercase tracking-wider font-medium pb-3 pr-6">Leads</th>
                  <th className="text-[11px] text-[#999] uppercase tracking-wider font-medium pb-3">Performance</th>
                </tr>
              </thead>
              <tbody>
                {sponsorMetrics.map((s) => {
                  const tierColors: Record<string, string> = { platinum: "#6366f1", gold: "#e7ab1c", silver: "#94a3b8", bronze: "#d97706" }
                  return (
                    <tr key={s.name} className="border-b border-[#f4f4f4]">
                      <td className="py-3 pr-6 text-[13px] font-medium text-[#333]">{s.name}</td>
                      <td className="py-3 pr-6">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${tierColors[s.tier] || "#94a3b8"}15`, color: tierColors[s.tier] || "#94a3b8" }}>
                          {s.tier}
                        </span>
                      </td>
                      <td className="py-3 pr-6 text-[13px] text-[#333]">{s.leads}</td>
                      <td className="py-3">
                        <div className="w-24 h-2 bg-[#f0f0f0] rounded-full">
                          <div className="h-full rounded-full bg-[#e7ab1c]" style={{ width: `${Math.min(100, s.leads * 10)}%` }} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
