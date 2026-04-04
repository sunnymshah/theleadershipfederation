"use client"

import { useState } from "react"
import { Loader2, CheckCircle2, Send } from "lucide-react"
import { submitContactInquiry } from "@/app/actions/contactActions"

const INQUIRY_TYPES = [
  "Event Registration",
  "Partner With Us",
  "Speaker Nomination",
  "Inner Circle Membership",
  "Media Inquiry",
  "General",
] as const

export function ContactForm({ sourcePage = "contact" }: { sourcePage?: string }) {
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    fd.set("source_page", sourcePage)

    const result = await submitContactInquiry(fd)
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error ?? "Something went wrong. Please try again.")
    }
    setSubmitting(false)
  }

  /* ── Success state ──────────────────────────────────────────── */
  if (success) {
    return (
      <div
        className="bg-white rounded-2xl p-10 md:p-14 text-center flex flex-col items-center justify-center min-h-[400px]"
        style={{
          boxShadow: "0 2px 8px rgba(26,26,46,0.04), 0 8px 28px rgba(26,26,46,0.04)",
        }}
      >
        <CheckCircle2 size={44} className="text-emerald-500 mb-5" />
        <h3 className="text-2xl font-bold font-serif text-[#1a1a2e] mb-3">
          Thank You
        </h3>
        <p className="text-[#1a1a2e]/50 max-w-md leading-relaxed">
          Your inquiry has been received. A member of our team will be in touch
          within 24 hours.
        </p>
      </div>
    )
  }

  /* ── Form ───────────────────────────────────────────────────── */
  const inputBase =
    "w-full px-4 py-3 bg-white border border-[#1a1a2e]/10 rounded-xl text-sm text-[#1a1a2e] placeholder-[#1a1a2e]/30 focus:outline-none focus:border-[#1a1a2e]/30 focus:ring-1 focus:ring-[#1a1a2e]/10 transition-colors"

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-8 md:p-10 space-y-5"
      style={{
        boxShadow: "0 2px 8px rgba(26,26,46,0.04), 0 8px 28px rgba(26,26,46,0.04)",
      }}
    >
      <h2 className="text-xl font-bold text-[#1a1a2e] mb-1">Send Us a Message</h2>
      <p className="text-sm text-[#1a1a2e]/40 !mt-0 mb-2">
        All fields marked with * are required.
      </p>

      {/* Row: Name + Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="full_name"
          required
          placeholder="Full Name *"
          className={inputBase}
        />
        <input
          type="email"
          name="email"
          required
          placeholder="Email Address *"
          className={inputBase}
        />
      </div>

      {/* Row: Phone + Company */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          className={inputBase}
        />
        <input
          type="text"
          name="company"
          placeholder="Company / Organization"
          className={inputBase}
        />
      </div>

      {/* Row: Designation + Inquiry Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="designation"
          placeholder="Designation / Title"
          className={inputBase}
        />
        <select
          name="inquiry_type"
          required
          defaultValue=""
          className={`${inputBase} appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%231a1a2e%22%20fill-opacity%3D%220.3%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat pr-10`}
        >
          <option value="" disabled>
            Inquiry Type *
          </option>
          {INQUIRY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <textarea
        name="message"
        rows={5}
        required
        placeholder="Your Message *"
        className={`${inputBase} resize-none`}
      />

      {/* Hidden source page */}
      <input type="hidden" name="source_page" value={sourcePage} />

      {/* Error */}
      {error && (
        <p className="text-red-600 text-sm font-medium">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#1a1a2e] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#1a1a2e]/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Sending...
          </>
        ) : (
          <>
            <Send size={15} /> Send Message
          </>
        )}
      </button>
    </form>
  )
}
