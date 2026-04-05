"use client"

/**
 * ─── SESSION / AGENDA MANAGER (Zoho Backstage Replica) ──────────────────
 *
 * Event-scoped agenda builder. Timeline view with color-coded session
 * types: keynote, session, panel, workshop, break, networking.
 */

import { useState, useCallback, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { createSession, updateSession, deleteSession, linkSpeakersToSession } from "@/app/actions/sessionActions"
import { Plus, Pencil, Trash2, X, Loader2, ClipboardList, Clock, MapPin, Users } from "lucide-react"
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
}

interface SpeakerRow {
  id: string
  name: string
  image_url: string | null
  designation: string | null
  company: string | null
}

interface SessionSpeakerLink {
  session_id: string
  speaker_id: string
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  keynote:     { label: "Keynote",     color: "text-[#c9a84c]",  bg: "bg-[#c9a84c]/10" },
  session:     { label: "Session",     color: "text-blue-400",    bg: "bg-blue-500/10" },
  panel:       { label: "Panel",       color: "text-purple-400",  bg: "bg-purple-500/10" },
  workshop:    { label: "Workshop",    color: "text-emerald-400", bg: "bg-emerald-500/10" },
  break:       { label: "Break",       color: "text-[#888]",      bg: "bg-white" },
  networking:  { label: "Networking",  color: "text-pink-400",    bg: "bg-pink-500/10" },
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export function SessionManager({ eventId }: { eventId: string }) {
  const [sessions, setSessions]     = useState<SessionRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing]       = useState<SessionRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [speakers, setSpeakers]     = useState<SpeakerRow[]>([])
  const [sessionSpeakerLinks, setSessionSpeakerLinks] = useState<SessionSpeakerLink[]>([])
  const [selectedSpeakerIds, setSelectedSpeakerIds]   = useState<string[]>([])

