"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { createAttendee, updateAttendee, checkInAttendee, deleteAttendee } from "@/app/actions/attendeeActions"
import { Plus, Pencil, Trash2, Search, X, Users, Loader2, CheckCircle2, Download } from "lucide-react"
import { AttendeeQrCode } from "@/components/admin/AttendeeQrCode"
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
  qr_token: string | null
  notes: string | null
  events: { title: string } | null
  tickets: { name: string } | null
}

interface EventOption { id: string; title: string }
interface TicketOption { id: string; name: string; event_id: string }

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  registered:  { bg: "bg-blue-500/10",    text: "text-blue-400" },
  confirmed:   { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  checked_in:  { bg: "bg-[#c9a84c]/10",   text: "text-[#c9a84c]" },
  cancelled:   { bg: "bg-red-500/10",     text: "text-red-400" },
  waitlisted:  { bg: "bg-yellow-500/10",  text: "text-yellow-400" },
}

export default function AdminAttendeesPage() {
  const [attendees, setAttendees]       = useState<AttendeeRow[]>([])
  const [events, setEvents]             = useState<EventOption[]>([])
  const [tickets, setTickets]           = useState<TicketOption[]>([])
  const [loading, setLoading]           = useState(true)
  const [searchQuery, setSearchQuery]   = useState("")
  const [filterEvent, setFilterEvent]   = useState("")
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [editingAttendee, setEditingAttendee] = useState<AttendeeRow | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [actionError, setActionError]   = useState<string | null>(null)
  const [deletingId, setDeletingId]     = useState<string | null>(null)
  const [checkingInId, setCheckingInId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [attendeeRes, eventRes, ticketRes] = await Promise.all([
      supabase.from("attendees").select("*, events(title), tickets(name)").order("registration_date", { ascending: false }),
      supabase.from("events").select("id, title").order("title"),
      supabase.from("tickets").select("id, name, event_id").order("name"),
    ])
    if (attendeeRes.data) setAttendees(attendeeRes.data)
    if (eventRes.data) setEvents(eventRes.data)
    if (ticketRes.data) setTickets(ticketRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = attendees.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.company ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEvent = !filterEvent || a.event_id === filterEvent
    return matchesSearch && matchesEvent
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)
    const fd = new FormData(e.currentTarget)
    const result = editingAttendee ? await updateAttendee(editingAttendee.id, fd) : await createAttendee(fd)
    if (result.success) { setDrawerOpen(false); setEditingAttendee(null); await fetchData() }
    else setActionError(result.error ?? "Operation failed")
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
    if (!confirm("Delete this attendee registration?")) return
    setDeletingId(id)
    const result = await deleteAttendee(id)
    if (result.success) await fetchData()
    else setActionError(result.error ?? "Failed to delete")
    setDeletingId(null)
  }

  function exportCSV() {
    const headers = ["Name", "Email", "Phone", "Company", "Designation", "Event", "Ticket", "Status", "Check-in"]
    const rows = filtered.map(a => [a.name, a.email, a.phone ?? "", a.company ?? "", a.designation ?? "", a.events?.title ?? "", a.tickets?.name ?? "", a.status, a.check_in_at ?? ""])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `attendees-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const checkedInCount = filtered.filter(a => a.status === "checked_in").length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Attendees</h2>
          <p className="text-sm text-white/40">
            {filtered.length} registrations{checkedInCount > 0 && <> · <span className="text-[#c9a84c]">{checkedInCount} checked in</span></>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/[0.08] text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.03] transition-colors">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => { setEditingAttendee(null); setDrawerOpen(true); setActionError(null) }} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] transition-colors">
            <Plus size={16} /> Add Attendee
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, email, or company…" className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/15 transition-colors" />
        </div>
        <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-white/15 transition-colors min-w-[180px]">
          <option value="">All Events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
      </div>

      {actionError && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400"><X size={14} /></button>
        </div>
      )}

      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30 gap-2"><Loader2 size={18} className="animate-spin" /> Loading attendees…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Users size={32} className="mx-auto mb-3 text-white/15" />
            <p className="text-white/35 text-sm">{searchQuery || filterEvent ? "No attendees match your filters." : "No attendees yet. Add or import your first registration."}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Attendee</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Contact</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Event</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Ticket</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-white/90">{a.name}</div>
                    {a.company && <div className="text-[11px] text-white/30">{a.designation ? `${a.designation}, ` : ""}{a.company}</div>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-white/60 text-xs">{a.email}</div>
                    {a.phone && <div className="text-white/30 text-[11px]">{a.phone}</div>}
                  </td>
                  <td className="px-5 py-4 text-white/50 text-xs">{a.events?.title ?? "—"}</td>
                  <td className="px-5 py-4 text-white/50 text-xs">{a.tickets?.name ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider", STATUS_STYLES[a.status]?.bg ?? "bg-white/5", STATUS_STYLES[a.status]?.text ?? "text-white/40")}>
                      {a.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {a.qr_token && (
                        <AttendeeQrCode attendeeName={a.name} qrToken={a.qr_token} />
                      )}
                      {a.status !== "checked_in" && a.status !== "cancelled" && (
                        <button onClick={() => handleCheckIn(a.id)} disabled={checkingInId === a.id} className="p-2 rounded-md text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-30" title="Check in">
                          {checkingInId === a.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                        </button>
                      )}
                      <button onClick={() => { setEditingAttendee(a); setDrawerOpen(true); setActionError(null) }} className="p-2 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors" title="Edit"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(a.id)} disabled={deletingId === a.id} className="p-2 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30" title="Delete">
                        {deletingId === a.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Drawer ─────────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => { setDrawerOpen(false); setEditingAttendee(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/[0.08] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-white">{editingAttendee ? "Edit Attendee" : "Add Attendee"}</h3>
              <button onClick={() => { setDrawerOpen(false); setEditingAttendee(null) }} className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {!editingAttendee && (
                <>
                  <div>
                    <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Event *</label>
                    <select name="eventId" required className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                      <option value="">Select event…</option>
                      {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Ticket</label>
                    <select name="ticketId" className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                      <option value="">No ticket</option>
                      {tickets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input type="text" name="name" required defaultValue={editingAttendee?.name ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Priya Kapoor" />
                </div>
                <div>
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Email *</label>
                  <input type="email" name="email" required defaultValue={editingAttendee?.email ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="priya@example.com" />
                </div>
                <div>
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Phone</label>
                  <input type="tel" name="phone" defaultValue={editingAttendee?.phone ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Company</label>
                  <input type="text" name="company" defaultValue={editingAttendee?.company ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Acme Inc" />
                </div>
                <div>
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Designation</label>
                  <input type="text" name="designation" defaultValue={editingAttendee?.designation ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="CTO" />
                </div>
              </div>
              {editingAttendee && (
                <div>
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Status</label>
                  <select name="status" defaultValue={editingAttendee.status} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                    <option value="registered">Registered</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked In</option>
                    <option value="waitlisted">Waitlisted</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea name="notes" rows={2} defaultValue={editingAttendee?.notes ?? ""} className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none" placeholder="Internal notes…" />
              </div>
              {actionError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{actionError}</div>}
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setDrawerOpen(false); setEditingAttendee(null) }} className="flex-1 py-2.5 rounded-lg border border-white/[0.08] text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.03] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editingAttendee ? "Update" : "Add Attendee"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
