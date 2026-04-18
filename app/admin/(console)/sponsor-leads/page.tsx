"use client"

/**
 * ─── ADMIN: SPONSOR LEAD CAPTURE ────────────────────────────────────────────
 *
 * Overview of leads captured by sponsors at their event booths (via QR /
 * badge scan / manual entry). Distinct from the CRM pipeline at
 * `/admin/leads`, which covers federation-wide prospects.
 *
 * Filterable by event. Includes interest-level stats and CSV export.
 */

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import {
  getAllLeads,
  getAllLeadStats,
  exportAllLeadsCSV,
  updateLead,
} from "@/app/actions/leadCaptureActions"
import {
  Search,
  Download,
  Loader2,
  ScanLine,
  Flame,
  ChevronDown,
  Users,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EventOption {
  id: string
  title: string
}

interface LeadRow {
  id: string
  sponsor_id: string
  event_id: string
  attendee_id: string | null
  lead_name: string
  lead_email: string | null
  lead_phone: string | null
  lead_company: string | null
  lead_designation: string | null
  notes: string | null
  interest_level: string
  captured_via: string
  captured_at: string
  follow_up_status: string
  follow_up_notes: string | null
  sponsors: { name: string; tier: string; logo_url: string | null } | null
}

interface Stats {
  total: number
  byInterest: Record<string, number>
  byStatus: Record<string, number>
  byCapturedVia: Record<string, number>
}

const INTEREST_BADGE: Record<string, { bg: string; text: string }> = {
  hot:    { bg: "bg-red-100",    text: "text-red-700"    },
  warm:   { bg: "bg-orange-100", text: "text-orange-700" },
  medium: { bg: "bg-blue-100",   text: "text-blue-700"   },
  cold:   { bg: "bg-gray-100",   text: "text-gray-600"   },
}

const FOLLOW_UP_OPTIONS = [
  { value: "pending",        label: "Pending" },
  { value: "contacted",      label: "Contacted" },
  { value: "meeting_set",    label: "Meeting Set" },
  { value: "closed",         label: "Closed" },
  { value: "not_interested", label: "Not Interested" },
] as const

export default function AdminSponsorLeadsPage() {
  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [interestFilter, setInterestFilter] = useState("")
  const [exporting, setExporting] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function fetchEvents() {
      const { data } = await supabase
        .from("events")
        .select("id, title")
        .order("start_date", { ascending: false })
      if (data) {
        setEvents(data)
        if (data.length > 0) setSelectedEventId(data[0].id)
      }
    }
    fetchEvents()
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const eventFilter = selectedEventId || undefined
    const [leadsResult, statsResult] = await Promise.all([
      getAllLeads(eventFilter),
      getAllLeadStats(eventFilter),
    ])

    if (leadsResult.success) setLeads(leadsResult.leads as LeadRow[])
    if (statsResult.success && statsResult.stats) setStats(statsResult.stats)
    setLoading(false)
  }, [selectedEventId])

  useEffect(() => {
    if (selectedEventId || events.length === 0) fetchData()
  }, [selectedEventId, fetchData])

  const filtered = leads.filter((l) => {
    const matchesSearch =
      !searchQuery ||
      l.lead_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.lead_company ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.sponsors?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.lead_email ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesInterest = !interestFilter || l.interest_level === interestFilter
    return matchesSearch && matchesInterest
  })

  async function handleExport() {
    setExporting(true)
    const result = await exportAllLeadsCSV(selectedEventId || undefined)
    if (result.success && result.csv) {
      const blob = new Blob([result.csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sponsor-leads-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
    setExporting(false)
  }

  async function handleFollowUpChange(leadId: string, status: string) {
    setUpdatingId(leadId)
    await updateLead(leadId, { followUpStatus: status })
    await fetchData()
    setUpdatingId(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-gray-400 mb-2">
            CRM · Sponsor booth capture
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#1a1a2e] tracking-tight">
            Sponsor leads
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Leads captured by sponsors at their event booths. For federation-wide
            prospects, use <b>Leads</b>.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || leads.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c9a84c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-40 transition-colors"
        >
          {exporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          Export CSV
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total Leads" value={stats.total} icon={Users} />
          <StatCard label="Hot"    value={stats.byInterest.hot ?? 0}    color="text-red-600"    bgColor="bg-red-50" />
          <StatCard label="Warm"   value={stats.byInterest.warm ?? 0}   color="text-orange-600" bgColor="bg-orange-50" />
          <StatCard label="Medium" value={stats.byInterest.medium ?? 0} color="text-blue-600"   bgColor="bg-blue-50" />
          <StatCard label="Cold"   value={stats.byInterest.cold ?? 0}   color="text-gray-500"   bgColor="bg-gray-50" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc] transition-colors"
          >
            <option value="">All Events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#aaa] pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={interestFilter}
            onChange={(e) => setInterestFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc] transition-colors"
          >
            <option value="">All Interest Levels</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="medium">Medium</option>
            <option value="cold">Cold</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#aaa] pointer-events-none" />
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#aaa] focus:outline-none focus:border-[#ccc] transition-colors"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#aaa] gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading leads...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Flame size={32} className="mx-auto mb-3 text-[#ccc]" />
            <p className="text-[#999] text-sm">
              {searchQuery || interestFilter
                ? "No leads match your filters."
                : "No leads captured yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Lead</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Company</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Sponsor</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Interest</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Captured Via</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Follow-up</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => {
                  const badge = INTEREST_BADGE[lead.interest_level] ?? INTEREST_BADGE.medium
                  return (
                    <tr key={lead.id} className="border-b border-[#eee] last:border-0 hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-[#333]">{lead.lead_name}</div>
                        {lead.lead_email && (
                          <div className="text-[11px] text-[#aaa] mt-0.5">{lead.lead_email}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[#777] text-xs">{lead.lead_company ?? "--"}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {lead.sponsors?.logo_url ? (
                            <img src={lead.sponsors.logo_url} alt="" className="w-6 h-6 rounded object-contain bg-gray-50" />
                          ) : (
                            <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                              <Building2 size={12} className="text-[#ccc]" />
                            </div>
                          )}
                          <span className="text-[#555] text-xs">{lead.sponsors?.name ?? "--"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider", badge.bg, badge.text)}>
                          {lead.interest_level}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#777] text-xs">
                        <div className="flex items-center gap-1.5 capitalize">
                          {lead.captured_via === "qr_scan" && <ScanLine size={12} className="text-[#c9a84c]" />}
                          {lead.captured_via.replace("_", " ")}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={lead.follow_up_status}
                          onChange={(e) => handleFollowUpChange(lead.id, e.target.value)}
                          disabled={updatingId === lead.id}
                          className="px-2 py-1.5 bg-[#fafafa] border border-[#e0e0e0] rounded text-[11px] text-[#555] focus:outline-none focus:border-[#ccc] disabled:opacity-50 transition-colors"
                        >
                          {FOLLOW_UP_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4 text-[#999] text-xs whitespace-nowrap">
                        {new Date(lead.captured_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label, value, icon: Icon, color, bgColor,
}: {
  label: string
  value: number
  icon?: React.FC<{ size: number; className?: string }>
  color?: string
  bgColor?: string
}) {
  return (
    <div className={cn("rounded-xl border border-[#e0e0e0] p-4", bgColor ?? "bg-white")}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-[#888] uppercase tracking-wider font-semibold">{label}</span>
        {Icon && <Icon size={16} className="text-[#ccc]" />}
      </div>
      <p className={cn("text-2xl font-bold", color ?? "text-[#333]")}>{value}</p>
    </div>
  )
}
