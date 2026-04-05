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
      <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">
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
                  ? "fill-[#c9a84c] text-[#c9a84c] transition-colors"
                  : "fill-none text-white/15 transition-colors"
              }
            />
          </button>
        ))}
        {value > 0 && (
          <span className="text-sm text-white/30 ml-2 tabular-nums">{value}/5</span>
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
      <div className="rounded-2xl p-12 text-center border border-emerald-500/20 bg-emerald-500/[0.03]">
        <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Thank You!</h2>
        <p className="text-sm text-white/40 max-w-md mx-auto">
          Your feedback has been submitted successfully. We appreciate you taking the time
          to help us improve future events.
        </p>
      </div>
    )
  }

  const inputClass =
    "w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c]/40 transition-colors"

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Identity */}
      <div className="rounded-2xl p-6 border border-white/[0.06] bg-white/[0.02] space-y-4">
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
      <div className="rounded-2xl p-6 border border-white/[0.06] bg-white/[0.02] space-y-6">
        <p className="text-xs text-white/20 uppercase tracking-wider font-semibold">Rate Your Experience</p>
        <StarRatingInput label="Overall Experience" value={overall} onChange={setOverall} />
        <StarRatingInput label="Content Quality" value={content} onChange={setContent} />
        <StarRatingInput label="Venue & Logistics" value={venue} onChange={setVenue} />
        <StarRatingInput label="Organization" value={organization} onChange={setOrganization} />
        <StarRatingInput label="Speakers" value={speakers} onChange={setSpeakers} />
      </div>

      {/* Would Recommend */}
      <div className="rounded-2xl p-6 border border-white/[0.06] bg-white/[0.02]">
        <label className="block text-xs text-white/40 uppercase tracking-wider mb-3 font-medium">
          Would you recommend this event?
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setWouldRecommend(true)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
              wouldRecommend === true
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-white/[0.02] border-white/[0.08] text-white/30 hover:text-white/50"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setWouldRecommend(false)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
              wouldRecommend === false
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-white/[0.02] border-white/[0.08] text-white/30 hover:text-white/50"
            }`}
          >
            No
          </button>
        </div>
      </div>

      {/* Text areas */}
      <div className="rounded-2xl p-6 border border-white/[0.06] bg-white/[0.02] space-y-4">
        <div>
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">
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
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">
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
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-2 font-medium">
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
        <div className="px-4 py-3 rounded-xl bg-red-500/[0.06] border border-red-500/[0.12]">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 rounded-xl text-sm font-bold text-[#0a0a0a] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
        style={{
          background: "linear-gradient(135deg, #c9a84c 0%, #d9b85c 100%)",
          boxShadow: "0 0 20px rgba(201,168,76,0.2), 0 2px 6px rgba(0,0,0,0.3)",
        }}
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
