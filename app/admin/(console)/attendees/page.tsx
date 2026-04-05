"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import {
  createAttendee, updateAttendee, checkInAttendee, deleteAttendee,
  bulkCheckIn, bulkSendEmail, bulkDelete, bulkUpdateStatus,
} from "@/app/actions/attendeeActions"
import {
  Plus, Pencil, Trash2, Search, X, Users, Loader2, CheckCircle2, Download,
  Upload, Mail, Tag, ChevronDown,
} from "lucide-react"
import { AttendeeQrCode } from "@/components/admin/AttendeeQrCode"
import { CSVImporter } from "@/components/admin/CSVImporter"
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
  tags: string[] | null
  internal_notes: string | null
  dietary_preference: string | null
  vip_level: string | null
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

const VIP_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  vip:     { bg: "bg-amber-500/10",   text: "text-amber-500",   label: "VIP" },
  vvip:    { bg: "bg-red-500/10",     text: "text-red-500",     label: "VVIP" },
  speaker: { bg: "bg-purple-500/10",  text: "text-purple-500",  label: "Speaker" },
  sponsor: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Sponsor" },
  media:   { bg: "bg-blue-500/10",    text: "text-blue-500",    label: "Media" },
}

const DIETARY_OPTIONS = [
  "", "Vegetarian", "Vegan", "Non-Vegetarian", "Jain", "Gluten-Free", "Halal", "Kosher", "Other",
]

const VIP_OPTIONS = [
  { value: "", label: "None" },
  { value: "standard", label: "Standard" },
  { value: "vip", label: "VIP" },
  { value: "vvip", label: "VVIP" },
  { value: "speaker", label: "Speaker" },
  { value: "sponsor", label: "Sponsor" },
  { value: "media", label: "Media" },
]

