"use client"

/**
 * ── ADMIN LIVE Q&A PAGE ─────────────────────────────────────────────────
 *
 * Moderation dashboard for managing live Q&A questions.
 * Approve, reject, answer, pin, and delete audience questions.
 * Auto-refreshes every 10 seconds when on the Pending tab.
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { getActiveEvents } from "@/app/actions/checkInActions"
import {
  getEventQuestions,
  approveQuestion,
  rejectQuestion,
  answerQuestion,
  pinQuestion,
  deleteQuestion,
  getLiveQAStats,
} from "@/app/actions/qaActions"
import {
  MessageSquare,
  Check,
  X,
  Pin,
  Trash2,
  ThumbsUp,
  Send,
  RefreshCw,
  Loader2,
  ChevronDown,
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

interface Question {
  id: string
  event_id: string
  session_id: string | null
  attendee_id: string | null
  author_name: string | null
  question: string
  answer: string | null
  answered_by: string | null
  answered_at: string | null
  status: "pending" | "approved" | "answered" | "rejected"
  upvotes: number
  is_anonymous: boolean
  is_featured: boolean
  created_at: string
}

interface Stats {
  total: number
  pending: number
  approved: number
  answered: number
}

type TabKey = "all" | "pending" | "approved" | "answered" | "rejected"

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "answered", label: "Answered" },
  { key: "rejected", label: "Rejected" },
]

/* ── Status Badge ────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: Question["status"] }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    answered: "bg-blue-50 text-blue-700 border-blue-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border",
        styles[status] ?? "bg-gray-50 text-gray-600 border-gray-200"
      )}
    >
      {status}
    </span>
  )
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/* ═══════════════════════════════════════════════════════════════════════
 *  MAIN PAGE
 * ═══════════════════════════════════════════════════════════════════════ */

