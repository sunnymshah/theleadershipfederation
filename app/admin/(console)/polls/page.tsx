"use client"

/**
 * ── ADMIN POLLS MANAGEMENT ──────────────────────────────────────────────
 *
 * Create, manage, and view results for live polls per event.
 * Supports single choice, multiple choice, rating (1-5), and word cloud.
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { getActiveEvents } from "@/app/actions/checkInActions"
import {
  createPoll,
  getEventPolls,
  activatePoll,
  closePoll,
  togglePollResults,
  deletePoll,
  getPollResults,
} from "@/app/actions/pollActions"
import {
  BarChart3,
  Plus,
  Play,
  Square,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  Loader2,
  X,
  GripVertical,
  MessageCircle,
  Hash,
  Cloud,
  ListChecks,
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

interface Poll {
  id: string
  event_id: string
  question: string
  poll_type: string
  options: string[]
  status: string
  show_results: boolean
  allow_anonymous: boolean
  max_votes_per_user: number
  vote_count: number
  created_at: string
}

interface PollResultData {
  total_votes: number
  option_counts: Record<string, number>
  text_responses: string[]
}

/* ── Poll Type Metadata ──────────────────────────────────────────────── */

const POLL_TYPES = [
  { value: "single_choice", label: "Single Choice", icon: MessageCircle },
  { value: "multiple_choice", label: "Multiple Choice", icon: ListChecks },
  { value: "rating", label: "Rating (1-5)", icon: Hash },
  { value: "word_cloud", label: "Word Cloud", icon: Cloud },
] as const

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft:  { bg: "bg-gray-100", text: "text-gray-500", label: "Draft" },
  active: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Active" },
  closed: { bg: "bg-red-50", text: "text-red-500", label: "Closed" },
}

/* ═══════════════════════════════════════════════════════════════════════
 *  CREATE POLL MODAL
 * ═══════════════════════════════════════════════════════════════════════ */

