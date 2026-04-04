"use client"

import { useState, useEffect, useCallback } from "react"
import {
  getCheckInStats,
  getRecentCheckIns,
  getActiveEvents,
} from "@/app/actions/checkInActions"
import QrScanner from "@/components/admin/QrScanner"
import {
  ScanLine,
  Users,
  UserCheck,
  Clock,
  ChevronDown,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────── */
/*  Types                                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

interface Event {
  id: string
  title: string
  slug: string
  start_date: string
  status: string
}

interface Stats {
  total: number
  checkedIn: number
  pending: number
}

interface RecentCheckIn {
  id: string
  name: string
  email: string
  company: string | null
  check_in_at: string | null
  tickets: { name: string } | null
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Page Component                                                         */
/* ──────────────────────────────────────────────────────────────────────── */

export default function CheckInPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({ total: 0, checkedIn: 0, pending: 0 })
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)

  /* ── Fetch events on mount ─────────────────────────────────────────── */
  useEffect(() => {
    async function fetchEvents() {
      try {
        const result = await getActiveEvents()
        if (result.success) {
          setEvents(result.events as Event[])
          if (result.events.length > 0) {
            setSelectedEventId(result.events[0].id)
          }
        }
      } catch {
        // Fallback: no events
      } finally {
        setLoadingEvents(false)
      }
    }
    fetchEvents()
  }, [])

  /* ── Refresh stats and recent check-ins ────────────────────────────── */
  const refreshData = useCallback(async () => {
    if (!selectedEventId) return
    setLoadingStats(true)
    try {
      const [statsResult, recentResult] = await Promise.all([
        getCheckInStats(selectedEventId),
        getRecentCheckIns(selectedEventId),
      ])
      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats)
      }
      if (recentResult.success) {
        setRecentCheckIns(recentResult.checkIns as RecentCheckIn[])
      }
    } catch {
      // silent
    } finally {
      setLoadingStats(false)
    }
  }, [selectedEventId])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  /* ── After check-in callback ───────────────────────────────────────── */
  function handleCheckIn() {
    refreshData()
  }

  /* ── Helpers ───────────────────────────────────────────────────────── */
  const percentage = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0

  function formatTime(dateStr: string | null) {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  }

  /* ──────────────────────────────────────────────────────────────────── */
  /*  Render                                                              */
  /* ──────────────────────────────────────────────────────────────────── */

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
            <ScanLine size={20} className="text-[#c9a84c]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#333]">Event Check-In</h2>
            <p className="text-sm text-[#888]">
              Scan QR codes to check in attendees at the venue
            </p>
          </div>
        </div>
      </div>

      {/* ── Event selector ───────────────────────────────────────── */}
      <div className="mb-6">
        <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
          Select Event
        </label>
        {loadingEvents ? (
          <div className="flex items-center gap-2 text-[#aaa] text-sm py-3">
            <Loader2 size={14} className="animate-spin" /> Loading events...
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-[#aaa]">No active events found.</p>
        ) : (
          <div className="relative">
            <select
              value={selectedEventId ?? ""}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full appearance-none px-4 py-3 pr-10 bg-white border border-[#e0e0e0] rounded-xl text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50 transition-colors cursor-pointer"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id} className="bg-white text-[#333]">
                  {event.title} — {new Date(event.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] pointer-events-none" />
          </div>
        )}
      </div>

      {/* ── Stats cards ──────────────────────────────────────────── */}
      {selectedEventId && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-xl border border-[#e0e0e0] bg-white">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-blue-400" />
              <span className="text-[10px] text-[#888] uppercase tracking-wider font-semibold">Registered</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {loadingStats ? "—" : stats.total}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02]">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck size={14} className="text-emerald-400" />
              <span className="text-[10px] text-[#888] uppercase tracking-wider font-semibold">Checked In</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {loadingStats ? "—" : stats.checkedIn}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-[#c9a84c]/10 bg-[#c9a84c]/[0.02]">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-[#c9a84c]" />
              <span className="text-[10px] text-[#888] uppercase tracking-wider font-semibold">Pending</span>
            </div>
            <p className="text-2xl font-bold text-[#c9a84c]">
              {loadingStats ? "—" : stats.pending}
            </p>
          </div>
        </div>
      )}

      {/* ── Progress bar ─────────────────────────────────────────── */}
      {selectedEventId && stats.total > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#888]">Check-in progress</span>
            <span className="text-xs font-bold text-[#c9a84c]">{percentage}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#e0e0e0] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#c9a84c] to-emerald-400 transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-[10px] text-[#bbb] mt-1.5">
            {stats.checkedIn} of {stats.total} attendees checked in
          </p>
        </div>
      )}

      {/* ── QR Scanner ───────────────────────────────────────────── */}
      {selectedEventId && (
        <QrScanner selectedEventId={selectedEventId} onCheckIn={handleCheckIn} />
      )}

      {/* ── Recent check-ins ─────────────────────────────────────── */}
      {selectedEventId && recentCheckIns.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-[#666] uppercase tracking-wider mb-3">
            Recent Check-Ins
          </h3>
          <div className="rounded-xl border border-[#e0e0e0] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] bg-white">
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#888] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#888] uppercase tracking-wider hidden sm:table-cell">
                    Company
                  </th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#888] uppercase tracking-wider hidden md:table-cell">
                    Ticket
                  </th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[#888] uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentCheckIns.map((ci) => (
                  <tr
                    key={ci.id}
                    className="border-b border-[#eee] last:border-0 hover:bg-[#fafafa] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#333] text-xs">{ci.name}</div>
                      <div className="text-[10px] text-[#aaa]">{ci.email}</div>
                    </td>
                    <td className="px-4 py-3 text-[#777] text-xs hidden sm:table-cell">
                      {ci.company ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[#777] text-xs hidden md:table-cell">
                      {ci.tickets?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-emerald-400/80 text-xs font-mono">
                        {formatTime(ci.check_in_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
