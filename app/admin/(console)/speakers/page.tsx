"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { createSpeaker, updateSpeaker, deleteSpeaker } from "@/app/actions/speakerActions"
import { Plus, Pencil, Trash2, Search, X, Loader2, Radio } from "lucide-react"

interface SpeakerRow {
  id: string
  event_id: string
  name: string
  designation: string | null
  company: string | null
  bio: string | null
  image_url: string | null
  sort_order: number
  events: { title: string } | null
}

interface EventOption { id: string; title: string }

export default function AdminSpeakersPage() {
  const [speakers, setSpeakers]       = useState<SpeakerRow[]>([])
  const [events, setEvents]           = useState<EventOption[]>([])
  const [loading, setLoading]         = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [editingSpeaker, setEditingSpeaker] = useState<SpeakerRow | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [speakerRes, eventRes] = await Promise.all([
      supabase.from("speakers").select("*, events(title)").order("sort_order"),
      supabase.from("events").select("id, title").order("title"),
    ])
    if (speakerRes.data) setSpeakers(speakerRes.data)
    if (eventRes.data) setEvents(eventRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = speakers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.company ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.events?.title ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)
    const fd = new FormData(e.currentTarget)
    const result = editingSpeaker ? await updateSpeaker(editingSpeaker.id, fd) : await createSpeaker(fd)
    if (result.success) { setDrawerOpen(false); setEditingSpeaker(null); await fetchData() }
    else setActionError(result.error ?? "Operation failed")
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this speaker?")) return
    setDeletingId(id)
    const result = await deleteSpeaker(id)
    if (result.success) await fetchData()
    else setActionError(result.error ?? "Failed to delete")
    setDeletingId(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#333] mb-1">Speakers</h2>
          <p className="text-sm text-[#888]">Manage speaker profiles across all events</p>
        </div>
        <button onClick={() => { setEditingSpeaker(null); setDrawerOpen(true); setActionError(null) }} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c9a84c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d4b85c] transition-colors">
          <Plus size={16} /> New Speaker
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, company, or event…" className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#ccc] transition-colors" />
      </div>

      {actionError && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400"><X size={14} /></button>
        </div>
      )}

      <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#aaa] gap-2"><Loader2 size={18} className="animate-spin" /> Loading speakers…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Radio size={32} className="mx-auto mb-3 text-[#ccc]" />
            <p className="text-[#999] text-sm">{searchQuery ? "No speakers match your search." : "No speakers yet. Add your first speaker."}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-[#f9f9f9]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Speaker</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Company</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Event</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-[#eee] last:border-0 hover:bg-[#fafafa] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#eee] flex items-center justify-center text-[#888] text-xs font-bold shrink-0">
                        {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-[#333]">{s.name}</div>
                        {s.designation && <div className="text-[11px] text-[#aaa]">{s.designation}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#777] text-xs">{s.company ?? "—"}</td>
                  <td className="px-5 py-4 text-[#777] text-xs">{s.events?.title ?? "—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditingSpeaker(s); setDrawerOpen(true); setActionError(null) }} className="p-2 rounded-md text-[#aaa] hover:text-[#555] hover:bg-[#fafafa] transition-colors" title="Edit"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} className="p-2 rounded-md text-[#aaa] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30" title="Delete">
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

      {/* ── Drawer ─────────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-[#1a1a2e]/60 z-40" onClick={() => { setDrawerOpen(false); setEditingSpeaker(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-[#333]">{editingSpeaker ? "Edit Speaker" : "Add Speaker"}</h3>
              <button onClick={() => { setDrawerOpen(false); setEditingSpeaker(null) }} className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {!editingSpeaker && (
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Event *</label>
                  <select name="eventId" required className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                    <option value="">Select event…</option>
                    {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Full Name *</label>
                <input type="text" name="name" required defaultValue={editingSpeaker?.name ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Rajesh Verma" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Designation</label>
                  <input type="text" name="designation" defaultValue={editingSpeaker?.designation ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="CEO" />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Company</label>
                  <input type="text" name="company" defaultValue={editingSpeaker?.company ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Global Tech Solutions" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Bio</label>
                <textarea name="bio" rows={3} defaultValue={editingSpeaker?.bio ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none" placeholder="Brief bio of the speaker…" />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Speaker Photo</label>
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#e0e0e0] rounded-lg cursor-pointer hover:border-[#c9a84c]/50 hover:bg-[#c9a84c]/5 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#bbb] mb-1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                  <span className="text-xs text-[#999]">Click to upload headshot</span>
                  <span className="text-[10px] text-[#ccc] mt-0.5">JPG, PNG up to 2MB</span>
                  <input type="file" name="headshot" accept="image/*" className="hidden" />
                </label>
                <input type="hidden" name="imageUrl" defaultValue={editingSpeaker?.image_url ?? ""} />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Sort Order</label>
                <input type="number" name="sortOrder" min="0" defaultValue={editingSpeaker?.sort_order ?? 0} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
              </div>
              {actionError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{actionError}</div>}
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setDrawerOpen(false); setEditingSpeaker(null) }} className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editingSpeaker ? "Update Speaker" : "Add Speaker"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