function CreatePollModal({
  eventId,
  onClose,
  onCreated,
}: {
  eventId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [question, setQuestion] = useState("")
  const [pollType, setPollType] = useState("single_choice")
  const [options, setOptions] = useState<string[]>(["", ""])
  const [allowAnonymous, setAllowAnonymous] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsOptions = pollType === "single_choice" || pollType === "multiple_choice"

  function addOption() {
    setOptions([...options, ""])
  }

  function removeOption(index: number) {
    if (options.length <= 2) return
    setOptions(options.filter((_, i) => i !== index))
  }

  function updateOption(index: number, value: string) {
    const updated = [...options]
    updated[index] = value
    setOptions(updated)
  }

  // For rating type, auto-generate options
  function getSubmitOptions(): string[] {
    if (pollType === "rating") return ["1", "2", "3", "4", "5"]
    if (pollType === "word_cloud") return ["__word_cloud__"]
    return options.filter((o) => o.trim() !== "")
  }

  async function handleSubmit() {
    setError(null)

    if (!question.trim()) {
      setError("Question is required.")
      return
    }

    const submitOptions = getSubmitOptions()
    if (needsOptions && submitOptions.length < 2) {
      setError("At least 2 options are required.")
      return
    }

    setSubmitting(true)

    const formData = new FormData()
    formData.set("event_id", eventId)
    formData.set("question", question.trim())
    formData.set("poll_type", pollType)
    formData.set("options", JSON.stringify(submitOptions))
    formData.set("allow_anonymous", allowAnonymous ? "true" : "false")
    formData.set("max_votes_per_user", pollType === "multiple_choice" ? "3" : "1")

    const res = await createPoll(formData)

    if (res.success) {
      onCreated()
      onClose()
    } else {
      setError(res.error ?? "Failed to create poll.")
    }

    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1a1a2e]/30" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
          <h2 className="text-base font-semibold text-[#333]">Create New Poll</h2>
          <button onClick={onClose} className="text-[#999] hover:text-[#333] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Question */}
          <div>
            <label className="block text-[11px] text-[#888] uppercase tracking-wider font-semibold mb-1.5">
              Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What topic should we cover next?"
              className="w-full px-3 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder:text-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
            />
          </div>

          {/* Poll Type */}
          <div>
            <label className="block text-[11px] text-[#888] uppercase tracking-wider font-semibold mb-1.5">
              Poll Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {POLL_TYPES.map((pt) => {
                const Icon = pt.icon
                const isActive = pollType === pt.value
                return (
                  <button
                    key={pt.value}
                    onClick={() => setPollType(pt.value)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all text-left",
                      isActive
                        ? "border-[#c9a84c] bg-[#c9a84c]/5 text-[#333]"
                        : "border-[#e0e0e0] text-[#777] hover:border-[#ccc] hover:bg-[#fafafa]"
                    )}
                  >
                    <Icon size={15} className={isActive ? "text-[#c9a84c]" : "text-[#aaa]"} />
                    {pt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Options (for single/multiple choice) */}
          {needsOptions && (
            <div>
              <label className="block text-[11px] text-[#888] uppercase tracking-wider font-semibold mb-1.5">
                Options
              </label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <GripVertical size={14} className="text-[#ccc] shrink-0" />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] placeholder:text-[#bbb] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                    />
                    <button
                      onClick={() => removeOption(i)}
                      disabled={options.length <= 2}
                      className="text-[#ccc] hover:text-red-400 disabled:opacity-30 transition-colors shrink-0"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addOption}
                className="mt-2 flex items-center gap-1.5 text-xs text-[#c9a84c] hover:text-[#b8973c] font-medium transition-colors"
              >
                <Plus size={13} />
                Add Option
              </button>
            </div>
          )}

          {/* Rating preview */}
          {pollType === "rating" && (
            <div className="bg-[#fafafa] rounded-lg p-4 text-center">
              <p className="text-xs text-[#888] mb-2">Attendees will rate from 1 to 5</p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-[#e0e0e0] text-sm text-[#555] font-medium"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Word cloud info */}
          {pollType === "word_cloud" && (
            <div className="bg-[#fafafa] rounded-lg p-4">
              <p className="text-xs text-[#888]">
                Attendees will submit free-text words or short phrases. Results are displayed as a word cloud.
              </p>
            </div>
          )}

          {/* Allow Anonymous Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-[#333] font-medium">Allow Anonymous Voting</p>
              <p className="text-xs text-[#999] mt-0.5">Attendees can vote without identifying themselves</p>
            </div>
            <button
              onClick={() => setAllowAnonymous(!allowAnonymous)}
              className={cn(
                "relative w-10 h-[22px] rounded-full transition-colors",
                allowAnonymous ? "bg-[#c9a84c]" : "bg-[#ddd]"
              )}
            >
              <span
                className={cn(
                  "absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform",
                  allowAnonymous ? "left-[20px]" : "left-[2px]"
                )}
              />
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e8e8e8] bg-[#fafafa] rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#e0e0e0] text-sm text-[#555] hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#c9a84c] text-white text-sm font-bold hover:bg-[#d4b85c] transition-colors disabled:opacity-50"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Create Poll
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
 *  POLL RESULTS PANEL
 * ═══════════════════════════════════════════════════════════════════════ */

function PollResultsPanel({
  poll,
  onClose,
}: {
  poll: Poll
  onClose: () => void
}) {
  const [results, setResults] = useState<PollResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchResults = useCallback(async () => {
    const res = await getPollResults(poll.id)
    if (res.success && res.poll?.results) {
      setResults(res.poll.results as PollResultData)
    }
    setLoading(false)
  }, [poll.id])

  useEffect(() => {
    fetchResults()

    // Auto-refresh results every 5 seconds for active polls
    if (poll.status === "active") {
      intervalRef.current = setInterval(fetchResults, 5_000)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchResults, poll.status])

  const maxCount =
    results
      ? Math.max(1, ...Object.values(results.option_counts))
      : 1

  return (
    <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
        <div className="flex items-center gap-3">
          <BarChart3 size={16} className="text-[#c9a84c]" />
          <div>
            <h3 className="text-sm font-semibold text-[#333]">Poll Results</h3>
            <p className="text-xs text-[#999] mt-0.5 max-w-md truncate">{poll.question}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {poll.status === "active" && (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
          <button
            onClick={onClose}
            className="text-[#999] hover:text-[#333] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#aaa] gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading results...
          </div>
        ) : !results ? (
          <p className="text-sm text-[#999] text-center py-8">No results available.</p>
        ) : poll.poll_type === "word_cloud" ? (
          /* Word Cloud Results */
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-[#888]">
                {results.total_votes} response{results.total_votes !== 1 ? "s" : ""}
              </p>
            </div>
            {results.text_responses.length === 0 ? (
              <p className="text-sm text-[#bbb] text-center py-6">No responses yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {results.text_responses.map((text, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-[#f4f5f7] border border-[#e8e8e8] rounded-full text-sm text-[#555]"
                  >
                    {text}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Bar Chart Results */
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs text-[#888]">
                {results.total_votes} total vote{results.total_votes !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="space-y-3">
              {Object.entries(results.option_counts).map(([option, count]) => {
                const pct = results.total_votes > 0 ? Math.round((count / results.total_votes) * 100) : 0
                const barWidth = results.total_votes > 0 ? (count / maxCount) * 100 : 0
                return (
                  <div key={option}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[#333]">{option}</span>
                      <span className="text-xs text-[#888] tabular-nums">
                        {count} vote{count !== 1 ? "s" : ""} ({pct}%)
                      </span>
                    </div>
                    <div className="h-7 bg-[#f4f5f7] rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all duration-500 ease-out"
                        style={{
                          width: `${barWidth}%`,
                          background: "linear-gradient(90deg, #c9a84c 0%, #d9b85c 100%)",
                          minWidth: count > 0 ? "8px" : "0",
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
 *  MAIN PAGE
 * ═══════════════════════════════════════════════════════════════════════ */

export default function AdminPollsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPolls, setLoadingPolls] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewingResultsId, setViewingResultsId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

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

  // Load polls for selected event
  const fetchPolls = useCallback(async () => {
    if (!selectedEventId) return
    const res = await getEventPolls(selectedEventId)
    if (res.success) {
      setPolls(res.polls as Poll[])
    }
    setLoadingPolls(false)
  }, [selectedEventId])

  useEffect(() => {
    setLoadingPolls(true)
    fetchPolls()

    // Refresh polls every 5 seconds if any are active (for live vote counts)
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    pollIntervalRef.current = setInterval(fetchPolls, 5_000)

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [fetchPolls])

  // Stop polling when no active polls
  useEffect(() => {
    const hasActive = polls.some((p) => p.status === "active")
    if (!hasActive && pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [polls])

  /* ── Actions ───────────────────────────────────────────────────────── */

  async function handleActivate(pollId: string) {
    setActionLoading(pollId)
    const res = await activatePoll(pollId)
    if (res.success) {
      showToast("Poll activated.")
      await fetchPolls()
      // Restart polling interval for live counts
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(fetchPolls, 5_000)
      }
    } else {
      showToast(res.error ?? "Failed to activate poll.")
    }
    setActionLoading(null)
  }

  async function handleClose(pollId: string) {
    setActionLoading(pollId)
    const res = await closePoll(pollId)
    if (res.success) {
      showToast("Poll closed.")
      await fetchPolls()
    } else {
      showToast(res.error ?? "Failed to close poll.")
    }
    setActionLoading(null)
  }

  async function handleToggleResults(pollId: string, currentShow: boolean) {
    setActionLoading(pollId)
    const res = await togglePollResults(pollId, !currentShow)
    if (res.success) {
      showToast(!currentShow ? "Results now visible to attendees." : "Results hidden from attendees.")
      await fetchPolls()
    } else {
      showToast(res.error ?? "Failed to toggle results.")
    }
    setActionLoading(null)
  }

  async function handleDelete(pollId: string) {
    if (!window.confirm("Delete this poll? This cannot be undone.")) return
    setActionLoading(pollId)
    const res = await deletePoll(pollId)
    if (res.success) {
      showToast("Poll deleted.")
      if (viewingResultsId === pollId) setViewingResultsId(null)
      await fetchPolls()
    } else {
      showToast(res.error ?? "Failed to delete poll.")
    }
    setActionLoading(null)
  }

  /* ── Render ────────────────────────────────────────────────────────── */

  const selectedEvent = events.find((e) => e.id === selectedEventId)
  const viewingPoll = polls.find((p) => p.id === viewingResultsId) ?? null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-[#aaa] gap-2">
        <Loader2 size={20} className="animate-spin" /> Loading...
      </div>
    )
  }

  return (
    <div>
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#333]">Live Polls</h1>
          <p className="text-sm text-[#888] mt-0.5">Create and manage audience polls for your events</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!selectedEventId}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a84c] text-white text-sm font-bold hover:bg-[#d4b85c] transition-colors disabled:opacity-50"
        >
          <Plus size={15} />
          New Poll
        </button>
      </div>

      {/* ── Event Selector ───────────────────────────────────────── */}
      <div className="mb-6">
        <div className="relative inline-block">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] hover:border-[#ccc] transition-colors min-w-[240px]"
          >
            <span className="flex-1 text-left truncate">
              {selectedEvent?.title ?? "Select an event"}
            </span>
            <ChevronDown
              size={15}
              className={cn("text-[#999] transition-transform shrink-0", dropdownOpen && "rotate-180")}
            />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#e0e0e0] rounded-lg shadow-xl z-40 py-1 max-h-60 overflow-y-auto">
              {events.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => {
                    setSelectedEventId(ev.id)
                    setDropdownOpen(false)
                    setViewingResultsId(null)
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm transition-colors",
                    ev.id === selectedEventId
                      ? "text-[#c9a84c] bg-[#c9a84c]/5 font-medium"
                      : "text-[#555] hover:bg-[#fafafa]"
                  )}
                >
                  {ev.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Polls List ───────────────────────────────────────────── */}
      {loadingPolls ? (
        <div className="flex items-center justify-center py-24 text-[#aaa] gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading polls...
        </div>
      ) : !selectedEventId ? (
        <div className="bg-white rounded-xl border border-[#e0e0e0] py-20 text-center">
          <BarChart3 size={32} className="mx-auto mb-3 text-[#ddd]" />
          <p className="text-[#999] text-sm">Select an event to manage polls.</p>
        </div>
      ) : polls.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e0e0e0] py-20 text-center">
          <BarChart3 size={32} className="mx-auto mb-3 text-[#ddd]" />
          <p className="text-[#999] text-sm">No polls yet for this event.</p>
          <p className="text-[#bbb] text-xs mt-1">Click "New Poll" to create one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {polls.map((poll) => {
            const statusStyle = STATUS_STYLES[poll.status] ?? STATUS_STYLES.draft
            const pollTypeInfo = POLL_TYPES.find((pt) => pt.value === poll.poll_type)
            const isLoading = actionLoading === poll.id

            return (
              <div
                key={poll.id}
                className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start gap-4 px-6 py-4">
                  {/* Left: Poll Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider",
                          statusStyle.bg,
                          statusStyle.text
                        )}
                      >
                        {statusStyle.label}
                      </span>
                      {pollTypeInfo && (
                        <span className="text-[10px] text-[#aaa] uppercase tracking-wider">
                          {pollTypeInfo.label}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-[#333] mb-1 leading-snug">
                      {poll.question}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[#999]">
                      <span className="tabular-nums">
                        {poll.vote_count} vote{poll.vote_count !== 1 ? "s" : ""}
                      </span>
                      {poll.status === "active" && (
                        <span className="flex items-center gap-1 text-emerald-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live
                        </span>
                      )}
                      {poll.allow_anonymous && (
                        <span className="text-[#bbb]">Anonymous</span>
                      )}
                      {poll.show_results && (
                        <span className="text-[#c9a84c]">Results visible</span>
                      )}
                    </div>
                    {/* Options preview for choice polls */}
                    {(poll.poll_type === "single_choice" || poll.poll_type === "multiple_choice") && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {poll.options.slice(0, 5).map((opt, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-[#f4f5f7] rounded text-[11px] text-[#777]"
                          >
                            {opt}
                          </span>
                        ))}
                        {poll.options.length > 5 && (
                          <span className="px-2 py-0.5 text-[11px] text-[#bbb]">
                            +{poll.options.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0 pt-1">
                    {isLoading ? (
                      <div className="px-3 py-2">
                        <Loader2 size={15} className="animate-spin text-[#aaa]" />
                      </div>
                    ) : (
                      <>
                        {/* View Results */}
                        <button
                          onClick={() =>
                            setViewingResultsId(viewingResultsId === poll.id ? null : poll.id)
                          }
                          title="View Results"
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            viewingResultsId === poll.id
                              ? "bg-[#c9a84c]/10 text-[#c9a84c]"
                              : "text-[#bbb] hover:text-[#666] hover:bg-[#f4f5f7]"
                          )}
                        >
                          <BarChart3 size={15} />
                        </button>

                        {/* Activate (only for draft/closed) */}
                        {poll.status !== "active" && (
                          <button
                            onClick={() => handleActivate(poll.id)}
                            title="Activate Poll"
                            className="p-2 rounded-lg text-[#bbb] hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                          >
                            <Play size={15} />
                          </button>
                        )}

                        {/* Close (only for active) */}
                        {poll.status === "active" && (
                          <button
                            onClick={() => handleClose(poll.id)}
                            title="Close Poll"
                            className="p-2 rounded-lg text-[#bbb] hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Square size={15} />
                          </button>
                        )}

                        {/* Toggle Show Results */}
                        <button
                          onClick={() => handleToggleResults(poll.id, poll.show_results)}
                          title={poll.show_results ? "Hide Results from Attendees" : "Show Results to Attendees"}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            poll.show_results
                              ? "text-[#c9a84c] hover:bg-[#c9a84c]/10"
                              : "text-[#bbb] hover:text-[#666] hover:bg-[#f4f5f7]"
                          )}
                        >
                          {poll.show_results ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(poll.id)}
                          title="Delete Poll"
                          className="p-2 rounded-lg text-[#bbb] hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Inline Results Panel */}
                {viewingResultsId === poll.id && (
                  <div className="border-t border-[#e8e8e8]">
                    <PollResultsPanel
                      poll={poll}
                      onClose={() => setViewingResultsId(null)}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Create Poll Modal ────────────────────────────────────── */}
      {showCreateModal && selectedEventId && (
        <CreatePollModal
          eventId={selectedEventId}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => fetchPolls()}
        />
      )}

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
