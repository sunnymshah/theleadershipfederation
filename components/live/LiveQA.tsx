"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  getApprovedQuestions,
  submitQuestion,
  upvoteQuestion,
} from "@/app/actions/qaActions"
import {
  Heart,
  Loader2,
  MessageCirclePlus,
  Star,
  X,
  Send,
  CheckCircle2,
} from "lucide-react"

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Question {
  id: string
  event_id: string
  session_id: string | null
  author_name: string | null
  question: string
  answer: string | null
  answered_by: string | null
  status: string
  upvotes: number
  is_anonymous: boolean
  is_featured: boolean
  created_at: string
  answered_at: string | null
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const REFRESH_INTERVAL = 8_000
const UPVOTED_KEY = "lf_upvoted_questions"

function getUpvotedQuestions(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(UPVOTED_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function markQuestionUpvoted(questionId: string) {
  const upvoted = getUpvotedQuestions()
  upvoted.add(questionId)
  try {
    localStorage.setItem(UPVOTED_KEY, JSON.stringify([...upvoted]))
  } catch {
    /* ignore */
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                            */
/* -------------------------------------------------------------------------- */

export function LiveQA({ eventId }: { eventId: string }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* Hydrate upvoted set from localStorage */
  useEffect(() => {
    setUpvoted(getUpvotedQuestions())
  }, [])

  /* Fetch questions */
  const fetchQuestions = useCallback(async () => {
    const res = await getApprovedQuestions(eventId)
    if (res.success) setQuestions(res.questions as Question[])
  }, [eventId])

  /* Initial load + polling */
  useEffect(() => {
    fetchQuestions().then(() => setLoading(false))
    intervalRef.current = setInterval(fetchQuestions, REFRESH_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchQuestions])

  /* Upvote handler */
  const handleUpvote = async (questionId: string) => {
    if (upvoted.has(questionId)) return
    markQuestionUpvoted(questionId)
    setUpvoted((prev) => new Set(prev).add(questionId))

    /* Optimistic update */
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, upvotes: q.upvotes + 1 } : q
      )
    )

    await upvoteQuestion(questionId, null)
  }

  /* After successful submission */
  const handleSubmitted = () => {
    setShowForm(false)
    fetchQuestions()
  }

  /* ── Render ──────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#1a1a2e]/45">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">Loading Q&A...</p>
      </div>
    )
  }

  /* Separate featured and regular */
  const featured = questions.filter((q) => q.is_featured)
  const regular = questions.filter((q) => !q.is_featured)

  return (
    <div className="relative">
      {/* Question list */}
      <div className="flex flex-col gap-4 pb-20">
        {questions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#1a1a2e]/45">
            <MessageCirclePlus className="w-8 h-8" />
            <p className="text-base font-medium">No questions yet</p>
            <p className="text-sm">Be the first to ask!</p>
          </div>
        )}

        {/* Featured / pinned */}
        {featured.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            isFeatured
            isUpvoted={upvoted.has(q.id)}
            onUpvote={() => handleUpvote(q.id)}
          />
        ))}

        {/* Regular */}
        {regular.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            isFeatured={false}
            isUpvoted={upvoted.has(q.id)}
            onUpvote={() => handleUpvote(q.id)}
          />
        ))}
      </div>

      {/* Floating "Ask" button */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-4 z-50 flex items-center gap-2 px-5 py-3.5 rounded-full bg-[#e7ab1c] hover:bg-[#d49c10] text-white font-bold text-sm shadow-lg shadow-[#e7ab1c]/25 active:scale-95 transition-all"
      >
        <MessageCirclePlus className="w-5 h-5" />
        Ask a Question
      </button>

      {/* Question form modal */}
      {showForm && (
        <AskQuestionForm
          eventId={eventId}
          onClose={() => setShowForm(false)}
          onSubmitted={handleSubmitted}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Question card                                                             */
/* -------------------------------------------------------------------------- */

function QuestionCard({
  question,
  isFeatured,
  isUpvoted,
  onUpvote,
}: {
  question: Question
  isFeatured: boolean
  isUpvoted: boolean
  onUpvote: () => void
}) {
  const author = question.is_anonymous
    ? "Anonymous"
    : question.author_name || "Anonymous"
  const isAnswered = question.status === "answered"

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors shadow-sm ${
        isFeatured
          ? "bg-[#e7ab1c]/[0.06] border-[#e7ab1c]/30"
          : "bg-white border-[#1a1a2e]/[0.06]"
      }`}
    >
      {/* Featured badge */}
      {isFeatured && (
        <div className="flex items-center gap-1.5 mb-2">
          <Star className="w-3.5 h-3.5 fill-[#e7ab1c] text-[#e7ab1c]" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#e7ab1c]">
            Featured
          </span>
        </div>
      )}

      {/* Question text */}
      <p className="text-[15px] leading-relaxed font-medium mb-2">
        {question.question}
      </p>

      {/* Author & time */}
      <div className="flex items-center gap-2 text-xs text-[#1a1a2e]/45 mb-3">
        <span>{author}</span>
        <span className="w-0.5 h-0.5 rounded-full bg-[#1a1a2e]/30" />
        <span>{timeAgo(question.created_at)}</span>
      </div>

      {/* Answer card */}
      {isAnswered && question.answer && (
        <div className="rounded-xl bg-[#e7ab1c]/10 border border-[#e7ab1c]/20 p-3 mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#e7ab1c]" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#e7ab1c]">
              Answered{question.answered_by ? ` by ${question.answered_by}` : ""}
            </span>
          </div>
          <p className="text-sm text-[#1a1a2e]/85 leading-relaxed">
            {question.answer}
          </p>
        </div>
      )}

      {/* Upvote button */}
      <button
        onClick={onUpvote}
        disabled={isUpvoted}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
          isUpvoted
            ? "bg-[#e7ab1c]/15 text-[#e7ab1c]"
            : "bg-[#1a1a2e]/[0.04] text-[#1a1a2e]/55 hover:bg-[#1a1a2e]/[0.08] hover:text-[#1a1a2e]/80"
        }`}
      >
        <Heart
          className={`w-3.5 h-3.5 transition-colors ${
            isUpvoted ? "fill-[#e7ab1c] text-[#e7ab1c]" : ""
          }`}
        />
        {question.upvotes}
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Ask question form (full-screen modal)                                     */
/* -------------------------------------------------------------------------- */

function AskQuestionForm({
  eventId,
  onClose,
  onSubmitted,
}: {
  eventId: string
  onClose: () => void
  onSubmitted: () => void
}) {
  const [name, setName] = useState("")
  const [questionText, setQuestionText] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /* Focus textarea on mount */
  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = async () => {
    if (!questionText.trim()) {
      setError("Please enter a question.")
      return
    }

    setError("")
    setSubmitting(true)

    const res = await submitQuestion({
      eventId,
      authorName: isAnonymous ? undefined : name.trim() || undefined,
      question: questionText.trim(),
      isAnonymous,
    })

    if (res.success) {
      onSubmitted()
    } else {
      setError(res.error ?? "Something went wrong.")
    }

    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#F4F8FF]/95 backdrop-blur-md flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a2e]/[0.06]">
        <h2 className="text-base font-bold text-[#1a1a2e]">Ask a Question</h2>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#1a1a2e]/[0.05] flex items-center justify-center active:bg-[#1a1a2e]/[0.1] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-[#1a1a2e]" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-5">
        {/* Name */}
        <div>
          <label className="block text-xs text-[#1a1a2e]/55 font-medium mb-1.5">
            Your Name <span className="text-[#1a1a2e]/30">(optional)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya"
            disabled={isAnonymous}
            maxLength={60}
            className="w-full px-4 py-3 rounded-xl bg-white border border-[#1a1a2e]/[0.08] text-[#1a1a2e] placeholder:text-[#1a1a2e]/35 text-sm focus:outline-none focus:border-[#e7ab1c]/50 focus:ring-2 focus:ring-[#e7ab1c]/20 disabled:opacity-40 transition-colors"
          />
        </div>

        {/* Question */}
        <div>
          <label className="block text-xs text-[#1a1a2e]/55 font-medium mb-1.5">
            Your Question <span className="text-red-400">*</span>
          </label>
          <textarea
            ref={textareaRef}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="What would you like to ask the speaker?"
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl bg-white border border-[#1a1a2e]/[0.08] text-[#1a1a2e] placeholder:text-[#1a1a2e]/35 text-sm leading-relaxed focus:outline-none focus:border-[#e7ab1c]/50 focus:ring-2 focus:ring-[#e7ab1c]/20 resize-none transition-colors"
          />
          <p className="text-right text-[10px] text-[#1a1a2e]/25 mt-1">
            {questionText.length}/500
          </p>
        </div>

        {/* Anonymous toggle */}
        <button
          type="button"
          onClick={() => setIsAnonymous(!isAnonymous)}
          className="flex items-center gap-3 py-2"
        >
          <span
            className={`relative w-11 h-6 rounded-full transition-colors ${
              isAnonymous ? "bg-[#e7ab1c]" : "bg-[#1a1a2e]/[0.12]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isAnonymous ? "translate-x-5" : ""
              }`}
            />
          </span>
          <span className="text-sm text-[#1a1a2e]/75">Submit anonymously</span>
        </button>

        {/* Error */}
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      {/* Submit button pinned to bottom */}
      <div className="px-4 py-4 border-t border-[#1a1a2e]/[0.06] bg-[#F4F8FF]">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-[#e7ab1c] hover:bg-[#d49c10] text-white font-bold text-sm active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(231,171,28,0.25)]"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Question
            </>
          )}
        </button>
      </div>
    </div>
  )
}
