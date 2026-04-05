"use client"

/**
 * Admin Badges Page
 *
 * Generate and download printable badge/name tag PDFs for event attendees.
 * Supports filtering by All / VIP only / Checked-in only.
 */

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { getBadgeData } from "@/app/actions/badgeActions"

interface EventOption {
  id: string
  title: string
  start_date: string
  status: string
}

type BadgeFilter = "all" | "vip" | "checked_in"

export default function AdminBadgesPage() {
  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<BadgeFilter>("all")
  const [badgeCount, setBadgeCount] = useState<number | null>(null)
  const [counting, setCounting] = useState(false)
  const [generating, setGenerating] = useState(false)

  const supabase = createClient()

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("events")
      .select("id, title, start_date, status")
      .order("start_date", { ascending: false })

    if (data) {
      setEvents(data)
      if (data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].id)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Fetch badge count whenever event or filter changes
  useEffect(() => {
    if (!selectedEventId) return
    let cancelled = false

    async function fetchCount() {
      setCounting(true)
      setBadgeCount(null)
      const result = await getBadgeData(selectedEventId, filter)
      if (!cancelled) {
        setBadgeCount(result.badges?.length ?? 0)
        setCounting(false)
      }
    }

    fetchCount()
    return () => { cancelled = true }
  }, [selectedEventId, filter])

  const handleDownload = async () => {
    if (!selectedEventId) return
    setGenerating(true)

    try {
      const url = `/api/badges/${selectedEventId}?filter=${filter}`
      const response = await fetch(url)

      if (!response.ok) {
        const err = await response.json()
        alert(err.error || "Failed to generate badges")
        setGenerating(false)
        return
      }

      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `badges-${selectedEventId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      alert("Failed to generate badges: " + (err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#333] mb-1 flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="11" r="2" />
              <path d="M15 10h2" />
              <path d="M15 14h2" />
              <path d="M7 16c0-1.1.9-2 2-2h0c1.1 0 2 .9 2 2" />
            </svg>
            Badges
          </h2>
          <p className="text-sm text-[#888]">
            Generate printable badge PDFs for event attendees. 4 badges per A4 sheet.
          </p>
        </div>
      </div>

      {/* Event Selector */}
      <div className="mb-6">
        <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
          Select Event
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="px-4 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc] transition-colors min-w-[320px]"
        >
          {loading ? (
            <option>Loading events...</option>
          ) : events.length === 0 ? (
            <option>No events found</option>
          ) : (
            events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
                {ev.status !== "published" ? ` (${ev.status})` : ""}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Filter + Generate Card */}
      {selectedEventId && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 max-w-[600px]">
          {/* Filter */}
          <div className="mb-6">
            <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-2">
              Filter Attendees
            </label>
            <div className="flex gap-2">
              {(
                [
                  { value: "all", label: "All Registered" },
                  { value: "vip", label: "VIP Only" },
                  { value: "checked_in", label: "Checked-In Only" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === opt.value
                      ? "bg-[#e8f0fe] text-[#1a73e8] border border-[#1a73e8]/30"
                      : "bg-[#f0f0f0] text-[#555] hover:bg-[#e8e8e8] border border-transparent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview count */}
          <div className="mb-6 p-4 bg-[#f8f8f8] rounded-lg border border-[#e5e5e5]">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#555]">Badges to generate:</span>
              {counting ? (
                <span className="text-sm text-[#999]">Counting...</span>
              ) : (
                <span className="text-lg font-bold text-[#333]">
                  {badgeCount ?? 0}
                </span>
              )}
            </div>
            {badgeCount !== null && badgeCount > 0 && (
              <p className="text-xs text-[#999] mt-1">
                {Math.ceil(badgeCount / 4)} page{Math.ceil(badgeCount / 4) !== 1 ? "s" : ""} (4 badges per A4 sheet)
              </p>
            )}
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={generating || badgeCount === 0 || badgeCount === null}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              generating || badgeCount === 0 || badgeCount === null
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#1a73e8] text-white hover:bg-[#1557b0] shadow-sm"
            }`}
          >
            {generating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Badges PDF
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
