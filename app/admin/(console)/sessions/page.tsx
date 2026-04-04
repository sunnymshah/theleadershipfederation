"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { Plus, Pencil, Trash2, Search, X, Loader2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface SessionRow {
  id: string
  event_id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  track: string | null
  session_type: string
  room: string | null
  capacity: number | null
  sort_order: number
  events: { title: string } | null
}

interface EventOption { id: string; title: string }

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  keynote:    { bg: "bg-[#c9a84c]/10", text: "text-[#c9a84c]" },
  session:    { bg: "bg-blue-500/10",  text: "text-blue-400" },
  panel:      { bg: "bg-purple-500/10", text: "text-purple-400" },
  workshop:   { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  break:      { bg: "bg-zinc-500/10",  text: "text-zinc-400" },
  networking: { bg: "bg-orange-500/10", text: "text-orange-400" },
}

export default function AdminSessionsPage() {
  const [sessions, setSessions]       = useState<SessionRow[]>([])
  const [events, setEvents]           = useState<EventOption[]>([])
  const [loading, setLoading]         = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [editing, setEditing]         = useState<SessionRow | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [sessionRes, eventRes] = await Promise.all([
      supabase.from("sessions").select("*, events(title)").order("start_time"),
      supabase.from("events").select("id, title").order("title"),
    ])
    if (sessionRes.data) setSessions(sessionRes.data)
    if (eventRes.data) setEvents(eventRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.events?.title ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)
    const fd = new FormData(e.currentTarget)

    const payload = {
      event_id: editing ? undefined : (fd.get("eventId") as string),
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || null,
      start_time: new Date(fd.get("startTime") as string).toISOString(),
      end_time: new Date(fd.get("endTime") as string).toISOString(),
      track: (fd.get("track") as string) || null,
      session_type: fd.get("sessionType") as string,
      room: (fd.get("room") as string) || null,
      capacity: parseInt(fd.get("capacity") as string) || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = editing
      ? await supabase.from("sessions").update(payload).eq("id", editing.id)
      : await supabase.from("sessions").insert({ ...payload, event_id: fd.get("eventId") as string })

    if (error) { setActionError(error.message); setSubmitting(false); return }

    setDrawerOpen(false)
    setEditing(null)
    await fetchData()
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this session?")) return
    setDeletingId(id)
    await supabase.from("sessions").delete().eq("id", id)
    await fetchData()
    setDeletingId(null)
  }

  function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  }
  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#333] mb-1">Agenda / Sessions</h2>
          <p className="text-sm text-[#888]">Build the event schedule with sessions, panels, and breaks</p>
        </div>
        <button onClick={() => { setEditing(null); setDrawerOpen(true); setActionError(null) }} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] transition-colors">
          <Plus size={16} /> New Session
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search sessions…" className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#ccc] transition-colors" />
      </div>

      {actionError && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400"><X size={14} /></button>
        </div>
      )}

      <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#aaa] gap-2"><Loader2 size={18} className="animate-spin" /> Loading sessions…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Clock size={32} className="mx-auto mb-3 text-[#ccc]" />
            <p className="text-[#999] text-sm">{searchQuery ? "No sessions match." : "No sessions yet."}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-white">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Session</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Time</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Event</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Room</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-[#eee] last:border-0 hover:bg-[#fafafa] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-[#333]">{s.title}</div>
                    {s.track && <div className="text-[11px] text-[#aaa]">Track: {s.track}</div>}
                  </td>
                  <td className="px-5 py-4 text-[#777] text-xs whitespace-nowrap">
                    {fmtDate(s.start_time)} · {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                  </td>
                  <td className="px-5 py-4 text-[#777] text-xs">{s.events?.title ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider", TYPE_STYLES[s.session_type]?.bg ?? "bg-gray-100", TYPE_STYLES[s.session_type]?.text ?? "text-[#888]")}>{s.session_type}</span>
                  </td>
                  <td className="px-5 py-4 text-[#777] text-xs">{s.room ?? "—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditing(s); setDrawerOpen(true); setActionError(null) }} className="p-2 rounded-md text-[#aaa] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} className="p-2 rounded-md text-[#aaa] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30">
                        {deletingId === s.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => { setDrawerOpen(false); setEditing(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-[#333]">{editing ? "Edit Session" : "Add Session"}</h3>
              <button onClick={() => { setDrawerOpen(false); setEditing(null) }} className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {!editing && (
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Event *</label>
                  <select name="eventId" required className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                    <option value="">Select event…</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Session Title *</label>
                <input type="text" name="title" required defaultValue={editing?.title ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Opening Keynote" />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Type *</label>
                <select name="sessionType" defaultValue={editing?.session_type ?? "session"} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                  <option value="keynote">Keynote</option>
                  <option value="session">Session</option>
                  <option value="panel">Panel</option>
                  <option value="workshop">Workshop</option>
                  <option value="break">Break</option>
                  <option value="networking">Networking</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Start *</label>
                  <input type="datetime-local" name="startTime" required defaultValue={editing ? new Date(editing.start_time).toISOString().slice(0, 16) : ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">End *</label>
                  <input type="datetime-local" name="endTime" required defaultValue={editing ? new Date(editing.end_time).toISOString().slice(0, 16) : ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Track</label>
                  <input type="text" name="track" defaultValue={editing?.track ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Leadership" />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Room</label>
                  <input type="text" name="room" defaultValue={editing?.room ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Hall A" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Description</label>
                <textarea name="description" rows={2} defaultValue={editing?.description ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Capacity</label>
                <input type="number" name="capacity" min="0" defaultValue={editing?.capacity ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
              </div>
              {actionError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{actionError}</div>}
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setDrawerOpen(false); setEditing(null) }} className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editing ? "Update" : "Add Session"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
