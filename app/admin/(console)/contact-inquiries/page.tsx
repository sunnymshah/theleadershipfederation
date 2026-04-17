"use client"

/**
 * ─── ADMIN: CONTACT INQUIRIES (MESSAGES) ─────────────────────────────
 *
 * View and triage contact form submissions from the website.
 */

import { useState, useEffect, useCallback } from "react"
import {
  getContactInquiries,
  updateInquiryStatus,
  replyToContactInquiry,
} from "@/app/actions/contactActions"
import {
  Inbox,
  Search,
  Filter,
  ChevronDown,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Clock,
  Loader2,
  CheckCircle2,
  MessageCircle,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Inquiry {
  id: string
  full_name: string
  email: string
  phone: string | null
  company: string | null
  designation: string | null
  inquiry_type: string
  message: string
  source_page: string | null
  status: "new" | "contacted" | "resolved"
  created_at: string
  updated_at: string
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AdminContactInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Inquiry | null>(null)
  // Reply-compose modal state
  const [replyTo, setReplyTo] = useState<Inquiry | null>(null)
  const [replySubject, setReplySubject] = useState("")
  const [replyBody, setReplyBody] = useState("")
  const [replySending, setReplySending] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)
  const [replySent, setReplySent] = useState(false)

  function openReply(inq: Inquiry) {
    setReplyTo(inq)
    setReplySubject(`Re: Your inquiry to The Leadership Federation — ${inq.inquiry_type}`)
    setReplyBody(
      `Hi ${inq.full_name.split(" ")[0] || inq.full_name},\n\nThank you for reaching out to us regarding ${inq.inquiry_type}. \n\n[Write your reply here]\n\nLooking forward to speaking with you.`,
    )
    setReplyError(null)
    setReplySent(false)
  }

  async function sendReply() {
    if (!replyTo) return
    if (!replySubject.trim() || !replyBody.trim()) {
      setReplyError("Subject and body are required.")
      return
    }
    setReplySending(true)
    setReplyError(null)
    const res = await replyToContactInquiry(replyTo.id, replySubject.trim(), replyBody.trim())
    setReplySending(false)
    if (res.success) {
      setReplySent(true)
      await fetchData()
      // Auto-close after a moment
      setTimeout(() => {
        setReplyTo(null)
        setSelected(null)
      }, 1200)
    } else {
      setReplyError(res.error ?? "Failed to send email")
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await getContactInquiries({ status: statusFilter })
    if (res.success) setInquiries(res.data as Inquiry[])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleStatusChange(
    id: string,
    status: "new" | "contacted" | "resolved"
  ) {
    setProcessingId(id)
    await updateInquiryStatus(id, status)
    await fetchData()
    setProcessingId(null)
  }

  const filtered = inquiries.filter((i) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      i.full_name.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      (i.company ?? "").toLowerCase().includes(q) ||
      i.message.toLowerCase().includes(q)
    )
  })

  const stats = {
    total: inquiries.length,
    new: inquiries.filter((i) => i.status === "new").length,
    contacted: inquiries.filter((i) => i.status === "contacted").length,
    resolved: inquiries.filter((i) => i.status === "resolved").length,
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Inbox size={22} className="text-[#e7ab1c]" />
          Contact Inquiries
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Messages submitted through the website contact form
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, bg: "bg-gray-50", color: "text-gray-900" },
          { label: "New", value: stats.new, bg: "bg-blue-50", color: "text-blue-700" },
          { label: "Contacted", value: stats.contacted, bg: "bg-amber-50", color: "text-amber-700" },
          { label: "Resolved", value: stats.resolved, bg: "bg-emerald-50", color: "text-emerald-700" },
        ].map((s) => (
          <div
            key={s.label}
            className={cn("rounded-xl border border-gray-200 px-4 py-3", s.bg)}
          >
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="resolved">Resolved</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Inbox size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No inquiries yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">From</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Received</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inq, i) => (
                <tr
                  key={inq.id}
                  className={cn(
                    "transition-colors hover:bg-gray-50/50 cursor-pointer",
                    i < filtered.length - 1 && "border-b border-gray-100"
                  )}
                  onClick={() => setSelected(inq)}
                >
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="text-sm font-medium text-gray-900">{inq.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{inq.email}</p>
                    {inq.company && (
                      <p className="text-xs text-gray-400 truncate">{inq.company}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-[#e7ab1c]/10 text-[#a37410] capitalize">
                      {inq.inquiry_type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[300px]">
                    <p className="text-xs text-gray-600 line-clamp-2">{inq.message}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {fmtDate(inq.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border capitalize",
                        STATUS_STYLES[inq.status]
                      )}
                    >
                      {inq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {processingId === inq.id ? (
                        <Loader2 size={16} className="animate-spin text-gray-400" />
                      ) : (
                        <>
                          <button
                            onClick={() => openReply(inq)}
                            title="Reply via email (send through Resend)"
                            className="p-1.5 rounded-lg text-[#1a1a2e] hover:bg-gray-100 transition-colors"
                          >
                            <Mail size={16} />
                          </button>
                          {inq.status !== "contacted" && (
                            <button
                              onClick={() => handleStatusChange(inq.id, "contacted")}
                              title="Mark Contacted"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              <MessageCircle size={16} />
                            </button>
                          )}
                          {inq.status !== "resolved" && (
                            <button
                              onClick={() => handleStatusChange(inq.id, "resolved")}
                              title="Mark Resolved"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          {inq.status !== "new" && (
                            <button
                              onClick={() => handleStatusChange(inq.id, "new")}
                              title="Reset to New"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
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
              <h3 className="text-base font-semibold text-gray-900">Inquiry Details</h3>
              <button
                onClick={() => setSelected(null)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-lg font-semibold text-gray-900">{selected.full_name}</p>
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
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-md bg-[#e7ab1c]/10 text-[#a37410] capitalize">
                  {selected.inquiry_type.replace(/_/g, " ")}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border capitalize",
                    STATUS_STYLES[selected.status]
                  )}
                >
                  {selected.status}
                </span>
                {selected.source_page && (
                  <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600">
                    via {selected.source_page}
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Message
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-100">
                  {selected.message}
                </p>
              </div>

              <p className="text-xs text-gray-400">
                Received {fmtDate(selected.created_at)}
              </p>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => openReply(selected)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-[#1a1a2e] text-white hover:bg-[#2a2a4e] transition-colors"
                >
                  <Mail size={14} /> Reply via Email
                </button>
                <a
                  href={`mailto:${selected.email}?subject=Re: Your inquiry to The Leadership Federation`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  title="Open in your local mail client instead"
                >
                  Open in Mail app
                </a>
                {selected.status !== "resolved" && (
                  <button
                    onClick={async () => {
                      await handleStatusChange(selected.id, "resolved")
                      setSelected(null)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 size={14} /> Mark Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Compose Modal — real send via Resend (contactActions.ts) */}
      {replyTo && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-4"
          onClick={() => !replySending && setReplyTo(null)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Reply to {replyTo.full_name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Sent via Resend to {replyTo.email}</p>
              </div>
              <button
                onClick={() => !replySending && setReplyTo(null)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400"
                disabled={replySending}
              >
                <X size={18} />
              </button>
            </div>

            {replySent ? (
              <div className="p-8 text-center">
                <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-3" />
                <p className="text-sm font-semibold text-gray-900">Email sent</p>
                <p className="text-xs text-gray-500 mt-1">
                  The inquiry has been auto-moved to <span className="font-medium">Contacted</span>.
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    disabled={replySending}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Message
                  </label>
                  <textarea
                    rows={10}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    disabled={replySending}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 disabled:opacity-60 font-mono leading-relaxed"
                  />
                  <p className="text-[11px] text-gray-500 mt-2">
                    Office phone, email, and key contacts from <span className="font-medium">Contact CMS</span> are auto-appended to every reply — no hardcoded signature.
                  </p>
                </div>
                {replyError && (
                  <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                    {replyError}
                  </div>
                )}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setReplyTo(null)}
                    disabled={replySending}
                    className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendReply}
                    disabled={replySending}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-[#1a1a2e] text-white hover:bg-[#2a2a4e] transition-colors disabled:opacity-60"
                  >
                    {replySending ? (
                      <><Loader2 size={14} className="animate-spin" /> Sending…</>
                    ) : (
                      <><Mail size={14} /> Send Email</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
