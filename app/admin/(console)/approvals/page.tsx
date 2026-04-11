"use client"

/**
 * ─── REGISTRATION APPROVALS PAGE ───────────────────────────────────────
 *
 * Admin page for managing registrations that require approval.
 * Shows pending approvals with options to approve/reject individually
 * or in bulk. Filter by event.
 */

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import {
  approveRegistration,
  rejectRegistration,
  bulkApprove,
} from "@/app/actions/approvalActions"
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  X,
  ShieldCheck,
  AlertCircle,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PendingAttendee {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  designation: string | null
  event_id: string
  ticket_id: string | null
  created_at: string
  events: { id: string; title: string } | null
  tickets: { id: string; name: string } | null
}

interface EventOption {
  id: string
  title: string
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function ApprovalsPage() {
  const [approvals, setApprovals]     = useState<PendingAttendee[]>([])
  const [loading, setLoading]         = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [eventFilter, setEventFilter] = useState("")
  const [events, setEvents]           = useState<EventOption[]>([])
  const [actionError, setActionError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set())
  const [bulkProcessing, setBulkProcessing] = useState(false)

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectingId, setRejectingId]         = useState<string | null>(null)
  const [rejectReason, setRejectReason]       = useState("")

  const supabase = createClient()

  const fetchApprovals = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from("attendees")
      .select("*, events(id, title), tickets(id, name)")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false })

    if (eventFilter) {
      query = query.eq("event_id", eventFilter)
    }

    const { data } = await query
    if (data) setApprovals(data)
    setLoading(false)
  }, [eventFilter])

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title")
      .eq("requires_approval", true)
      .order("start_date", { ascending: false })
    if (data) setEvents(data)
  }, [])

  useEffect(() => { fetchApprovals() }, [fetchApprovals])
  useEffect(() => { fetchEvents() }, [fetchEvents])

  const filtered = approvals.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.company ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleApprove(id: string) {
    setProcessingId(id)
    setActionError(null)
    const result = await approveRegistration(id)
    if (result.success) {
      await fetchApprovals()
    } else {
      setActionError(result.error ?? "Failed to approve")
    }
    setProcessingId(null)
  }

  function openRejectModal(id: string) {
    setRejectingId(id)
    setRejectReason("")
    setRejectModalOpen(true)
  }

  async function handleReject() {
    if (!rejectingId) return
    setProcessingId(rejectingId)
    setActionError(null)
    const result = await rejectRegistration(rejectingId, rejectReason)
    if (result.success) {
      setRejectModalOpen(false)
      setRejectingId(null)
      setRejectReason("")
      await fetchApprovals()
    } else {
      setActionError(result.error ?? "Failed to reject")
    }
    setProcessingId(null)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(a => a.id)))
    }
  }

  async function handleBulkApprove() {
    if (selectedIds.size === 0) return
    setBulkProcessing(true)
    setActionError(null)
    const result = await bulkApprove(Array.from(selectedIds))
    if (result.success) {
      setSelectedIds(new Set())
      await fetchApprovals()
    } else {
      setActionError(result.error ?? "Bulk approve failed")
    }
    setBulkProcessing(false)
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-[#333]">Approvals</h2>
            {approvals.length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[11px] font-bold">
                {approvals.length} pending
              </span>
            )}
          </div>
          <p className="text-sm text-[#888]">
            Review and approve registrations for events that require approval
          </p>
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkApprove}
            disabled={bulkProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            {bulkProcessing ? (
              <><Loader2 size={14} className="animate-spin" /> Approving...</>
            ) : (
              <><CheckCircle2 size={14} /> Approve {selectedIds.size} Selected</>
            )}
          </button>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="">All Events</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {actionError && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#aaa] gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading approvals...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <ShieldCheck size={32} className="mx-auto mb-3 text-[#ccc]" />
            <p className="text-[#999] text-sm">
              {searchQuery || eventFilter
                ? "No pending approvals match your search."
                : "No pending approvals. All clear!"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-white">
                <th className="text-left px-5 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-[#e0e0e0] text-[#c9a84c] focus:ring-[#c9a84c]/50"
                  />
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                  Event
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                  Ticket
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                  Registered
                </th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-[#eee] last:border-0 hover:bg-[#fafafa] transition-colors"
                >
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(a.id)}
                      onChange={() => toggleSelect(a.id)}
                      className="w-4 h-4 rounded border-[#e0e0e0] text-[#c9a84c] focus:ring-[#c9a84c]/50"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-[#333]">{a.name}</div>
                    {(a.company || a.designation) && (
                      <div className="text-[11px] text-[#aaa] mt-0.5">
                        {a.designation}{a.designation && a.company ? ", " : ""}{a.company}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-[#777]">{a.email}</td>
                  <td className="px-5 py-4 text-[#777] text-xs">
                    {a.events?.title ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-[#777] text-xs">
                    {a.tickets?.name ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-[#777] text-xs whitespace-nowrap">
                    {fmtDate(a.created_at)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleApprove(a.id)}
                        disabled={processingId === a.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors disabled:opacity-30"
                        title="Approve"
                      >
                        {processingId === a.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={12} />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(a.id)}
                        disabled={processingId === a.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-30"
                        title="Reject"
                      >
                        <XCircle size={12} />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-[#1a1a2e]/60 z-40"
            onClick={() => { setRejectModalOpen(false); setRejectingId(null) }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-[#e0e0e0] shadow-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-[#e0e0e0] flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#333] flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-400" />
                  Reject Registration
                </h3>
                <button
                  onClick={() => { setRejectModalOpen(false); setRejectingId(null) }}
                  className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                    Reason for Rejection
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    placeholder="Optional: Provide a reason for rejection..."
                    className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-red-400/50 transition-colors resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setRejectModalOpen(false); setRejectingId(null) }}
                    className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processingId === rejectingId}
                    className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {processingId === rejectingId ? (
                      <><Loader2 size={14} className="animate-spin" /> Rejecting...</>
                    ) : (
                      <><XCircle size={14} /> Reject Registration</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
