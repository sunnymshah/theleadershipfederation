"use client"

/**
 * ─── ATTENDEE / CRM MANAGER (Zoho Backstage Replica) ────────────────────
 *
 * Event-scoped CRM: data table of all registrations/leads with inline
 * status management, check-in, search/filter, CSV export, and add lead.
 */

import { useState, useCallback, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { createAttendee, updateAttendee, checkInAttendee, deleteAttendee } from "@/app/actions/attendeeActions"
import {
  Plus, Pencil, Trash2, X, Loader2, Users, Search, Download,
  CheckCircle2, Clock, XCircle, AlertCircle, UserCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AttendeeRow {
  id: string
  event_id: string
  ticket_id: string | null
  name: string
  email: string
  phone: string | null
  company: string | null
  designation: string | null
  registration_date: string
  check_in_at: string | null
  status: string
  notes: string | null
  tickets?: { name: string } | null
}

interface TicketOption {
  id: string
  name: string
  price_inr: number
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: typeof CheckCircle2 }> = {
  registered:  { label: "Registered",  bg: "bg-blue-500/10",    text: "text-blue-400",    icon: Clock },
  confirmed:   { label: "Confirmed",   bg: "bg-emerald-500/10", text: "text-emerald-400", icon: CheckCircle2 },
  checked_in:  { label: "Checked In",  bg: "bg-[#c9a84c]/10",  text: "text-[#c9a84c]",   icon: UserCheck },
  cancelled:   { label: "Cancelled",   bg: "bg-red-500/10",     text: "text-red-400",     icon: XCircle },
  waitlisted:  { label: "Waitlisted",  bg: "bg-yellow-500/10",  text: "text-yellow-400",  icon: AlertCircle },
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function AttendeeManager({ eventId }: { eventId: string }) {
  const [attendees, setAttendees]   = useState<AttendeeRow[]>([])
  const [tickets, setTickets]       = useState<TicketOption[]>([])
  const [loading, setLoading]       = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing]       = useState<AttendeeRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [checkingInId, setCheckingInId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [attendeeRes, ticketRes] = await Promise.all([
      supabase
        .from("attendees")
        .select("*, tickets(name)")
        .eq("event_id", eventId)
        .order("registration_date", { ascending: false }),
      supabase
        .from("tickets")
        .select("id, name, price_inr")
        .eq("event_id", eventId)
        .order("price_inr", { ascending: false }),
    ])
    if (attendeeRes.data) setAttendees(attendeeRes.data)
    if (ticketRes.data) setTickets(ticketRes.data)
    setLoading(false)
  }, [eventId])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = attendees.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.company ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const stats = {
    total: attendees.length,
    registered: attendees.filter(a => a.status === "registered").length,
    confirmed: attendees.filter(a => a.status === "confirmed").length,
    checkedIn: attendees.filter(a => a.status === "checked_in").length,
    cancelled: attendees.filter(a => a.status === "cancelled").length,
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)

    const fd = new FormData(e.currentTarget)
    fd.set("eventId", eventId)

    const result = editing
      ? await updateAttendee(editing.id, fd)
      : await createAttendee(fd)

    if (result.success) {
      setDrawerOpen(false)
      setEditing(null)
      await fetchData()
    } else {
      setActionError(result.error ?? "Operation failed")
    }
    setSubmitting(false)
  }

  async function handleCheckIn(id: string) {
    setCheckingInId(id)
    const result = await checkInAttendee(id)
    if (result.success) await fetchData()
    else setActionError(result.error ?? "Check-in failed")
    setCheckingInId(null)
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this attendee?")) return
    setDeletingId(id)
    const result = await deleteAttendee(id)
    if (result.success) await fetchData()
    else setActionError(result.error ?? "Failed to delete")
    setDeletingId(null)
  }

  function exportCSV() {
    const headers = ["Name", "Email", "Phone", "Company", "Designation", "Ticket", "Status", "Registered"]
    const rows = attendees.map(a => [
      a.name, a.email, a.phone ?? "", a.company ?? "", a.designation ?? "",
      a.tickets?.name ?? "—", a.status, fmtDate(a.registration_date)
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendees-${eventId.slice(0, 8)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Stats Strip */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-white/80" },
          { label: "Registered", value: stats.registered, color: "text-blue-400" },
          { label: "Confirmed", value: stats.confirmed, color: "text-emerald-400" },
          { label: "Checked In", value: stats.checkedIn, color: "text-[#c9a84c]" },
          { label: "Cancelled", value: stats.cancelled, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="px-4 py-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-center">
            <div className={cn("text-xl font-bold tabular-nums", s.color)}>{s.value}</div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, company…"
              className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/15 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-white focus:outline-none focus:border-white/15 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="registered">Registered</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="cancelled">Cancelled</option>
            <option value="waitlisted">Waitlisted</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {attendees.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.08] text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.03] transition-colors"
            >
              <Download size={13} /> Export CSV
            </button>
          )}
          <button
            onClick={() => { setEditing(null); setDrawerOpen(true); setActionError(null) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] transition-colors"
          >
            <Plus size={15} /> Add Lead
          </button>
        </div>
      </div>

      {/* Error */}
      {actionError && (
        <div className="mb-5 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400"><X size={14} /></button>
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/30 gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading leads…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={28} className="mx-auto mb-3 text-white/15" />
            <p className="text-white/35 text-sm">{searchQuery || statusFilter !== "all" ? "No leads match your filters." : "No registrations yet."}</p>
            <p className="text-white/20 text-xs mt-1">Leads are captured automatically when visitors register on the public site.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Contact</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Company</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Ticket</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Registered</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const sc = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.registered
                const StatusIcon = sc.icon
                return (
                  <tr key={a.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-white/90">{a.name}</div>
                      {a.designation && <div className="text-[11px] text-white/30">{a.designation}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-white/60 text-xs">{a.email}</div>
                      {a.phone && <div className="text-[11px] text-white/30">{a.phone}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-white/50 text-xs">{a.company ?? "—"}</td>
                    <td className="px-5 py-3.5 text-white/50 text-xs">{a.tickets?.name ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider", sc.bg, sc.text)}>
                        <StatusIcon size={11} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-white/40 text-[11px] whitespace-nowrap">{fmtDate(a.registration_date)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {a.status !== "checked_in" && a.status !== "cancelled" && (
                          <button
                            onClick={() => handleCheckIn(a.id)}
                            disabled={checkingInId === a.id}
                            className="p-1.5 rounded-md text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-30"
                            title="Check In"
                          >
                            {checkingInId === a.id ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                          </button>
                        )}
                        <button onClick={() => { setEditing(a); setDrawerOpen(true); setActionError(null) }} className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(a.id)} disabled={deletingId === a.id} className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30">
                          {deletingId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Drawer ───────────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => { setDrawerOpen(false); setEditing(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/[0.08] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-white">{editing ? "Edit Lead" : "Add Lead"}</h3>
              <button onClick={() => { setDrawerOpen(false); setEditing(null) }} className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Full Name *</label>
                <input type="text" name="name" required defaultValue={editing?.name ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Email *</label>
                <input type="email" name="email" required defaultValue={editing?.email ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="john@company.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Phone</label>
                  <input type="tel" name="phone" defaultValue={editing?.phone ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Designation</label>
                  <input type="text" name="designation" defaultValue={editing?.designation ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="CTO" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Company</label>
                <input type="text" name="company" defaultValue={editing?.company ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Acme Corp" />
              </div>
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Ticket Tier</label>
                <select name="ticketId" defaultValue={editing?.ticket_id ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                  <option value="">No ticket</option>
                  {tickets.map(t => <option key={t.id} value={t.id}>{t.name} — ₹{new Intl.NumberFormat("en-IN").format(t.price_inr)}</option>)}
                </select>
              </div>
              {editing && (
                <div>
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Status</label>
                  <select name="status" defaultValue={editing.status} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                    <option value="registered">Registered</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked In</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="waitlisted">Waitlisted</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea name="notes" rows={2} defaultValue={editing?.notes ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none" placeholder="Internal notes…" />
              </div>

              {actionError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{actionError}</div>}

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setDrawerOpen(false); setEditing(null) }} className="flex-1 py-2.5 rounded-lg border border-white/[0.08] text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.03] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editing ? "Update Lead" : "Add Lead"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
