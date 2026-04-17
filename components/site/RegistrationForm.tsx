"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import {
  Award,
  Users,
  Handshake,
  Mic2,
  Scale,
  Crown,
  Loader2,
  CheckCircle2,
  Send,
  ArrowRight,
} from "lucide-react"
import { submitRegistration } from "@/app/actions/registerActions"

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

const PARTICIPATION_TYPES = [
  {
    value: "award_nomination",
    label: "Award Nomination",
    icon: Award,
    description:
      "Nominate yourself or a distinguished leader for a Leadership Federation award.",
  },
  {
    value: "delegate",
    label: "Delegate",
    icon: Users,
    description:
      "Register as a conference attendee and join global leaders at our events.",
  },
  {
    value: "sponsor",
    label: "Sponsor",
    icon: Handshake,
    description:
      "Express interest in sponsoring an event and elevate your brand visibility.",
  },
  {
    value: "speaker",
    label: "Speaker",
    icon: Mic2,
    description:
      "Apply to speak at one of our flagship conclaves, summits, or forums.",
  },
  {
    value: "jury",
    label: "Jury Member",
    icon: Scale,
    description:
      "Apply to serve on our esteemed award jury panel and evaluate nominees.",
  },
  {
    value: "membership",
    label: "Membership",
    icon: Crown,
    description:
      "Join the Inner Circle membership program for exclusive CXO access.",
  },
] as const

type ParticipationType = (typeof PARTICIPATION_TYPES)[number]["value"]

interface RegistrationFormProps {
  events: { id: string; title: string }[]
}

