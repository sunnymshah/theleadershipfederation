"use client"

/**
 * ─── EVENT MANAGER ───────────────────────────────────────────────────────
 *
 * The main admin view for managing events. Features:
 *   - Data table with all events (Name, Dates, Venue, Status, Actions)
 *   - Search/filter bar
 *   - "New Event" button → slide-out drawer form
 *   - Delete with confirmation
 *   - Status badges with color coding
 *
 * Uses Supabase client for reads and Server Actions for writes.
 * After every mutation, revalidatePath is called in the Server Action,
 * and we refetch locally to keep the table in sync.
 */

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { createEvent, updateEvent, deleteEvent } from "@/app/actions/eventActions"
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Calendar,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────────
interface Event {
  id: string
  title: string
  slug: string
  start_date: string
  end_date: string
  venue: string
  status: string
  created_at: string
}

// ── Status badge config ──────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft:     { bg: "bg-yellow-500/10", text: "text-yellow-600" },
  published: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  completed: { bg: "bg-blue-500/10",   text: "text-blue-600" },
  cancelled: { bg: "bg-red-500/10",    text: "text-red-600" },
}

// ── Component ────────────────────────────────────────────────────────────
export default function AdminEventsPage() {
  const [events, setEvents]               = useState<Event[]>([])
  const [loading, setLoading]             = useState(true)
  const [searchQuery, setSearchQuery]     = useState("")
  const [drawerOpen, setDrawerOpen]       = useState(false)
  const [editingEvent, setEditingEvent]   = useState<Event | null>(null)
  const [submitting, setSubmitting]       = useState(false)
  const [actionError, setActionError]     = useState<string | null>(null)
  const [deletingId, setDeletingId]       = useState<string | null>(null)

  const supabase = createClient()

  // ── Fetch events ───────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("events")
      .select("id, title, slug, start_date, end_date, venue, status, created_at")
      .order("start_date", { ascending: false })

    if (!error && data) setEvents(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // ── Filtered events ────────────────────────────────────────────────
  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venue.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── Handle create / edit ────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setActionError(null)

    const fd = new FormData(e.currentTarget)
    const result = editingEvent
      ? await updateEvent(editingEvent.id, fd)
      : await createEvent(fd)

    if (result.success) {
      setDrawerOpen(false)
      setEditingEvent(null)
      await fetchEvents()
    } else {
      setActionError(result.error ?? "Operation failed")
    }

    setSubmitting(false)
  }

  function openEdit(event: Event) {
    setEditingEvent(event)
    setDrawerOpen(true)
    setActionError(null)
  }

  function openCreate() {
    setEditingEvent(null)
    setDrawerOpen(true)
    setActionError(null)
  }

  // ── Handle delete ──────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm("Delete this event? This also removes its tickets and speakers.")) return

    setDeletingId(id)
    const result = await deleteEvent(id)

    if (result.success) {
      await fetchEvents()
    } else {
      setActionError(result.error ?? "Failed to delete event")
    }

    setDeletingId(null)
  }

  // ── Format date ────────────────────────────────────────────────────
  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="p-8">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#333] mb-1">Events</h2>
          <p className="text-sm text-[#888]">
            Create, edit, and manage all events
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] transition-colors"
        >
          <Plus size={16} />
          New Event
        </button>
      </div>

      {/* ── Search Bar ───────────────────────────────────────────── */}
      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search events by name or venue…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
        />
      </div>

      {/* ── Error Banner ─────────────────────────────────────────── */}
      {actionError && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400/50 hover:text-red-400">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Data Table ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#aaa] gap-2">
            <Loader2 size={18} className="animate-spin" />
            Loading events…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar size={32} className="mx-auto mb-3 text-[#ccc]" />
            <p className="text-[#999] text-sm">
              {searchQuery
                ? "No events match your search."
                : "No events yet. Create your first event."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] bg-white">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                  Event Name
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                  Dates
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                  Venue
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#888] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-[#eee] last:border-0 hover:bg-[#fafafa] transition-colors"
                >
                  <td className="px-5 py-4">
                    <Link href={`/admin/events/${event.id}`} className="block group/link">
                      <div className="font-medium text-[#333] group-hover/link:text-[#c9a84c] transition-colors">
                        {event.title}
                      </div>
                      <div className="text-[11px] text-[#aaa] mt-0.5">
                        /{event.slug}
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-[#777] text-xs whitespace-nowrap">
                    {fmtDate(event.start_date)} — {fmtDate(event.end_date)}
                  </td>
                  <td className="px-5 py-4 text-[#777]">{event.venue}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider",
                        STATUS_STYLES[event.status]?.bg ?? "bg-gray-100",
                        STATUS_STYLES[event.status]?.text ?? "text-[#888]"
                      )}
                    >
                      {event.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="p-2 rounded-md text-[#aaa] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors"
                        title="Manage event"
                      >
                        <ExternalLink size={15} />
                      </Link>
                      <button
                        onClick={() => openEdit(event)}
                        className="p-2 rounded-md text-[#aaa] hover:text-[#555] hover:bg-gray-100 transition-colors"
                        title="Edit event"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={deletingId === event.id}
                        className="p-2 rounded-md text-[#aaa] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                        title="Delete event"
                      >
                        {deletingId === event.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create Event Drawer (slides in from right) ───────────── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => { setDrawerOpen(false); setEditingEvent(null) }}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#e0e0e0] z-50 shadow-2xl overflow-y-auto">
            {/* Drawer header */}
            <div className="sticky top-0 bg-white border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-[#333]">
                {editingEvent ? "Edit Event" : "Create New Event"}
              </h3>
              <button
                onClick={() => { setDrawerOpen(false); setEditingEvent(null) }}
                className="p-1.5 rounded-md text-[#888] hover:text-[#555] hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingEvent?.title ?? ""}
                  className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  placeholder="Asia Leadership Summit 2025"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  URL Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  required
                  defaultValue={editingEvent?.slug ?? ""}
                  className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  placeholder="asia-leadership-summit-2025"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    required
                    defaultValue={editingEvent ? new Date(editingEvent.start_date).toISOString().slice(0, 16) : ""}
                    className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    required
                    defaultValue={editingEvent ? new Date(editingEvent.end_date).toISOString().slice(0, 16) : ""}
                    className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Venue *
                </label>
                <input
                  type="text"
                  name="venue"
                  required
                  defaultValue={editingEvent?.venue ?? ""}
                  className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  placeholder="Jio World Centre, Mumbai"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue=""
                  className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder-[#ccc] focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none"
                  placeholder="Brief overview of the event…"
                />
              </div>

              {/* Status (only when editing) */}
              {editingEvent && (
              <div>
                <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={editingEvent.status}
                  className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              )}

              {/* Error inside drawer */}
              {actionError && (
                <div className="px-3 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15 text-red-400 text-sm">
                  {actionError}
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setDrawerOpen(false); setEditingEvent(null) }}
                  className="flex-1 py-2.5 rounded-lg border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-[#fafafa] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-bold hover:bg-[#d4b85c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving…
                    </>
                  ) : editingEvent ? (
                    "Update Event"
                  ) : (
                    "Create Event"
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
