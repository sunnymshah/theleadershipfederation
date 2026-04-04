"use client"

import { useState, useEffect } from "react"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/client"
import { createEvent, updateEvent, deleteEvent } from "@/app/actions/eventActions"
import { Plus, Edit2, Trash2, ChevronDown } from "lucide-react"

/**
 * Events Manager Page
 *
 * Displays a data table of all events and allows admins to:
 * - Create new events (form overlay)
 * - Edit existing events
 * - Delete events
 *
 * Uses Server Actions for mutations with strict cache invalidation.
 */
export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // ── Fetch events on mount ────────────────────────────────────────────
  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    setLoading(true)
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("start_date", { ascending: false })

    if (error) {
      setError("Failed to load events")
      console.error(error)
    } else {
      setEvents(data || [])
    }
    setLoading(false)
  }

  // ── Handle create event ──────────────────────────────────────────────
  async function handleCreateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createEvent(formData)

    if (result.success) {
      setShowCreateForm(false)
      ;(e.target as HTMLFormElement).reset()
      await fetchEvents() // Refetch to show new event
    } else {
      setError(result.error || "Failed to create event")
    }
    setSubmitting(false)
  }

  // ── Handle delete event ──────────────────────────────────────────────
  async function handleDeleteEvent(eventId: string) {
    if (!confirm("Are you sure you want to delete this event?")) return

    setSubmitting(true)
    const result = await deleteEvent(eventId)

    if (result.success) {
      await fetchEvents()
    } else {
      setError(result.error || "Failed to delete event")
    }
    setSubmitting(false)
  }

  // ── Format date for display ──────────────────────────────────────────
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // ── Status badge styling ─────────────────────────────────────────────
  const statusStyle: Record<string, string> = {
    draft: "bg-yellow-500/10 text-yellow-400",
    published: "bg-emerald-500/10 text-emerald-400",
    completed: "bg-blue-500/10 text-blue-400",
    cancelled: "bg-red-500/10 text-red-400",
  }

  return (
    <div className="p-8">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white/90 mb-1">Events</h2>
          <p className="text-sm text-white/40">
            Manage all events, tickets, and speaker lineups
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#c9a84c] text-[#0a0a0a] text-sm font-semibold hover:bg-[#d4b85c] transition-colors"
        >
          <Plus size={16} />
          New Event
        </button>
      </div>

      {/* ─── Error Message ──────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto block text-xs text-red-400/60 hover:text-red-400 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Create Event Form (Overlay) ────────────────────────────── */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center">
          <div className="bg-[#050505] rounded-lg border border-white/[0.08] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-white/90 mb-4">
              Create New Event
            </h3>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded text-white/90 placeholder-white/20 focus:border-[#c9a84c]/50 outline-none text-sm"
                  placeholder="e.g., Asia Leadership Summit 2025"
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  required
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded text-white/90 placeholder-white/20 focus:border-[#c9a84c]/50 outline-none text-sm"
                  placeholder="e.g., asia-leadership-2025"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    required
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded text-white/90 focus:border-[#c9a84c]/50 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    required
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded text-white/90 focus:border-[#c9a84c]/50 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1">
                  Venue *
                </label>
                <input
                  type="text"
                  name="venue"
                  required
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded text-white/90 placeholder-white/20 focus:border-[#c9a84c]/50 outline-none text-sm"
                  placeholder="e.g., Jio World Centre, Mumbai"
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded text-white/90 placeholder-white/20 focus:border-[#c9a84c]/50 outline-none text-sm resize-none"
                  rows={3}
                  placeholder="Event details..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 text-sm rounded border border-white/[0.08] text-white/60 hover:text-white/90 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-sm rounded bg-[#c9a84c] text-[#0a0a0a] font-semibold hover:bg-[#d4b85c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Events Table ───────────────────────────────────────────── */}
      <div className="border border-white/[0.06] rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/40">
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-white/40">
            No events yet. Create your first event to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-6 py-3 text-xs font-medium text-white/40 tracking-wide">
                  Event Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-white/40 tracking-wide">
                  Dates
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-white/40 tracking-wide">
                  Venue
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-white/40 tracking-wide">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-white/40 tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-white/90">
                    {event.title}
                  </td>
                  <td className="px-6 py-4 text-white/50 text-xs">
                    {formatDate(event.start_date)} to{" "}
                    {formatDate(event.end_date)}
                  </td>
                  <td className="px-6 py-4 text-white/50">{event.venue}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded text-[11px] font-semibold tracking-wide uppercase ${
                        statusStyle[event.status] ||
                        "bg-white/[0.05] text-white/40"
                      }`}
                    >
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button className="p-2 text-white/40 hover:text-white/70 hover:bg-white/[0.05] rounded transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      disabled={submitting}
                      className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
