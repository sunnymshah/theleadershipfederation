"use client"

import { useState } from "react"
import { submitFeedback } from "@/app/actions/feedbackActions"
import { Loader2, Star, CheckCircle2 } from "lucide-react"

/* ── Star Rating Input ───────────────────────────────────────────────── */

function StarRatingInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  const [hover, setHover] = useState(0)

  return (
    <div>
      <label className="block text-xs text-[#1a1a2e]/80 uppercase tracking-wider mb-2 font-bold">
        {label}
      </label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={
                star <= (hover || value)
                  ? "fill-[#e7ab1c] text-[#e7ab1c] transition-colors"
                  : "fill-none text-[#1a1a2e]/30 transition-colors"
              }
            />
          </button>
        ))}
        {value > 0 && (
          <span className="text-sm text-[#1a1a2e]/75 ml-2 tabular-nums font-semibold">{value}/5</span>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */

export function FeedbackForm({ eventId }: { eventId: string }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [overall, setOverall] = useState(0)
  const [content, setContent] = useState(0)
  const [venue, setVenue] = useState(0)
  const [organization, setOrganization] = useState(0)
  const [speakers, setSpeakers] = useState(0)
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null)
  const [bestPart, setBestPart] = useState("")
  const [improvement, setImprovement] = useState("")
  const [additionalComments, setAdditionalComments] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      setError("Email is required.")
      return
    }

    setSubmitting(true)
    setError(null)

    const res = await submitFeedback({
      event_id: eventId,
      attendee_email: email,
      attendee_name: name || undefined,
      overall_rating: overall || undefined,
      content_rating: content || undefined,
      venue_rating: venue || undefined,
      organization_rating: organization || undefined,
      speaker_rating: speakers || undefined,
      would_recommend: wouldRecommend ?? undefined,
      best_part: bestPart || undefined,
      improvement: improvement || undefined,
      additional_comments: additionalComments || undefined,
    })

    if (res.success) {
      setSubmitted(true)
    } else {
      setError(res.error ?? "Submission failed.")
    }
    setSubmitting(false)
  }

  /* ── Thank you state ─────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="rounded-2xl p-12 text-center border border-emerald-500/30 bg-white shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">Thank You!</h2>
        <p className="text-sm text-[#1a1a2e]/75 max-w-md mx-auto leading-relaxed">
          Your feedback has been submitted successfully. We appreciate you taking the time
          to help us improve future events.
        </p>
      </div>
    )
  }

  const inputClass =
    "w-full px-4 py-3 bg-[#F4F8FF] border border-[#1a1a2e]/[0.10] rounded-xl text-sm text-[#1a1a2e] placeholder-[#1a1a2e]/55 focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-colors"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identity */}
      <div className="rounded-2xl p-6 border border-[#1a1a2e]/[0.06] bg-white shadow-sm space-y-4">
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <input
          type="email"
          placeholder="Your Email *"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Star Ratings */}
      <div className="rounded-2xl p-6 border border-[#1a1a2e]/[0.06] bg-white shadow-sm space-y-6">
        <p className="text-xs text-[#e7ab1c] uppercase tracking-wider font-bold">Rate Your Experience</p>
        <StarRatingInput label="Overall Experience" value={overall} onChange={setOverall} />
        <StarRatingInput label="Content Quality" value={content} onChange={setContent} />
        <StarRatingInput label="Venue & Logistics" value={venue} onChange={setVenue} />
        <StarRatingInput label="Organization" value={organization} onChange={setOrganization} />
        <StarRatingInput label="Speakers" value={speakers} onChange={setSpeakers} />
      </div>

      {/* Would Recommend */}
      <div className="rounded-2xl p-6 border border-[#1a1a2e]/[0.06] bg-white shadow-sm">
        <label className="block text-xs text-[#1a1a2e]/80 uppercase tracking-wider mb-3 font-bold">
          Would you recommend this event?
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setWouldRecommend(true)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
              wouldRecommend === true
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700"
                : "bg-[#F4F8FF] border-[#1a1a2e]/[0.10] text-[#1a1a2e]/75 hover:text-[#1a1a2e] hover:border-[#e7ab1c]/40"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setWouldRecommend(false)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
              wouldRecommend === false
                ? "bg-red-500/15 border-red-500/40 text-red-700"
                : "bg-[#F4F8FF] border-[#1a1a2e]/[0.10] text-[#1a1a2e]/75 hover:text-[#1a1a2e] hover:border-[#e7ab1c]/40"
            }`}
          >
            No
          </button>
        </div>
      </div>

      {/* Text areas */}
      <div className="rounded-2xl p-6 border border-[#1a1a2e]/[0.06] bg-white shadow-sm space-y-4">
        <div>
          <label className="block text-xs text-[#1a1a2e]/80 uppercase tracking-wider mb-2 font-bold">
            What was the best part?
          </label>
          <textarea
            rows={3}
            value={bestPart}
            onChange={(e) => setBestPart(e.target.value)}
            placeholder="Tell us what you enjoyed most..."
            className={inputClass + " resize-none"}
          />
        </div>
        <div>
          <label className="block text-xs text-[#1a1a2e]/80 uppercase tracking-wider mb-2 font-bold">
            What could be improved?
          </label>
          <textarea
            rows={3}
            value={improvement}
            onChange={(e) => setImprovement(e.target.value)}
            placeholder="Your suggestions help us do better..."
            className={inputClass + " resize-none"}
          />
        </div>
        <div>
          <label className="block text-xs text-[#1a1a2e]/80 uppercase tracking-wider mb-2 font-bold">
            Additional Comments
          </label>
          <textarea
            rows={3}
            value={additionalComments}
            onChange={(e) => setAdditionalComments(e.target.value)}
            placeholder="Anything else you'd like to share..."
            className={inputClass + " resize-none"}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 rounded-full text-sm font-bold text-[#1a1a2e] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 bg-[#e7ab1c] hover:bg-[#d49c10] shadow-[0_4px_24px_rgba(231,171,28,0.25)]"
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Submitting...
          </>
        ) : (
          "Submit Feedback"
        )}
      </button>
    </form>
  )
}
