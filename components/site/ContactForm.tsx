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

  if (success) {
    return (
      <div className="bg-white/70 border border-black/[0.04] rounded-2xl p-10 md:p-14 text-center flex flex-col items-center justify-center min-h-[400px]">
        <CheckCircle2 size={44} className="text-emerald-500 mb-5" />
        <h3
          className="text-2xl font-bold text-black mb-3"
          style={{ fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }}
        >
          Thank You
        </h3>
        <p className="text-black/40 max-w-md leading-relaxed">
          Your inquiry has been received. A member of our team will be in touch
          within 24 hours.
        </p>
      </div>
    )
  }

  const inputBase =
    "w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-sm text-black placeholder-black/30 focus:outline-none focus:border-[#e7ab1c]/50 focus:ring-1 focus:ring-[#e7ab1c]/20 transition-colors"

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/70 border border-black/[0.04] rounded-2xl p-8 md:p-10 space-y-5"
    >
      <h2 className="text-xl font-bold text-black mb-1">Send Us a Message</h2>
      <p className="text-sm text-black/35 !mt-0 mb-2">
        All fields marked with * are required.
      </p>

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
          className={`${inputBase} appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23000000%22%20fill-opacity%3D%220.3%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat pr-10`}
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

      <textarea
        name="message"
        rows={5}
        required
        placeholder="Your Message *"
        className={`${inputBase} resize-none`}
      />

      <input type="hidden" name="source_page" value={sourcePage} />

      {error && (
        <p className="text-red-600 text-sm font-medium">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#e7ab1c] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#d49c10] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(231,171,28,0.3)]"
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
