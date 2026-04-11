"use client"

/**
 * ── VISUAL AGENDA BUILDER ───────────────────────────────────────────
 *
 * Multi-track session scheduler with drag-drop, room allocation,
 * and conflict detection.
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import { createSession, updateSession, deleteSession } from "@/app/actions/sessionActions"
import { cn } from "@/lib/utils"
import {
  Plus, Trash2, Edit3, AlertTriangle, Clock, MapPin,
  ChevronDown, ChevronLeft, ChevronRight, Save, X,
  Coffee, Users, Mic2, GripVertical,
} from "lucide-react"

interface Session {
  id: string
  event_id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  track: string | null
  room: string | null
  session_type: string
  capacity: number | null
  color: string | null
  is_break: boolean
  sort_order: number
  speakers?: { name: string }[]
}

interface Event {
  id: string
  title: string
  start_date: string
  end_date: string
}

interface Conflict {
  sessionA: string
  sessionB: string
  type: "room" | "speaker" | "overlap"
  message: string
}

const TRACKS = ["Main Stage", "Workshop A", "Workshop B", "Networking", "Breakout"]
const ROOMS = ["Grand Ballroom", "Hall A", "Hall B", "Meeting Room 1", "Meeting Room 2", "Lounge"]
const TYPES = [
  { value: "keynote", label: "Keynote", icon: Mic2, color: "#e7ab1c" },
  { value: "session", label: "Session", icon: Users, color: "#3b82f6" },
  { value: "panel", label: "Panel", icon: Users, color: "#8b5cf6" },
  { value: "workshop", label: "Workshop", icon: Edit3, color: "#10b981" },
  { value: "break", label: "Break", icon: Coffee, color: "#94a3b8" },
  { value: "networking", label: "Networking", icon: Users, color: "#f43f5e" },
]
const HOUR_HEIGHT = 80

function timeToMinutes(iso: string) {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}

/* ── Session Card ────────────────────────────────────────────────────── */
function SessionCard({
  session, onEdit, onDelete, hasConflict,
}: {
  session: Session
  onEdit: () => void
  onDelete: () => void
  hasConflict: boolean
}) {
  const typeInfo = TYPES.find(t => t.value === session.session_type) || TYPES[1]
  const startMin = timeToMinutes(session.start_time)
  const endMin = timeToMinutes(session.end_time)
  const durationMin = endMin - startMin

  return (
    <div
      className={cn(
        "group relative rounded-lg border-l-[3px] px-3 py-2 cursor-pointer transition-all hover:shadow-md",
        hasConflict ? "bg-red-50 border-red-400" : "bg-white border-[#e0e0e0]",
      )}
      style={{ borderLeftColor: typeInfo.color, minHeight: "52px" }}
      onClick={onEdit}
    >
      {hasConflict && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
          <AlertTriangle size={10} className="text-white" />
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-[#333] truncate">{session.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-[#888] flex items-center gap-1">
              <Clock size={10} />
              {formatTime(session.start_time)} – {formatTime(session.end_time)}
            </span>
            {session.room && (
              <span className="text-[10px] text-[#888] flex items-center gap-1">
                <MapPin size={10} />
                {session.room}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-[#ccc] hover:text-red-500 transition-all"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}
        >
          {typeInfo.label}
        </span>
        {session.capacity && (
          <span className="text-[9px] text-[#aaa]">{session.capacity} seats</span>
        )}
      </div>
    </div>
  )
}

/* ── Session Form Modal ──────────────────────────────────────────────── */
function SessionFormModal({
  session, eventId, onClose, onSaved,
}: {
  session: Session | null
  eventId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError("")

    const fd = new FormData(e.currentTarget)
    fd.set("eventId", eventId)

    try {
      const result = session
        ? await updateSession(session.id, fd)
        : await createSession(fd)

      if (!result.success) {
        setError(result.error || "Failed to save")
      } else {
        onSaved()
        onClose()
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a2e]/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eee]">
          <h3 className="text-[16px] font-semibold text-[#333]">{session ? "Edit Session" : "Add Session"}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#f4f4f4]"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#666] mb-1">Title *</label>
            <input name="title" defaultValue={session?.title || ""} required className="w-full px-3 py-2 rounded-lg border border-[#ddd] text-[14px]" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#666] mb-1">Description</label>
            <textarea name="description" defaultValue={session?.description || ""} rows={3} className="w-full px-3 py-2 rounded-lg border border-[#ddd] text-[14px] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#666] mb-1">Start Time *</label>
              <input name="startTime" type="datetime-local" defaultValue={session?.start_time?.slice(0, 16) || ""} required className="w-full px-3 py-2 rounded-lg border border-[#ddd] text-[13px]" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#666] mb-1">End Time *</label>
              <input name="endTime" type="datetime-local" defaultValue={session?.end_time?.slice(0, 16) || ""} required className="w-full px-3 py-2 rounded-lg border border-[#ddd] text-[13px]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#666] mb-1">Track</label>
              <select name="track" defaultValue={session?.track || ""} className="w-full px-3 py-2 rounded-lg border border-[#ddd] text-[13px]">
                <option value="">None</option>
                {TRACKS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#666] mb-1">Room</label>
              <select name="room" defaultValue={session?.room || ""} className="w-full px-3 py-2 rounded-lg border border-[#ddd] text-[13px]">
                <option value="">None</option>
                {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#666] mb-1">Type</label>
              <select name="sessionType" defaultValue={session?.session_type || "session"} className="w-full px-3 py-2 rounded-lg border border-[#ddd] text-[13px]">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#666] mb-1">Capacity</label>
              <input name="capacity" type="number" defaultValue={session?.capacity || ""} className="w-full px-3 py-2 rounded-lg border border-[#ddd] text-[13px]" />
            </div>
          </div>

          {error && <p className="text-[13px] text-red-500">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] text-[#666] hover:text-[#333]">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-[#e7ab1c] text-white text-[13px] font-semibold hover:bg-[#d49c10] disabled:opacity-50">
              {saving ? "Saving..." : session ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */

export default function AgendaBuilderPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editSession, setEditSession] = useState<Session | null>(null)
  const [viewMode, setViewMode] = useState<"track" | "timeline" | "list">("track")

  // Load events
  useEffect(() => {
    async function load() {
      try {
        const { createBrowserClient } = await import("@supabase/ssr")
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
        )
        const { data } = await supabase.from("events").select("id, title, start_date, end_date").order("start_date", { ascending: false })
        if (data?.length) {
          setEvents(data)
          setSelectedEventId(data[0].id)
        }
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [])

  // Load sessions
  const loadSessions = useCallback(async () => {
    if (!selectedEventId) return
    try {
      const { createBrowserClient } = await import("@supabase/ssr")
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
      )
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("event_id", selectedEventId)
        .order("start_time", { ascending: true })
      setSessions(data || [])
    } catch {}
  }, [selectedEventId])

  useEffect(() => { loadSessions() }, [loadSessions])

  // Detect conflicts
  const conflicts = useMemo<Conflict[]>(() => {
    const result: Conflict[] = []
    for (let i = 0; i < sessions.length; i++) {
      for (let j = i + 1; j < sessions.length; j++) {
        const a = sessions[i], b = sessions[j]
        const aStart = new Date(a.start_time).getTime()
        const aEnd = new Date(a.end_time).getTime()
        const bStart = new Date(b.start_time).getTime()
        const bEnd = new Date(b.end_time).getTime()
        const overlaps = aStart < bEnd && bStart < aEnd

        if (overlaps && a.room && b.room && a.room === b.room) {
          result.push({
            sessionA: a.id, sessionB: b.id, type: "room",
            message: `"${a.title}" and "${b.title}" share room "${a.room}" at overlapping times`,
          })
        }
      }
    }
    return result
  }, [sessions])

  const conflictIds = new Set(conflicts.flatMap(c => [c.sessionA, c.sessionB]))

  // Group sessions by track
  const tracks = useMemo(() => {
    const trackMap = new Map<string, Session[]>()
    sessions.forEach(s => {
      const track = s.track || "Unassigned"
      if (!trackMap.has(track)) trackMap.set(track, [])
      trackMap.get(track)!.push(s)
    })
    return trackMap
  }, [sessions])

  // Group by date for timeline view
  const dates = useMemo(() => {
    const dateMap = new Map<string, Session[]>()
    sessions.forEach(s => {
      const date = s.start_time.split("T")[0]
      if (!dateMap.has(date)) dateMap.set(date, [])
      dateMap.get(date)!.push(s)
    })
    return dateMap
  }, [sessions])

  async function handleDelete(sessionId: string) {
    if (!confirm("Delete this session?")) return
    await deleteSession(sessionId)
    loadSessions()
  }

  return (
    <div className="p-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a1a2e]">Agenda Builder</h1>
          <p className="text-[13px] text-[#888] mt-0.5">
            {sessions.length} sessions · {conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="px-3 py-2 rounded-lg border border-[#ddd] text-[13px] bg-white"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>

          {/* View mode toggle */}
          <div className="flex rounded-lg border border-[#ddd] overflow-hidden">
            {(["track", "timeline", "list"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-3 py-1.5 text-[12px] font-medium capitalize",
                  viewMode === mode ? "bg-[#e7ab1c] text-white" : "bg-white text-[#666] hover:bg-[#f9f9f9]"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setEditSession(null); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e7ab1c] text-white text-[13px] font-semibold hover:bg-[#d49c10]"
          >
            <Plus size={15} /> Add Session
          </button>
        </div>
      </div>

      {/* Conflicts warning */}
      {conflicts.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-[14px] font-semibold text-red-700">{conflicts.length} Scheduling Conflict{conflicts.length > 1 ? "s" : ""}</span>
          </div>
          <ul className="space-y-1">
            {conflicts.map((c, i) => (
              <li key={i} className="text-[12px] text-red-600">• {c.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Track View */}
      {viewMode === "track" && (
        <div className="overflow-x-auto">
          <div className="flex gap-4" style={{ minWidth: `${Math.max(tracks.size, 3) * 320}px` }}>
            {Array.from(tracks.entries()).map(([trackName, trackSessions]) => (
              <div key={trackName} className="flex-1 min-w-[300px]">
                <div className="bg-[#f9f9f9] rounded-t-xl px-4 py-3 border border-[#e8e8e8] border-b-0">
                  <h3 className="text-[13px] font-semibold text-[#555]">{trackName}</h3>
                  <span className="text-[11px] text-[#aaa]">{trackSessions.length} sessions</span>
                </div>
                <div className="border border-[#e8e8e8] rounded-b-xl bg-[#fafafa] p-3 space-y-2 min-h-[200px]">
                  {trackSessions.map(s => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      hasConflict={conflictIds.has(s.id)}
                      onEdit={() => { setEditSession(s); setShowForm(true) }}
                      onDelete={() => handleDelete(s.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline View */}
      {viewMode === "timeline" && (
        <div className="space-y-6">
          {Array.from(dates.entries()).map(([date, daySessions]) => (
            <div key={date}>
              <h3 className="text-[15px] font-semibold text-[#333] mb-3">
                {new Date(date + "T00:00").toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
              </h3>
              <div className="bg-white rounded-xl border border-[#e8e8e8] divide-y divide-[#f0f0f0]">
                {daySessions.map(s => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#fafafa] transition-colors">
                    <div className="w-[100px] shrink-0">
                      <div className="text-[13px] font-semibold text-[#333]">{formatTime(s.start_time)}</div>
                      <div className="text-[11px] text-[#999]">{formatTime(s.end_time)}</div>
                    </div>
                    <div
                      className="w-1 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: TYPES.find(t => t.value === s.session_type)?.color || "#e0e0e0" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium text-[#333] truncate">{s.title}</div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {s.track && <span className="text-[11px] text-[#888]">{s.track}</span>}
                        {s.room && <span className="text-[11px] text-[#888] flex items-center gap-1"><MapPin size={9} />{s.room}</span>}
                      </div>
                    </div>
                    {conflictIds.has(s.id) && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setEditSession(s); setShowForm(true) }} className="p-1.5 rounded hover:bg-[#f0f0f0]">
                        <Edit3 size={13} className="text-[#999]" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-red-50">
                        <Trash2 size={13} className="text-[#ccc] hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-white rounded-xl border border-[#e8e8e8] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eee]">
                <th className="text-[11px] text-[#999] uppercase tracking-wider font-medium px-5 py-3">Title</th>
                <th className="text-[11px] text-[#999] uppercase tracking-wider font-medium px-5 py-3">Time</th>
                <th className="text-[11px] text-[#999] uppercase tracking-wider font-medium px-5 py-3">Track</th>
                <th className="text-[11px] text-[#999] uppercase tracking-wider font-medium px-5 py-3">Room</th>
                <th className="text-[11px] text-[#999] uppercase tracking-wider font-medium px-5 py-3">Type</th>
                <th className="text-[11px] text-[#999] uppercase tracking-wider font-medium px-5 py-3 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => {
                const typeInfo = TYPES.find(t => t.value === s.session_type) || TYPES[1]
                return (
                  <tr key={s.id} className={cn("border-b border-[#f4f4f4]", conflictIds.has(s.id) && "bg-red-50/50")}>
                    <td className="px-5 py-3 text-[13px] font-medium text-[#333]">{s.title}</td>
                    <td className="px-5 py-3 text-[12px] text-[#666]">{formatTime(s.start_time)} – {formatTime(s.end_time)}</td>
                    <td className="px-5 py-3 text-[12px] text-[#888]">{s.track || "—"}</td>
                    <td className="px-5 py-3 text-[12px] text-[#888]">{s.room || "—"}</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}>{typeInfo.label}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditSession(s); setShowForm(true) }} className="p-1.5 rounded hover:bg-[#f0f0f0]"><Edit3 size={13} className="text-[#999]" /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-red-50"><Trash2 size={13} className="text-[#ccc]" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {sessions.length === 0 && <div className="text-center py-12 text-[14px] text-[#aaa]">No sessions yet. Click "Add Session" to get started.</div>}
        </div>
      )}

      {/* Session Form Modal */}
      {showForm && (
        <SessionFormModal
          session={editSession}
          eventId={selectedEventId}
          onClose={() => { setShowForm(false); setEditSession(null) }}
          onSaved={loadSessions}
        />
      )}
    </div>
  )
}