export function RegistrationForm({ events }: RegistrationFormProps) {
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLDivElement>(null)

  const typeParam = searchParams.get("type") as ParticipationType | null
  const initialType =
    typeParam && PARTICIPATION_TYPES.some((t) => t.value === typeParam)
      ? typeParam
      : null

  const [selectedType, setSelectedType] = useState<ParticipationType | null>(
    initialType
  )
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)

  // Scroll to form when type is selected via card click
  function handleTypeSelect(type: ParticipationType) {
    if (type === "membership") {
      window.location.href = "/memberships"
      return
    }
    setSelectedType(type)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  // Pre-select from URL params on mount
  useEffect(() => {
    if (initialType && initialType !== "membership") {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 500)
    }
  }, [initialType])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!consent) {
      setError("Please agree to the terms before submitting.")
      return
    }
    setSubmitting(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    fd.set("participation_type", selectedType!)

    const result = await submitRegistration(fd)
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error ?? "Something went wrong. Please try again.")
    }
    setSubmitting(false)
  }

  const inputBase =
    "w-full px-4 py-3 bg-[#F4F8FF] border border-[#1a1a2e]/[0.10] rounded-xl text-sm text-[#1a1a2e] placeholder-[#1a1a2e]/55 focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-colors"

  const selectArrowStyle = `${inputBase} appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23000000%22%20fill-opacity%3D%220.3%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat pr-10`

  if (success) {
    return (
      <>
        {/* Role selector cards - still visible */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <RoleCards selectedType={selectedType} onSelect={handleTypeSelect} />
        </section>

        {/* Success message */}
        <section className="max-w-3xl mx-auto px-6 pb-20">
          <div className="bg-white border border-[#1a1a2e]/[0.06] shadow-sm rounded-2xl p-10 md:p-14 text-center flex flex-col items-center justify-center min-h-[400px]">
            <CheckCircle2 size={48} className="text-emerald-500 mb-5" />
            <h3
              className="text-2xl font-bold text-[#1a1a2e] mb-3"
              style={sfFont}
            >
              Registration Submitted
            </h3>
            <p className="text-[#1a1a2e]/75 max-w-md leading-relaxed mb-6">
              Thank you for your interest in The Leadership Federation. Our team
              will review your registration and get back to you within 48 hours.
            </p>
            <button
              onClick={() => {
                setSuccess(false)
                setSelectedType(null)
                setConsent(false)
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#1a1a2e]/15 text-sm font-semibold text-[#1a1a2e] hover:border-[#e7ab1c]/40 hover:text-[#e7ab1c] transition-all"
            >
              Submit Another Registration <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      {/* Role selector cards */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <RoleCards selectedType={selectedType} onSelect={handleTypeSelect} />
      </section>

      {/* Registration form */}
      <section ref={formRef} className="max-w-3xl mx-auto px-6 pb-20">
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#1a1a2e]/[0.06] shadow-sm rounded-2xl p-8 md:p-10 space-y-5"
        >
          <h2
            className="text-xl font-bold text-[#1a1a2e] mb-1"
            style={sfFont}
          >
            Registration Form
          </h2>
          <p className="text-sm text-[#1a1a2e]/65 !mt-0 mb-2">
            {selectedType
              ? `Registering as: ${PARTICIPATION_TYPES.find((t) => t.value === selectedType)?.label}. `
              : "Select a role above or choose from the dropdown below. "}
            Fields marked with * are required.
          </p>

          {/* Name + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
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

          {/* Phone + Company */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="tel"
              name="phone"
              required
              placeholder="Phone Number *"
              className={inputBase}
            />
            <input
              type="text"
              name="company"
              placeholder="Company / Organization"
              className={inputBase}
            />
          </div>

          {/* Designation */}
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              name="designation"
              placeholder="Designation / Title"
              className={inputBase}
            />
          </div>

          {/* Honeypot — hidden to humans, bots fill it */}
          <input
            type="text"
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
            className="absolute left-[-9999px] w-px h-px opacity-0"
            aria-hidden="true"
          />

          {/* Event + Participation Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              name="event_id"
              defaultValue=""
              className={selectArrowStyle}
            >
              <option value="">Select Event (optional)</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>

            <select
              value={selectedType ?? ""}
              onChange={(e) =>
                setSelectedType(e.target.value as ParticipationType)
              }
              required
              className={selectArrowStyle}
            >
              <option value="" disabled>
                Participation Type *
              </option>
              {PARTICIPATION_TYPES.filter((t) => t.value !== "membership").map(
                (type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Message */}
          <textarea
            name="message"
            rows={4}
            placeholder="Message / Additional Information"
            className={`${inputBase} resize-none`}
          />

          {/* Consent checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#1a1a2e]/20 text-[#e7ab1c] focus:ring-[#e7ab1c]/30 accent-[#e7ab1c]"
            />
            <span className="text-sm text-[#1a1a2e]/70 leading-relaxed">
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                className="text-[#e7ab1c] hover:underline"
              >
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                className="text-[#e7ab1c] hover:underline"
              >
                Privacy Policy
              </a>
              . I consent to The Leadership Federation contacting me regarding
              my registration.
            </span>
          </label>

          {error && (
            <p className="text-red-600 text-sm font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedType}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#e7ab1c] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#d49c10] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(231,171,28,0.3)]"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Send size={15} /> Submit Registration
              </>
            )}
          </button>
        </form>
      </section>
    </>
  )
}

/** Role selector cards component */
function RoleCards({
  selectedType,
  onSelect,
}: {
  selectedType: ParticipationType | null
  onSelect: (type: ParticipationType) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {PARTICIPATION_TYPES.map((type) => {
        const Icon = type.icon
        const isSelected = selectedType === type.value
        return (
          <button
            key={type.value}
            onClick={() => onSelect(type.value)}
            className={`text-left bg-white border shadow-sm rounded-2xl p-6 flex flex-col items-start transition-all duration-300 hover:shadow-md group cursor-pointer ${
              isSelected
                ? "border-[#e7ab1c] shadow-[0_0_0_1px_#e7ab1c] bg-[#e7ab1c]/[0.03]"
                : "border-[#1a1a2e]/[0.06] hover:border-[#e7ab1c]/30"
            }`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                isSelected
                  ? "bg-[#e7ab1c]/20 border border-[#e7ab1c]/40"
                  : "bg-[#e7ab1c]/15 border border-[#e7ab1c]/30"
              }`}
            >
              <Icon
                size={20}
                className={`transition-colors ${
                  isSelected
                    ? "text-[#e7ab1c]"
                    : "text-[#e7ab1c] group-hover:text-[#d49c10]"
                }`}
              />
            </div>
            <h3
              className="text-base font-bold text-[#1a1a2e] mb-1.5"
              style={sfFont}
            >
              {type.label}
            </h3>
            <p className="text-sm text-[#1a1a2e]/75 leading-relaxed">
              {type.description}
            </p>
            {type.value === "membership" && (
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#e7ab1c]">
                View Membership Tiers <ArrowRight size={12} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