export default function AdminQAPage() {
  /* ── State ─────────────────────────────────────────────────────────── */

  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, answered: 0 })
  const [activeTab, setActiveTab] = useState<TabKey>("all")
  const [loading, setLoading] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [answeringId, setAnsweringId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState("")
  const [toast, setToast] = useState<string | null>(null)

  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── Load events on mount ──────────────────────────────────────────── */

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

  /* ── Fetch questions + stats ───────────────────────────────────────── */

  const fetchData = useCallback(
    async (silent = false) => {
      if (!selectedEventId) return
      if (!silent) setLoadingData(true)
      else setRefreshing(true)

      const statusFilter = activeTab === "all" ? undefined : activeTab
      const [qRes, sRes] = await Promise.all([
        getEventQuestions(selectedEventId, statusFilter),
        getLiveQAStats(selectedEventId),
      ])

      if (qRes.success) setQuestions(qRes.questions as Question[])
      if (sRes.success) setStats(sRes.stats)

      if (!silent) setLoadingData(false)
      else setRefreshing(false)
    },
    [selectedEventId, activeTab]
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* ── Auto-refresh on Pending tab (every 10s) ───────────────────────── */

  useEffect(() => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current)
      autoRefreshRef.current = null
    }

    if (activeTab === "pending" && selectedEventId) {
      autoRefreshRef.current = setInterval(() => {
        fetchData(true)
      }, 10_000)
    }

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current)
        autoRefreshRef.current = null
      }
    }
  }, [activeTab, selectedEventId, fetchData])

  /* ── Helpers ───────────────────────────────────────────────────────── */

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  function setActionBusy(id: string, busy: boolean) {
    setActionLoading((prev) => ({ ...prev, [id]: busy }))
  }

  /* ── Actions ───────────────────────────────────────────────────────── */

  async function handleApprove(id: string) {
    setActionBusy(id, true)
    const res = await approveQuestion(id)
    if (res.success) {
      showToast("Question approved")
      fetchData(true)
    } else {
      showToast(res.error ?? "Failed to approve")
    }
    setActionBusy(id, false)
  }

  async function handleReject(id: string) {
    setActionBusy(id, true)
    const res = await rejectQuestion(id)
    if (res.success) {
      showToast("Question rejected")
      fetchData(true)
    } else {
      showToast(res.error ?? "Failed to reject")
    }
    setActionBusy(id, false)
  }

  async function handleAnswer(id: string) {
    if (!answerText.trim()) return
    setActionBusy(id, true)
    const res = await answerQuestion(id, answerText, "Admin")
    if (res.success) {
      showToast("Answer submitted")
      setAnsweringId(null)
      setAnswerText("")
      fetchData(true)
    } else {
      showToast(res.error ?? "Failed to answer")
    }
    setActionBusy(id, false)
  }

  async function handlePin(id: string) {
    setActionBusy(id, true)
    const res = await pinQuestion(id)
    if (res.success) {
      showToast(res.is_featured ? "Question pinned" : "Question unpinned")
      fetchData(true)
    } else {
      showToast(res.error ?? "Failed to toggle pin")
    }
    setActionBusy(id, false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this question? This cannot be undone.")) return
    setActionBusy(id, true)
    const res = await deleteQuestion(id)
    if (res.success) {
      showToast("Question deleted")
      fetchData(true)
    } else {
      showToast(res.error ?? "Failed to delete")
    }
    setActionBusy(id, false)
  }

  /* ── Render ────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-[#aaa] gap-2">
        <Loader2 size={20} className="animate-spin" /> Loading...
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-[#999]">
        <MessageSquare size={32} className="mb-3 text-[#ccc]" />
        <p className="text-sm">No events available.</p>
      </div>
    )
  }

  return (
    <div>
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#333]">Live Q&A</h1>
          <p className="text-sm text-[#888] mt-0.5">Moderate audience questions in real time</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e0e0e0] text-sm text-[#555] hover:bg-[#fafafa] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={cn(refreshing && "animate-spin")} />
          Refresh
        </button>
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
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Stats Bar ────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Questions", value: stats.total, icon: MessageSquare, color: "text-[#555]", bg: "bg-[#f4f5f7]" },
          { label: "Pending", value: stats.pending, icon: RefreshCw, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Approved", value: stats.approved, icon: Check, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Answered", value: stats.answered, icon: Send, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#e0e0e0] p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", s.bg)}>
                <s.icon size={15} className={s.color} />
              </div>
              <span className="text-[11px] text-[#888] uppercase tracking-wider font-semibold">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-[#333] tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden">
        <div className="flex items-center border-b border-[#e8e8e8] px-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab.key
                  ? "border-[#c9a84c] text-[#333]"
                  : "border-transparent text-[#999] hover:text-[#555]"
              )}
            >
              {tab.label}
              {tab.key === "pending" && stats.pending > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}

          {/* Auto-refresh indicator */}
          {activeTab === "pending" && (
            <div className="ml-auto flex items-center gap-1.5 text-[11px] text-[#bbb]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Auto-refreshing
            </div>
          )}
        </div>

        {/* ── Question List ──────────────────────────────────────── */}
        {loadingData ? (
          <div className="flex items-center justify-center py-24 text-[#aaa] gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading questions...
          </div>
        ) : questions.length === 0 ? (
          <div className="py-20 text-center">
            <MessageSquare size={28} className="mx-auto mb-3 text-[#ccc]" />
            <p className="text-[#999] text-sm">No questions found.</p>
            <p className="text-[#bbb] text-xs mt-1">
              {activeTab === "all"
                ? "Questions will appear here once attendees start asking."
                : `No ${activeTab} questions at the moment.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#eee]">
            {questions.map((q) => {
              const isBusy = actionLoading[q.id] ?? false
              const isAnswering = answeringId === q.id

              return (
                <div
                  key={q.id}
                  className={cn(
                    "px-6 py-4 transition-colors hover:bg-[#fafafa]",
                    q.is_featured && "bg-amber-50/40 border-l-2 border-l-[#c9a84c]"
                  )}
                >
                  {/* ── Question Header ─────────────────────────── */}
                  <div className="flex items-start gap-4">
                    {/* Upvote count */}
                    <div className="flex flex-col items-center pt-0.5 shrink-0 w-10">
                      <ThumbsUp size={14} className="text-[#bbb] mb-0.5" />
                      <span className="text-xs font-bold text-[#666] tabular-nums">{q.upvotes}</span>
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-[#333]">
                          {q.is_anonymous || !q.author_name ? "Anonymous" : q.author_name}
                        </span>
                        <StatusBadge status={q.status} />
                        {q.is_featured && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20">
                            <Pin size={9} /> Pinned
                          </span>
                        )}
                        <span className="text-[11px] text-[#bbb] ml-auto shrink-0">{timeAgo(q.created_at)}</span>
                      </div>

                      <p className="text-sm text-[#555] leading-relaxed">{q.question}</p>

                      {/* ── Answer Display ───────────────────────── */}
                      {q.status === "answered" && q.answer && (
                        <div className="mt-3 pl-4 border-l-2 border-blue-200 bg-blue-50/50 rounded-r-lg p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Send size={11} className="text-blue-500" />
                            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                              Answer
                            </span>
                            {q.answered_by && (
                              <span className="text-[10px] text-blue-400">by {q.answered_by}</span>
                            )}
                          </div>
                          <p className="text-sm text-[#555] leading-relaxed">{q.answer}</p>
                        </div>
                      )}

                      {/* ── Inline Answer Input ──────────────────── */}
                      {isAnswering && (
                        <div className="mt-3 flex items-start gap-2">
                          <textarea
                            autoFocus
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            placeholder="Type your answer..."
                            rows={2}
                            className="flex-1 px-3 py-2 border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder:text-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 resize-none"
                          />
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              onClick={() => handleAnswer(q.id)}
                              disabled={isBusy || !answerText.trim()}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {isBusy ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                              Submit
                            </button>
                            <button
                              onClick={() => { setAnsweringId(null); setAnswerText("") }}
                              className="px-3 py-2 rounded-lg border border-[#e0e0e0] text-[#888] text-xs hover:bg-[#fafafa] transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ── Action Buttons ───────────────────────── */}
                      <div className="flex items-center gap-1.5 mt-3">
                        {q.status === "pending" && (
                          <button
                            onClick={() => handleApprove(q.id)}
                            disabled={isBusy}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50"
                          >
                            <Check size={12} /> Approve
                          </button>
                        )}

                        {q.status !== "answered" && (
                          <button
                            onClick={() => {
                              setAnsweringId(isAnswering ? null : q.id)
                              setAnswerText("")
                            }}
                            disabled={isBusy}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50"
                          >
                            <Send size={12} /> Answer
                          </button>
                        )}

                        <button
                          onClick={() => handlePin(q.id)}
                          disabled={isBusy}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors disabled:opacity-50",
                            q.is_featured
                              ? "text-[#c9a84c] bg-[#c9a84c]/10 border-[#c9a84c]/30 hover:bg-[#c9a84c]/20"
                              : "text-[#888] bg-[#fafafa] border-[#e0e0e0] hover:bg-[#f0f0f0]"
                          )}
                        >
                          <Pin size={12} /> {q.is_featured ? "Unpin" : "Pin"}
                        </button>

                        {q.status !== "rejected" && (
                          <button
                            onClick={() => handleReject(q.id)}
                            disabled={isBusy}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                          >
                            <X size={12} /> Reject
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(q.id)}
                          disabled={isBusy}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#999] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors disabled:opacity-50 ml-auto"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Toast ────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 bg-[#333] text-white rounded-xl shadow-2xl text-sm">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-white/40 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
