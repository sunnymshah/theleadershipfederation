"use client"

/**
 * ─── ADMIN: REGISTRATIONS ────────────────────────────────────────────
 *
 * Multi-purpose registrations from the public /register form:
 * award nominations, delegates, sponsors, speakers, jury, membership.
 */

import { useState, useEffect, useCallback } from "react"
import {
  getRegistrations,
  updateRegistrationStatus,
} from "@/app/actions/registerActions"
import {
  UserPlus,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ExternalLink,
  Mail,
  Phone,
  Building2,
  Briefcase,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Registration {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  designation: string | null
  linkedin_url: string | null
  event_id: string | null
  participation_type:
    | "award_nomination"
    | "delegate"
    | "sponsor"
    | "speaker"
    | "jury"
    | "membership"
  message: string | null
  status: "pending" | "reviewed" | "accepted" | "rejected"
  created_at: string
  updated_at: string
  events?: { title: string; slug: string } | null
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  reviewed: "bg-blue-50 text-blue-700 border-blue-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
}

const TYPE_LABELS: Record<string, string> = {
  award_nomination: "Award Nomination",
  delegate: "Delegate",
  sponsor: "Sponsor",
  speaker: "Speaker",
  jury: "Jury",
  membership: "Membership",
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function AdminRegistrationsPage() {
  const [regs, setRegs] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Registration | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const filters: { status?: string; participation_type?: string } = {}
    if (statusFilter !== "all") filters.status = statusFilter
    if (typeFilter !== "all") filters.participation_type = typeFilter

    const res = await getRegistrations(filters)
    if (res.success && res.data) setRegs(res.data as Registration[])
    setLoading(false)
  }, [statusFilter, typeFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleStatusChange(
    id: string,
    status: "pending" | "reviewed" | "accepted" | "rejected"
  ) {
    setProcessingId(id)
    await updateRegistrationStatus(id, status)
    await fetchData()
    setProcessingId(null)
  }

  const filtered = regs.filter((r) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.company ?? "").toLowerCase().includes(q)
    )
  })

  const stats = {
    total: regs.length,
    pending: regs.filter((r) => r.status === "pending").length,
    accepted: regs.filter((r) => r.status === "accepted").length,
    rejected: regs.filter((r) => r.status === "rejected").length,
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserPlus size={22} className="text-[#e7ab1c]" />
          Registrations
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Award nominations, delegate sign-ups, sponsor interest, speaker applications, jury, and membership submissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, bg: "bg-gray-50", color: "text-gray-900" },
          { label: "Pending", value: stats.pending, bg: "bg-amber-50", color: "text-amber-700" },
          { label: "Accepted", value: stats.accepted, bg: "bg-emerald-50", color: "text-emerald-700" },
          { label: "Rejected", value: stats.rejected, bg: "bg-red-50", color: "text-red-700" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-xl border border-gray-200 px-4 py-3", s.bg)}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="award_nomination">Award Nomination</option>
            <option value="delegate">Delegate</option>
            <option value="sponsor">Sponsor</option>
            <option value="speaker">Speaker</option>
            <option value="jury">Jury</option>
            <option value="membership">Membership</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <UserPlus size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No registrations yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={r.id}
                  className={cn(
                    "transition-colors hover:bg-gray-50/50",
                    i < filtered.length - 1 && "border-b border-gray-100"
                  )}
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.email}</p>
                    {r.phone && <p className="text-xs text-gray-400">{r.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-[#e7ab1c]/10 text-[#a37410]">
                      {TYPE_LABELS[r.participation_type] ?? r.participation_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{r.company ?? "—"}</p>
                    {r.designation && (
                      <p className="text-xs text-gray-400">{r.designation}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-600 max-w-[180px] truncate">
                      {r.events?.title ?? <span className="text-gray-300">—</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {fmtDate(r.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border capitalize",
                        STATUS_STYLES[r.status]
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {processingId === r.id ? (
                        <Loader2 size={16} className="animate-spin text-gray-400" />
                      ) : (
                        <>
                          <button
                            onClick={() => setSelected(r)}
                            title="View Details"
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                          {r.status !== "accepted" && (
                            <button
                              onClick={() => handleStatusChange(r.id, "accepted")}
                              title="Accept"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          {r.status !== "rejected" && (
                            <button
                              onClick={() => handleStatusChange(r.id, "rejected")}
                              title="Reject"
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                          {r.status !== "pending" && (
                            <button
                              onClick={() => handleStatusChange(r.id, "pending")}
                              title="Reset to Pending"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              <Clock size={16} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-base font-semibold text-gray-900">Registration Details</h3>
              <button
                onClick={() => setSelected(null)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-lg font-semibold text-gray-900">{selected.name}</p>
                <div className="mt-1 flex flex-col gap-1 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-2">
                    <Mail size={13} className="text-gray-400" /> {selected.email}
                  </span>
                  {selected.phone && (
                    <span className="inline-flex items-center gap-2">
                      <Phone size={13} className="text-gray-400" /> {selected.phone}
                    </span>
                  )}
                  {selected.company && (
                    <span className="inline-flex items-center gap-2">
                      <Building2 size={13} className="text-gray-400" /> {selected.company}
                    </span>
                  )}
                  {selected.designation && (
                    <span className="inline-flex items-center gap-2">
                      <Briefcase size={13} className="text-gray-400" /> {selected.designation}
                    </span>
                  )}
                  {selected.linkedin_url && (
                    <a
                      href={selected.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <ExternalLink size={13} /> LinkedIn Profile
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-[#e7ab1c]/10 text-[#a37410]">
                  {TYPE_LABELS[selected.participation_type]}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border capitalize",
                    STATUS_STYLES[selected.status]
                  )}
                >
                  {selected.status}
                </span>
              </div>

              {selected.events?.title && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Event
                  </p>
                  <p className="text-sm text-gray-700">{selected.events.title}</p>
                </div>
              )}

              {selected.message && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Message
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-100">
                    {selected.message}
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-400">
                Submitted {fmtDate(selected.created_at)}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                <a
                  href={`mailto:${selected.email}?subject=Your registration with The Leadership Federation`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-[#1a1a2e] text-white hover:bg-[#2a2a4e] transition-colors"
                >
                  <Mail size={14} /> Email Applicant
                </a>
                {selected.status !== "accepted" && (
                  <button
                    onClick={async () => {
                      await handleStatusChange(selected.id, "accepted")
                      setSelected(null)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 size={14} /> Accept
                  </button>
                )}
                {selected.status !== "rejected" && (
                  <button
                    onClick={async () => {
                      await handleStatusChange(selected.id, "rejected")
                      setSelected(null)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
