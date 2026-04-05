"use client"

/**
 * ── ADMIN FEEDBACK PAGE ──────────────────────────────────────────────────
 *
 * View and manage post-event feedback / survey responses.
 * Aggregate stats, individual responses, CSV export.
 */

import { useState, useEffect, useCallback } from "react"
import { getActiveEvents } from "@/app/actions/checkInActions"
import {
  getFeedbackSummary,
  getFeedbackList,
  exportFeedbackCSV,
  sendFeedbackRequest,
} from "@/app/actions/feedbackActions"
import {
  Loader2,
  ChevronDown,
  Star,
  Download,
  Send,
  MessageSquare,
  TrendingUp,
  Users,
  ThumbsUp,
  ChevronRight,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Types ────────────────────────────────────────────────────────────── */

interface Event {
  id: string
  title: string
  slug: string
  start_date: string
  status: string
}

interface Summary {
  responseCount: number
  averageOverall: number
  averageContent: number
  averageVenue: number
  averageOrganization: number
  averageSpeaker: number
  nps: number
}

interface FeedbackRow {
  id: string
  attendee_name: string | null
  attendee_email: string
  overall_rating: number | null
  content_rating: number | null
  venue_rating: number | null
  organization_rating: number | null
  speaker_rating: number | null
  would_recommend: boolean | null
  best_part: string | null
  improvement: string | null
  additional_comments: string | null
  submitted_at: string
}

/* ── Star Display ─────────────────────────────────────────────────────── */

function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={cn(
            "transition-colors",
            i < Math.round(rating)
              ? "fill-[#c9a84c] text-[#c9a84c]"
              : "fill-none text-[#ddd]"
          )}
        />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
 *  MAIN PAGE
 * ═══════════════════════════════════════════════════════════════════════ */

export default function AdminFeedbackPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [summary, setSummary] = useState<Summary | null>(null)
  const [feedback, setFeedback] = useState<FeedbackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Load events
  useEffect(() => {
    async function load() {
      const res = await getActiveEvents()
      if (res.success && res.events.length > 0) {
        setEvents(res.events)
        setSelectedEventId(res.events[0].id)
      }
      setLoading(false)
    }
    load()
  }, [])

  // Load feedback data when event changes
  const loadFeedback = useCallback(async () => {
    if (!selectedEventId) return
    setLoadingData(true)
    const [sumRes, listRes] = await Promise.all([
      getFeedbackSummary(selectedEventId),
      getFeedbackList(selectedEventId),
    ])
    if (sumRes.success && sumRes.summary) setSummary(sumRes.summary)
    if (listRes.success) setFeedback(listRes.feedback)
    setLoadingData(false)
  }, [selectedEventId])

  useEffect(() => {
    loadFeedback()
  }, [loadFeedback])

  async function handleExportCSV() {
    setExporting(true)
    const res = await exportFeedbackCSV(selectedEventId)
    if (res.success && res.csv) {
      const blob = new Blob([res.csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `feedback-${selectedEventId}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      setToast(res.error ?? "Export failed")
    }
    setExporting(false)
  }

  async function handleSendRequest() {
    setSending(true)
    const res = await sendFeedbackRequest(selectedEventId, [])
    setToast(res.success ? (res.message ?? "Feedback request sent.") : (res.error ?? "Failed."))
    setSending(false)
    setTimeout(() => setToast(null), 5000)
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-[#aaa] gap-2">
        <Loader2 size={20} className="animate-spin" /> Loading...
      </div>
    )
  }

  const ratingCategories = summary
    ? [
        { label: "Overall", value: summary.averageOverall },
        { label: "Content", value: summary.averageContent },
        { label: "Venue", value: summary.averageVenue },
        { label: "Organization", value: summary.averageOrganization },
        { label: "Speakers", value: summary.averageSpeaker },
      ]
    : []

  return (
    <div>
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#333]">Feedback</h1>
          <p className="text-sm text-[#888] mt-0.5">Post-event survey responses and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSendRequest}
            disabled={sending || !selectedEventId}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e0e0e0] text-sm text-[#555] hover:bg-[#fafafa] transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Send Feedback Request
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exporting || feedback.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a84c] text-white text-sm font-bold hover:bg-[#d4b85c] transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Event Selector ───────────────────────────────────────── */}
      {events.length > 1 && (
        <div className="mb-6">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#c9a84c]/50"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        </div>
      )}

      {loadingData ? (
        <div className="flex items-center justify-center py-24 text-[#aaa] gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading feedback...
        </div>
      ) : (
        <>
          {/* ── Summary Cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-[#e0e0e0] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Star size={16} className="text-[#c9a84c]" />
                <span className="text-[11px] text-[#888] uppercase tracking-wider font-semibold">Avg Rating</span>
              </div>
              <p className="text-2xl font-bold text-[#333]">{summary?.averageOverall?.toFixed(1) ?? "0.0"}</p>
              <Stars rating={summary?.averageOverall ?? 0} />
            </div>
            <div className="bg-white rounded-xl border border-[#e0e0e0] p-5">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={16} className="text-blue-500" />
                <span className="text-[11px] text-[#888] uppercase tracking-wider font-semibold">Responses</span>
              </div>
              <p className="text-2xl font-bold text-[#333]">{summary?.responseCount ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#e0e0e0] p-5">
              <div className="flex items-center gap-2 mb-2">
                <ThumbsUp size={16} className="text-emerald-500" />
                <span className="text-[11px] text-[#888] uppercase tracking-wider font-semibold">Would Recommend</span>
              </div>
              <p className="text-2xl font-bold text-[#333]">{summary?.nps ?? 0}%</p>
            </div>
            <div className="bg-white rounded-xl border border-[#e0e0e0] p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-purple-500" />
                <span className="text-[11px] text-[#888] uppercase tracking-wider font-semibold">Feedback Link</span>
              </div>
              <p className="text-xs text-[#c9a84c] font-medium truncate">
                /feedback/{selectedEvent?.slug ?? ""}
              </p>
            </div>
          </div>

          {/* ── Rating Breakdown ───────────────────────────────────── */}
          {summary && summary.responseCount > 0 && (
            <div className="bg-white rounded-xl border border-[#e0e0e0] p-6 mb-8">
              <h2 className="text-sm font-semibold text-[#333] mb-4">Rating Breakdown</h2>
              <div className="space-y-4">
                {ratingCategories.map((cat) => (
                  <div key={cat.label} className="flex items-center gap-4">
                    <span className="text-sm text-[#555] w-28 shrink-0">{cat.label}</span>
                    <Stars rating={cat.value} />
                    <span className="text-sm text-[#888] tabular-nums ml-2">{cat.value.toFixed(1)}</span>
                    <div className="flex-1 h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#c9a84c] transition-all"
                        style={{ width: `${(cat.value / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Individual Responses Table ──────────────────────────── */}
          <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e8e8e8]">
              <h2 className="text-sm font-semibold text-[#333]">
                Individual Responses ({feedback.length})
              </h2>
            </div>
            {feedback.length === 0 ? (
              <div className="py-16 text-center">
                <MessageSquare size={28} className="mx-auto mb-3 text-[#ccc]" />
                <p className="text-[#999] text-sm">No feedback yet.</p>
                <p className="text-[#bbb] text-xs mt-1">Responses will appear here once attendees submit feedback.</p>
              </div>
            ) : (
              <div>
                {feedback.map((fb) => {
                  const isExpanded = expandedId === fb.id
                  return (
                    <div key={fb.id} className="border-b border-[#eee] last:border-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : fb.id)}
                        className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-[#fafafa] transition-colors"
                      >
                        <ChevronRight
                          size={14}
                          className={cn("text-[#bbb] transition-transform shrink-0", isExpanded && "rotate-90")}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#333] truncate">
                            {fb.attendee_name || "Anonymous"}
                          </p>
                          <p className="text-[11px] text-[#aaa] truncate">{fb.attendee_email}</p>
                        </div>
                        <div className="shrink-0">
                          <Stars rating={fb.overall_rating ?? 0} />
                        </div>
                        <span className="text-[11px] text-[#bbb] tabular-nums shrink-0 w-24 text-right">
                          {new Date(fb.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="px-6 pb-5 pl-14 space-y-3">
                          <div className="grid grid-cols-5 gap-3">
                            {[
                              { label: "Overall", v: fb.overall_rating },
                              { label: "Content", v: fb.content_rating },
                              { label: "Venue", v: fb.venue_rating },
                              { label: "Organization", v: fb.organization_rating },
                              { label: "Speakers", v: fb.speaker_rating },
                            ].map((r) => (
                              <div key={r.label} className="text-center p-3 bg-[#fafafa] rounded-lg">
                                <p className="text-[10px] text-[#888] uppercase tracking-wider mb-1">{r.label}</p>
                                <Stars rating={r.v ?? 0} />
                              </div>
                            ))}
                          </div>
                          {fb.would_recommend !== null && (
                            <p className="text-sm text-[#555]">
                              <span className="text-[#888]">Would recommend:</span>{" "}
                              <span className={fb.would_recommend ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
                                {fb.would_recommend ? "Yes" : "No"}
                              </span>
                            </p>
                          )}
                          {fb.best_part && (
                            <div>
                              <p className="text-[10px] text-[#888] uppercase tracking-wider mb-1">Best Part</p>
                              <p className="text-sm text-[#555] bg-[#fafafa] rounded-lg p-3">{fb.best_part}</p>
                            </div>
                          )}
                          {fb.improvement && (
                            <div>
                              <p className="text-[10px] text-[#888] uppercase tracking-wider mb-1">Improvement</p>
                              <p className="text-sm text-[#555] bg-[#fafafa] rounded-lg p-3">{fb.improvement}</p>
                            </div>
                          )}
                          {fb.additional_comments && (
                            <div>
                              <p className="text-[10px] text-[#888] uppercase tracking-wider mb-1">Additional Comments</p>
                              <p className="text-sm text-[#555] bg-[#fafafa] rounded-lg p-3">{fb.additional_comments}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 bg-[#333] text-white rounded-xl shadow-2xl text-sm">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-white/40 hover:text-white"><X size={14} /></button>
        </div>
      )}
    </div>
  )
}
