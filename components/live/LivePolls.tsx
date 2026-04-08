"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getActivePolls, submitVote, getPollResults } from "@/app/actions/pollActions"
import { CheckCircle2, Loader2, Star, Send } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Poll {
  id: string
  event_id: string
  question: string
  poll_type: string // "single" | "multiple" | "rating" | "word_cloud"
  options: string[]
  status: string
  show_results: boolean
  max_votes_per_user: number
  allow_anonymous: boolean
}

interface PollResult {
  total_votes: number
  option_counts: Record<string, number>
  text_responses: string[]
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const REFRESH_INTERVAL = 10_000
const VOTED_KEY = "lf_voted_polls"

function getVotedPolls(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(VOTED_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function markPollVoted(pollId: string) {
  const voted = getVotedPolls()
  voted.add(pollId)
  try {
    localStorage.setItem(VOTED_KEY, JSON.stringify([...voted]))
  } catch {
    /* storage full -- ignore */
  }
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export function LivePolls({ eventId }: { eventId: string }) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [voted, setVoted] = useState<Set<string>>(new Set())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* Hydrate voted set from localStorage after mount */
  useEffect(() => {
    setVoted(getVotedPolls())
  }, [])

  /* Fetch active polls */
  const fetchPolls = useCallback(async () => {
    const res = await getActivePolls(eventId)
    if (res.success) setPolls(res.polls as Poll[])
  }, [eventId])

  /* Initial load + polling */
  useEffect(() => {
    fetchPolls().then(() => setLoading(false))
    intervalRef.current = setInterval(fetchPolls, REFRESH_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchPolls])

  const handleVoted = (pollId: string) => {
    markPollVoted(pollId)
    setVoted((prev) => new Set(prev).add(pollId))
  }

  /* ── Render ──────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/40">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">Loading polls...</p>
      </div>
    )
  }

  if (polls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/40">
        <p className="text-base font-medium">No active polls right now</p>
        <p className="text-sm">Check back in a moment -- new polls appear automatically.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {polls.map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
          hasVoted={voted.has(poll.id)}
          onVoted={() => handleVoted(poll.id)}
        />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Individual poll card                                                      */
/* -------------------------------------------------------------------------- */

function PollCard({
  poll,
  hasVoted,
  onVoted,
}: {
  poll: Poll
  hasVoted: boolean
  onVoted: () => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [textInput, setTextInput] = useState("")
  const [rating, setRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<PollResult | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState("")

  /* If already voted and poll shows results, fetch results */
  useEffect(() => {
    if (hasVoted && poll.show_results) {
      getPollResults(poll.id).then((res) => {
        if (res.success && res.poll?.results) {
          setResults(res.poll.results as PollResult)
          setShowResults(true)
        }
      })
    }
  }, [hasVoted, poll.id, poll.show_results])

  /* Toggle option selection */
  const toggleOption = (option: string) => {
    if (poll.poll_type === "single") {
      setSelected([option])
    } else {
      setSelected((prev) =>
        prev.includes(option)
          ? prev.filter((o) => o !== option)
          : prev.length < poll.max_votes_per_user
            ? [...prev, option]
            : prev
      )
    }
  }

  /* Submit vote */
  const handleSubmit = async () => {
    setError("")
    setSubmitting(true)

    let selectedOptions: string[] = selected
    let textResponse: string | undefined

    if (poll.poll_type === "rating") {
      selectedOptions = [String(rating)]
    } else if (poll.poll_type === "word_cloud") {
      if (!textInput.trim()) {
        setError("Please enter a response.")
        setSubmitting(false)
        return
      }
      selectedOptions = []
      textResponse = textInput.trim()
    } else if (selectedOptions.length === 0) {
      setError("Please select an option.")
      setSubmitting(false)
      return
    }

    const res = await submitVote(poll.id, null, selectedOptions, textResponse)

    if (res.success) {
      onVoted()
      /* Fetch results if allowed */
      if (poll.show_results) {
        const rr = await getPollResults(poll.id)
        if (rr.success && rr.poll?.results) {
          setResults(rr.poll.results as PollResult)
          setShowResults(true)
        }
      }
    } else {
      setError(res.error ?? "Something went wrong.")
    }

    setSubmitting(false)
  }

  /* ── Voted state with results ──────────────────────────────────────── */
  if (hasVoted && showResults && results) {
    const maxCount = Math.max(...Object.values(results.option_counts), 1)

    return (
      <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
        <p className="text-lg font-bold leading-snug mb-1">{poll.question}</p>
        <p className="text-xs text-white/40 mb-4">
          {results.total_votes} vote{results.total_votes !== 1 ? "s" : ""}
        </p>

        <div className="flex flex-col gap-2.5">
          {Object.entries(results.option_counts).map(([option, count]) => {
            const pct = results.total_votes > 0 ? Math.round((count / results.total_votes) * 100) : 0
            return (
              <div key={option}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-medium">{option}</span>
                  <span className="text-xs text-white/50">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#e7ab1c] to-[#f0c850] transition-all duration-700 ease-out"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {results.text_responses.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {results.text_responses.slice(0, 20).map((t, i) => (
              <span
                key={i}
                className="inline-block px-3 py-1 rounded-full bg-[#e7ab1c]/15 text-[#e7ab1c] text-xs font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-[#e7ab1c] text-xs font-medium">
          <CheckCircle2 className="w-4 h-4" />
          You voted
        </div>
      </div>
    )
  }

  /* ── Voted state without results ───────────────────────────────────── */
  if (hasVoted) {
    return (
      <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
        <p className="text-lg font-bold leading-snug mb-3">{poll.question}</p>
        <div className="flex items-center gap-2 text-[#e7ab1c] text-sm font-medium">
          <CheckCircle2 className="w-5 h-5" />
          Thanks for voting! Results will be shared soon.
        </div>
      </div>
    )
  }

  /* ── Voting UI ─────────────────────────────────────────────────────── */
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
      <p className="text-lg font-bold leading-snug mb-1">{poll.question}</p>
      <p className="text-xs text-white/40 mb-4">
        {poll.poll_type === "single" && "Select one option"}
        {poll.poll_type === "multiple" &&
          `Select up to ${poll.max_votes_per_user} option${poll.max_votes_per_user !== 1 ? "s" : ""}`}
        {poll.poll_type === "rating" && "Tap to rate"}
        {poll.poll_type === "word_cloud" && "Type your answer below"}
      </p>

      {/* Single / Multiple choice */}
      {(poll.poll_type === "single" || poll.poll_type === "multiple") && (
        <div className="flex flex-col gap-2.5 mb-4">
          {poll.options.map((option) => {
            const isSelected = selected.includes(option)
            return (
              <button
                key={option}
                onClick={() => toggleOption(option)}
                className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                  isSelected
                    ? "bg-[#e7ab1c]/20 border-[#e7ab1c]/60 text-[#e7ab1c] border"
                    : "bg-white/[0.06] border border-white/10 text-white/80 hover:bg-white/[0.08]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "border-[#e7ab1c] bg-[#e7ab1c]"
                        : "border-white/30"
                    }`}
                  >
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#0a0a0a]" />
                    )}
                  </span>
                  {option}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Rating */}
      {poll.poll_type === "rating" && (
        <div className="flex justify-center gap-3 mb-4 py-2">
          {[1, 2, 3, 4, 5].map((val) => (
            <button
              key={val}
              onClick={() => setRating(val)}
              className="active:scale-110 transition-transform"
              aria-label={`Rate ${val} star${val !== 1 ? "s" : ""}`}
            >
              <Star
                className={`w-10 h-10 transition-colors ${
                  val <= rating
                    ? "fill-[#e7ab1c] text-[#e7ab1c]"
                    : "fill-transparent text-white/25"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Word cloud / text input */}
      {poll.poll_type === "word_cloud" && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Your answer..."
              maxLength={100}
              className="w-full px-4 py-3.5 pr-12 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#e7ab1c]/50 focus:ring-1 focus:ring-[#e7ab1c]/30 transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/25">
              {textInput.length}/100
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs mb-3">{error}</p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3.5 rounded-xl bg-[#e7ab1c] text-[#0a0a0a] font-bold text-sm active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Vote
          </>
        )}
      </button>
    </div>
  )
}
