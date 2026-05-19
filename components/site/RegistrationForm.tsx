"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import {
  Award, Users, Handshake, Mic2, Scale, Crown,
  Loader2, CheckCircle2, Send, ArrowRight, ArrowUpRight,
} from "lucide-react"
import { submitRegistration } from "@/app/actions/registerActions"

const PARTICIPATION_TYPES = [
  {
    value: "delegate",
    label: "Delegate",
    icon: Users,
    description: "Attend a flagship conclave or summit alongside global leaders.",
  },
  {
    value: "speaker",
    label: "Speaker",
    icon: Mic2,
    description: "Apply to take the stage at a conclave, summit or forum.",
  },
  {
    value: "sponsor",
    label: "Sponsor",
    icon: Handshake,
    description: "Partner with an event and put your brand in the room.",
  },
  {
    value: "award_nomination",
    label: "Award Nomination",
    icon: Award,
    description: "Nominate yourself or a distinguished leader for an award.",
  },
  {
    value: "jury",
    label: "Jury Member",
    icon: Scale,
    description: "Apply to serve on the award jury and evaluate nominees.",
  },
  {
    value: "membership",
    label: "Membership",
    icon: Crown,
    description: "Join the Inner Circle membership for exclusive CXO access.",
  },
] as const

type ParticipationType = (typeof PARTICIPATION_TYPES)[number]["value"]

interface RegistrationFormProps {
  events: { id: string; title: string; slug?: string | null }[]
}