  const supabase = createClient()

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    const [sessionsRes, speakersRes, linksRes] = await Promise.all([
      supabase
        .from("sessions")
        .select("*")
        .eq("event_id", eventId)
        .order("start_time", { ascending: true }),
      supabase
        .from("speakers")
        .select("id, name, image_url, designation, company")
        .eq("event_id", eventId)
        .order("sort_order"),
      supabase
        .from("session_speakers")
        .select("session_id, speaker_id")
        .in("session_id",
          (await supabase.from("sessions").select("id").eq("event_id", eventId)).data?.map(s => s.id) ?? []
        ),
    ])
    if (sessionsRes.data) setSessions(sessionsRes.data)
    if (speakersRes.data) setSpeakers(speakersRes.data)
    if (linksRes.data) setSessionSpeakerLinks(linksRes.data)
    setLoading(false)
  }, [eventId])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  // Group by date
  const grouped = sessions.reduce<Record<string, SessionRow[]>>((acc, s) => {
    const day = fmtDate(s.start_time)
    if (!acc[day]) acc[day] = []
    acc[day].push(s)
    return acc
  }, {})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)

    const fd = new FormData(e.currentTarget)
    fd.set("eventId", eventId)

    const result = editing
      ? await updateSession(editing.id, fd)
      : await createSession(fd)

    if (result.success) {
      // Save speaker links for the session
      const sessionId = editing?.id ?? result.session?.id
      if (sessionId) {
        await linkSpeakersToSession(sessionId, selectedSpeakerIds)
      }
      setDrawerOpen(false)
      setEditing(null)
      setSelectedSpeakerIds([])
      await fetchSessions()
    } else {
      setActionError(result.error ?? "Operation failed")
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this session?")) return
    setDeletingId(id)
    const result = await deleteSession(id)
    if (result.success) await fetchSessions()
    else setActionError(result.error ?? "Failed to delete")
    setDeletingId(null)
  }

  function openDrawer(session?: SessionRow) {
    setEditing(session ?? null)
    setDrawerOpen(true)
    setActionError(null)
    // Load existing speaker links if editing
    if (session) {
      const linked = sessionSpeakerLinks
        .filter(l => l.session_id === session.id)
        .map(l => l.speaker_id)
      setSelectedSpeakerIds(linked)
    } else {
      setSelectedSpeakerIds([])
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#888]">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          {Object.keys(grouped).length > 1 && ` across ${Object.keys(grouped).length} days`}
        </p>
        <button
          onClick={() => openDrawer()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] transition-colors"
        >
          <Plus size={15} /> Add Session
        </button>
      </div>

      {actionError && (
        <div className="mb-5 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400"><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#aaa] gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading agenda…
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-[#e0e0e0]">
          <ClipboardList size={28} className="mx-auto mb-3 text-[#ccc]" />
          <p className="text-[#999] text-sm">No sessions in the agenda yet.</p>
          <p className="text-[#bbb] text-xs mt-1">Build your event timeline with keynotes, panels, workshops, and breaks.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([day, dayItems]) => (
            <div key={day}>
              {/* Day Header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-white text-[11px] font-bold text-[#666] uppercase tracking-wider">
                  {day}
                </span>
                <div className="flex-1 h-px bg-[#e0e0e0]" />
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                {dayItems.map(s => {
                  const tc = TYPE_CONFIG[s.session_type] ?? TYPE_CONFIG.session
                  return (
                    <div key={s.id} className="group flex gap-4 rounded-xl border border-[#e0e0e0] bg-white hover:bg-[#fafafa] transition-all p-4">
                      {/* Time Column */}
                      <div className="w-20 shrink-0 text-right">
                        <div className="text-sm font-semibold text-[#555] tabular-nums">{fmtTime(s.start_time)}</div>
                        <div className="text-[11px] text-[#aaa] tabular-nums">{fmtTime(s.end_time)}</div>
                      </div>

                      {/* Accent Line */}
                      <div className={cn("w-1 rounded-full shrink-0", tc.bg.replace("/10", "/40"))} />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", tc.bg, tc.color)}>
                            {tc.label}
                          </span>
                          {s.room && (
                            <span className="flex items-center gap-1 text-[10px] text-[#bbb]">
                              <MapPin size={9} /> {s.room}
                            </span>
                          )}
                          {s.track && (
                            <span className="text-[10px] text-[#bbb] px-1.5 py-0.5 rounded bg-white">
                              {s.track}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-[#333] text-[14px]">{s.title}</h4>
                        {/* Session Speakers */}
                        {(() => {
                          const linkedIds = sessionSpeakerLinks.filter(l => l.session_id === s.id).map(l => l.speaker_id)
                          const linkedSpeakers = speakers.filter(sp => linkedIds.includes(sp.id))
                          if (linkedSpeakers.length === 0) return null
                          return (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Users size={11} className="text-[#bbb] shrink-0" />
                              <div className="flex items-center gap-1">
                                {linkedSpeakers.map(sp => (
                                  <span key={sp.id} className="inline-flex items-center gap-1 text-[11px] text-[#777] bg-[#f5f5f5] rounded-full px-2 py-0.5">
                                    {sp.image_url && (
                                      <img src={sp.image_url} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                                    )}
                                    {sp.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )
                        })()}
                        {s.description && <p className="text-[11px] text-[#999] mt-1 line-clamp-2">{s.description}</p>}
                      </div>

                      {/* Actions */}
                      <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => openDrawer(s)} className="p-1.5 rounded-md text-[#aaa] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} className="p-1.5 rounded-md text-[#aaa] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30">
                          {deletingId === s.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Drawer ─────────────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => { setDrawerOpen(false); setEditing(null) }} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-[#333]">{editing ? "Edit Session" : "Add Session"}</h3>
              <button onClick={() => { setDrawerOpen(false); setEditing(null) }} className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-[#fafafa] transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Session Title *</label>
                <input type="text" name="title" required defaultValue={editing?.title ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Opening Keynote" />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Session Type *</label>
                <select name="sessionType" defaultValue={editing?.session_type ?? "session"} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors">
                  <option value="keynote">Keynote</option>
                  <option value="session">Session</option>
                  <option value="panel">Panel Discussion</option>
                  <option value="workshop">Workshop</option>
                  <option value="break">Break</option>
                  <option value="networking">Networking</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Start Time *</label>
                  <input type="datetime-local" name="startTime" required defaultValue={editing ? new Date(editing.start_time).toISOString().slice(0, 16) : ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">End Time *</label>
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
                  <input type="text" name="room" defaultValue={editing?.room ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="Main Hall" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Description</label>
                <textarea name="description" rows={3} defaultValue={editing?.description ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none" placeholder="Session description…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Capacity</label>
                  <input type="number" name="capacity" min="0" defaultValue={editing?.capacity ?? ""} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" placeholder="100" />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">Sort Order</label>
                  <input type="number" name="sortOrder" min="0" defaultValue={editing?.sort_order ?? sessions.length} className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors" />
                </div>
              </div>

              {/* Speakers Multi-Select */}
              {speakers.length > 0 && (
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                    Speakers
                  </label>
                  <div className="border border-[#e0e0e0] rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto bg-[#fafafa]">
                    {speakers.map(sp => (
                      <label key={sp.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-white rounded-md px-2 py-1.5 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedSpeakerIds.includes(sp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSpeakerIds(prev => [...prev, sp.id])
                            } else {
                              setSelectedSpeakerIds(prev => prev.filter(id => id !== sp.id))
                            }
                          }}
                          className="w-4 h-4 rounded border-[#e0e0e0] text-[#c9a84c] focus:ring-[#c9a84c]/50"
                        />
                        <div className="flex items-center gap-2 min-w-0">
                          {sp.image_url ? (
                            <img src={sp.image_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#e0e0e0] flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-bold text-[#999]">
                                {sp.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-sm text-[#333] block truncate">{sp.name}</span>
                            {(sp.designation || sp.company) && (
                              <span className="text-[10px] text-[#999] block truncate">
                                {sp.designation}{sp.designation && sp.company ? ", " : ""}{sp.company}
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedSpeakerIds.length > 0 && (
                    <p className="text-[11px] text-[#999] mt-1">
                      {selectedSpeakerIds.length} speaker{selectedSpeakerIds.length !== 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>
              )}

              {actionError && <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">{actionError}</div>}

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setDrawerOpen(false); setEditing(null) }} className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editing ? "Update Session" : "Add Session"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