export default function AdminAttendeesPage() {
  const [attendees, setAttendees]       = useState<AttendeeRow[]>([])
  const [events, setEvents]             = useState<EventOption[]>([])
  const [tickets, setTickets]           = useState<TicketOption[]>([])
  const [loading, setLoading]           = useState(true)
  const [searchQuery, setSearchQuery]   = useState("")
  const [filterEvent, setFilterEvent]   = useState("")
  const [filterTag, setFilterTag]       = useState("")
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [editingAttendee, setEditingAttendee] = useState<AttendeeRow | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [actionError, setActionError]   = useState<string | null>(null)
  const [deletingId, setDeletingId]     = useState<string | null>(null)
  const [checkingInId, setCheckingInId] = useState<string | null>(null)

  // CSV Importer
  const [importerOpen, setImporterOpen] = useState(false)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

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

  // Gather all unique tags for filter dropdown
  const allTags = Array.from(
    new Set(attendees.flatMap(a => a.tags ?? []).filter(Boolean))
  ).sort()

  const filtered = attendees.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.company ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEvent = !filterEvent || a.event_id === filterEvent
    const matchesTag = !filterTag || (a.tags ?? []).includes(filterTag)
    return matchesSearch && matchesEvent && matchesTag
  })

  // Selection helpers
  const allFilteredSelected = filtered.length > 0 && filtered.every(a => selectedIds.has(a.id))

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(a => a.id)))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
    const headers = ["Name", "Email", "Phone", "Company", "Designation", "Event", "Ticket", "Status", "VIP Level", "Tags", "Check-in"]
    const rows = filtered.map(a => [
      a.name, a.email, a.phone ?? "", a.company ?? "", a.designation ?? "",
      a.events?.title ?? "", a.tickets?.name ?? "", a.status,
      a.vip_level ?? "", (a.tags ?? []).join("; "), a.check_in_at ?? "",
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `attendees-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Bulk action handlers
  async function handleBulkCheckIn() {
    if (!confirm(`Check in ${selectedIds.size} attendees?`)) return
    setBulkLoading(true)
    const result = await bulkCheckIn(Array.from(selectedIds))
    if (result.success) { setSelectedIds(new Set()); await fetchData() }
    else setActionError(result.error ?? "Bulk check-in failed")
    setBulkLoading(false)
  }

  async function handleBulkEmail() {
    if (!confirm(`Send confirmation emails to ${selectedIds.size} attendees?`)) return
    setBulkLoading(true)
    const result = await bulkSendEmail(Array.from(selectedIds))
    if (result.success) { setSelectedIds(new Set()); await fetchData() }
    else setActionError(`Sent ${result.sent}, failed ${result.failed}. ${result.errors?.join("; ") ?? ""}`)
    setBulkLoading(false)
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedIds.size} attendees? This action cannot be undone.`)) return
    setBulkLoading(true)
    const result = await bulkDelete(Array.from(selectedIds))
    if (result.success) { setSelectedIds(new Set()); await fetchData() }
    else setActionError(result.error ?? "Bulk delete failed")
    setBulkLoading(false)
  }

  async function handleBulkStatus(status: string) {
    if (!confirm(`Update ${selectedIds.size} attendees to "${status}"?`)) return
    setBulkLoading(true)
    const result = await bulkUpdateStatus(Array.from(selectedIds), status)
    if (result.success) { setSelectedIds(new Set()); await fetchData() }
    else setActionError(result.error ?? "Bulk status update failed")
    setBulkLoading(false)
  }

  const checkedInCount = filtered.filter(a => a.status === "checked_in").length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#333] mb-1">Attendees</h2>
          <p className="text-sm text-[#888]">
            {filtered.length} registrations{checkedInCount > 0 && <> · <span className="text-[#c9a84c]">{checkedInCount} checked in</span></>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#666] hover:text-[#444] hover:bg-[#fafafa] transition-colors">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => setImporterOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#666] hover:text-[#444] hover:bg-[#fafafa] transition-colors">
            <Upload size={15} /> Import CSV
          </button>
          <button onClick={() => { setEditingAttendee(null); setDrawerOpen(true); setActionError(null) }} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] transition-colors">
            <Plus size={16} /> Add Attendee
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, email, or company..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#ccc] transition-colors" />
        </div>
        <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} className="px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc] transition-colors min-w-[180px]">
          <option value="">All Events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
        {allTags.length > 0 && (
          <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc] transition-colors min-w-[140px]">
            <option value="">All Tags</option>
            {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        )}
      </div>

      {actionError && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400"><X size={14} /></button>
        </div>
      )}

      <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#aaa] gap-2"><Loader2 size={18} className="animate-spin" /> Loading attendees...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Users size={32} className="mx-auto mb-3 text-[#ccc]" />
            <p className="text-[#999] text-sm">{searchQuery || filterEvent || filterTag ? "No attendees match your filters." : "No attendees yet. Add or import your first registration."}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-[#ddd] text-[#c9a84c] focus:ring-[#c9a84c]/30 cursor-pointer"
                  />
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Attendee</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Contact</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Event</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Ticket</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className={cn(
                  "border-b border-[#eee] last:border-0 hover:bg-[#fafafa] transition-colors",
                  selectedIds.has(a.id) && "bg-[#c9a84c]/5"
                )}>
                  <td className="px-3 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(a.id)}
                      onChange={() => toggleSelect(a.id)}
                      className="rounded border-[#ddd] text-[#c9a84c] focus:ring-[#c9a84c]/30 cursor-pointer"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#333]">{a.name}</span>
                      {a.vip_level && VIP_STYLES[a.vip_level] && (
                        <span className={cn(
                          "inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                          VIP_STYLES[a.vip_level].bg,
                          VIP_STYLES[a.vip_level].text,
                        )}>
                          {VIP_STYLES[a.vip_level].label}
                        </span>
                      )}
                    </div>
                    {a.company && <div className="text-[11px] text-[#aaa]">{a.designation ? `${a.designation}, ` : ""}{a.company}</div>}
                    {(a.tags ?? []).length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {(a.tags ?? []).map(tag => (
                          <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#f0f0f0] text-[9px] text-[#777]">
                            <Tag size={8} /> {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[#666] text-xs">{a.email}</div>
                    {a.phone && <div className="text-[#aaa] text-[11px]">{a.phone}</div>}
                  </td>
                  <td className="px-5 py-4 text-[#777] text-xs">{a.events?.title ?? "\u2014"}</td>
                  <td className="px-5 py-4 text-[#777] text-xs">{a.tickets?.name ?? "\u2014"}</td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider", STATUS_STYLES[a.status]?.bg ?? "bg-gray-100", STATUS_STYLES[a.status]?.text ?? "text-[#888]")}>
                      {a.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {a.qr_token && (
                        <AttendeeQrCode attendeeName={a.name} qrToken={a.qr_token} />
                      )}
                      {a.status !== "checked_in" && a.status !== "cancelled" && (
                        <button onClick={() => handleCheckIn(a.id)} disabled={checkingInId === a.id} className="p-2 rounded-md text-[#aaa] hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-30" title="Check in">
                          {checkingInId === a.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                        </button>
                      )}
                      <button onClick={() => { setEditingAttendee(a); setDrawerOpen(true); setActionError(null) }} className="p-2 rounded-md text-[#aaa] hover:text-[#555] hover:bg-[#fafafa] transition-colors" title="Edit"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(a.id)} disabled={deletingId === a.id} className="p-2 rounded-md text-[#aaa] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30" title="Delete">
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

      {/* ── Bulk Actions Bar ──────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-white border border-[#e0e0e0] rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4">
          <span className="text-sm font-semibold text-[#333]">{selectedIds.size} selected</span>
          <div className="w-px h-6 bg-[#e0e0e0]" />
          <button onClick={handleBulkCheckIn} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-500/10 transition-colors disabled:opacity-50">
            {bulkLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Check In All
          </button>
          <button onClick={handleBulkEmail} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-500/10 transition-colors disabled:opacity-50">
            {bulkLoading ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />} Send Email
          </button>
          <div className="relative group">
            <button disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#666] hover:bg-[#fafafa] transition-colors disabled:opacity-50">
              Status <ChevronDown size={12} />
            </button>
            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-white border border-[#e0e0e0] rounded-lg shadow-lg py-1 min-w-[140px]">
              {["registered", "confirmed", "checked_in", "waitlisted", "cancelled"].map(s => (
                <button key={s} onClick={() => handleBulkStatus(s)} className="block w-full text-left px-3 py-2 text-xs text-[#555] hover:bg-[#fafafa] transition-colors capitalize">
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleBulkDelete} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50">
            {bulkLoading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
          </button>
          <div className="w-px h-6 bg-[#e0e0e0]" />
          <button onClick={() => setSelectedIds(new Set())} className="p-1.5 rounded-md text-[#aaa] hover:text-[#555] hover:bg-[#fafafa] transition-colors" title="Clear selection">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── CSV Importer ─────────────────────────────────────────────── */}
      {importerOpen && (
        <CSVImporter
          events={events}
          tickets={tickets}
          onClose={() => setImporterOpen(false)}
          onComplete={() => fetchData()}
        />
      )}

      {/* ── Drawer ─────────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => { setDrawerOpen(false); setEditingAttendee(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-[#333]">{editingAttendee ? "Edit Attendee" : "Add Attendee"}</h3>
              <button onClick={() => { setDrawerOpen(false); setEditingAttendee(null) }} className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {!editingAttendee && (
                <>
                  <div>
                    <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Event *</label>
                    <select name="eventId" required className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                      <option value="">Select event...</option>
                      {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Ticket</label>
                    <select name="ticketId" className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                      <option value="">No ticket</option>
                      {tickets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input type="text" name="name" required defaultValue={editingAttendee?.name ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Priya Kapoor" />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Email *</label>
                  <input type="email" name="email" required defaultValue={editingAttendee?.email ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="priya@example.com" />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Phone</label>
                  <input type="tel" name="phone" defaultValue={editingAttendee?.phone ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Company</label>
                  <input type="text" name="company" defaultValue={editingAttendee?.company ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Acme Inc" />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Designation</label>
                  <input type="text" name="designation" defaultValue={editingAttendee?.designation ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="CTO" />
                </div>
              </div>

              {/* VIP Level */}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">VIP Level</label>
                <select name="vip_level" defaultValue={editingAttendee?.vip_level ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                  {VIP_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              {/* Dietary Preference */}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Dietary Preference</label>
                <select name="dietary_preference" defaultValue={editingAttendee?.dietary_preference ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                  {DIETARY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || "None"}</option>)}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Tags</label>
                <input
                  type="text"
                  name="tags"
                  defaultValue={(editingAttendee?.tags ?? []).join(", ")}
                  className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  placeholder="vip-dinner, day-1, tech-track"
                />
                <p className="text-[10px] text-[#aaa] mt-1">Comma-separated tags</p>
              </div>

              {editingAttendee && (
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Status</label>
                  <select name="status" defaultValue={editingAttendee.status} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                    <option value="registered">Registered</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked In</option>
                    <option value="waitlisted">Waitlisted</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Notes</label>
                <textarea name="notes" rows={2} defaultValue={editingAttendee?.notes ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none" placeholder="Public-facing notes..." />
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Internal Notes</label>
                <textarea
                  name="internal_notes"
                  rows={3}
                  defaultValue={editingAttendee?.internal_notes ?? ""}
                  className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none"
                  placeholder="Internal team notes (not visible to attendee)..."
                />
              </div>

              {actionError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{actionError}</div>}
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setDrawerOpen(false); setEditingAttendee(null) }} className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : editingAttendee ? "Update" : "Add Attendee"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