export function RegistrationForm({ events }: RegistrationFormProps) {
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLDivElement>(null)

  const typeParam = searchParams.get("type") as ParticipationType | null
  const initialType =
    typeParam && PARTICIPATION_TYPES.some((t) => t.value === typeParam)
      ? typeParam
      : null

  const eventParam = searchParams.get("event")
  const initialEventId = eventParam
    ? events.find((e) => e.id === eventParam || e.slug === eventParam)?.id ?? ""
    : ""

  const [selectedType, setSelectedType] = useState<ParticipationType | null>(initialType)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)

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
    if (result.success) setSuccess(true)
    else setError(result.error ?? "Something went wrong. Please try again.")
    setSubmitting(false)
  }

  const inputBase =
    "w-full px-4 py-3.5 bg-white border border-black/[0.09] rounded-xl text-[14px] text-[#1d1d1f] placeholder-[#1d1d1f]/45 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-transparent transition-all"
  const selectArrowStyle = `${inputBase} appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23000000%22%20fill-opacity%3D%220.3%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_16px_center] bg-no-repeat pr-10`

  if (success) {
    return (
      <div className="max-w-3xl mx-auto px-6 sm:px-10 lg:px-16 pb-4">
        <div className="lf-glass-strong rounded-[28px] p-10 sm:p-14 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-6">
            <CheckCircle2 size={30} className="text-emerald-600" />
          </div>
          <h3 className="text-[clamp(1.5rem,3vw,2rem)] font-bold text-[#1d1d1f] tracking-[-0.025em] mb-3">
            Registration submitted
          </h3>
          <p className="text-[15px] text-[#1d1d1f]/60 max-w-md leading-relaxed mb-7">
            Thank you for your interest in The Leadership Federation. Our team
            reviews every registration and will be in touch within 48 hours.
          </p>
          <button
            onClick={() => {
              setSuccess(false)
              setSelectedType(null)
              setConsent(false)
            }}
            className="lf-glass inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-bold text-[#1d1d1f] transition-all duration-200"
          >
            Submit another <ArrowRight size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ── Role selector ── */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pb-14 lg:pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {PARTICIPATION_TYPES.map((type) => {
            const Icon = type.icon
            const isSelected = selectedType === type.value
            return (
              <button
                key={type.value}
                onClick={() => handleTypeSelect(type.value)}
                className={
                  "lf-glass group text-left rounded-[22px] p-6 flex flex-col items-start transition-all duration-300 hover:-translate-y-1.5 cursor-pointer " +
                  (isSelected ? "ring-2 ring-[#0071e3]/50" : "")
                }
              >
                <span
                  className={
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300 " +
                    (isSelected
                      ? "bg-[#0071e3] shadow-[0_10px_24px_-8px_rgba(0,113,227,0.6)]"
                      : "bg-[#0071e3]/[0.1] border border-[#0071e3]/15 group-hover:bg-[#0071e3]")
                  }
                >
                  <Icon
                    size={21}
                    strokeWidth={1.9}
                    className={
                      isSelected
                        ? "text-white"
                        : "text-[#0071e3] group-hover:text-white transition-colors duration-300"
                    }
                  />
                </span>
                <h3 className="text-[16px] font-bold text-[#1d1d1f] mb-1.5 tracking-[-0.015em]">
                  {type.label}
                </h3>
                <p className="text-[13px] text-[#1d1d1f]/60 leading-[1.6]">
                  {type.description}
                </p>
                {type.value === "membership" ? (
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0071e3]">
                    View membership tiers <ArrowUpRight size={13} />
                  </span>
                ) : (
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0071e3] opacity-0 group-hover:opacity-100 transition-opacity">
                    Select <ArrowRight size={12} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Form ── */}
      <div ref={formRef} className="max-w-3xl mx-auto px-6 sm:px-10 lg:px-16 pb-20 scroll-mt-24">
        <form
          onSubmit={handleSubmit}
          className="lf-glass-strong rounded-[28px] p-7 sm:p-10 space-y-4"
        >
          <div className="mb-1">
            <h2 className="text-[20px] font-bold text-[#1d1d1f] tracking-[-0.02em]">
              Registration details
            </h2>
            <p className="text-[13px] text-[#1d1d1f]/55 mt-1">
              {selectedType
                ? `Registering as ${PARTICIPATION_TYPES.find((t) => t.value === selectedType)?.label}. `
                : "Pick a role above, or choose one in the dropdown. "}
              Fields marked * are required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="name" required placeholder="Full name *" className={inputBase} />
            <input type="email" name="email" required placeholder="Email address *" className={inputBase} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="tel" name="phone" required placeholder="Phone number *" className={inputBase} />
            <input type="text" name="company" placeholder="Company / organisation" className={inputBase} />
          </div>
          <input type="text" name="designation" placeholder="Designation / title" className={inputBase} />

          {/* Honeypot */}
          <input
            type="text"
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
            className="absolute left-[-9999px] w-px h-px opacity-0"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select name="event_id" defaultValue={initialEventId} className={selectArrowStyle}>
              <option value="">Select event (optional)</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
            <select
              value={selectedType ?? ""}
              onChange={(e) => setSelectedType(e.target.value as ParticipationType)}
              required
              className={selectArrowStyle}
            >
              <option value="" disabled>Participation type *</option>
              {PARTICIPATION_TYPES.filter((t) => t.value !== "membership").map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <textarea
            name="message"
            rows={4}
            placeholder="Message / additional information"
            className={`${inputBase} resize-none`}
          />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-black/20 accent-[#0071e3]"
            />
            <span className="text-[13px] text-[#1d1d1f]/65 leading-relaxed">
              I agree to the{" "}
              <a href="/terms" target="_blank" className="text-[#0071e3] hover:underline font-semibold">Terms &amp; Conditions</a>{" "}
              and{" "}
              <a href="/privacy-policy" target="_blank" className="text-[#0071e3] hover:underline font-semibold">Privacy Policy</a>,
              and consent to The Leadership Federation contacting me about my registration.
            </span>
          </label>

          {error && <p className="text-red-500 text-[13px] font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !selectedType}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-[15px] rounded-full bg-[#0071e3] text-white text-[14px] font-bold transition-all duration-200 hover:bg-[#0077ed] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_14px_34px_-12px_rgba(0,113,227,0.7)]"
          >
            {submitting ? (
              <><Loader2 size={16} className="animate-spin" /> Submitting…</>
            ) : (
              <><Send size={15} /> Submit registration</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
