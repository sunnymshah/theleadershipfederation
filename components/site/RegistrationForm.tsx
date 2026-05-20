"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  Award, Users, Handshake, Mic2, Scale,
  Loader2, CheckCircle2, Send, ArrowRight, Check,
} from "lucide-react"
import { submitRegistration } from "@/app/actions/registerActions"

/* Image-led role paths — each card carries a real Leadership Federation
 * photograph relevant to the path. */
const PARTICIPATION_TYPES = [
  {
    value: "delegate",
    label: "Delegate",
    icon: Users,
    image: "/hero-speaker.jpg",
    description: "Sit in the room with the CXOs, founders and policymakers shaping the next decade.",
  },
  {
    value: "speaker",
    label: "Speaker",
    icon: Mic2,
    image: "/platforms/conclave-pune.jpg",
    description: "Apply to take the stage at a flagship conclave, summit or forum.",
  },
  {
    value: "sponsor",
    label: "Sponsor",
    icon: Handshake,
    image: "/events/asia-leadership-awards.jpg",
    description: "Partner with an event — put your brand in front of a verified room of decision-makers.",
  },
  {
    value: "award_nomination",
    label: "Award Nomination",
    icon: Award,
    image: "/events/bharat-leadership-awards.jpg",
    description: "Nominate yourself or a distinguished leader for a Federation award.",
  },
  {
    value: "jury",
    label: "Jury Member",
    icon: Scale,
    image: "/platforms/conclave-2025.jpg",
    description: "Apply to serve on the independent award jury and evaluate nominees.",
  },
] as const

/* Membership intentionally lives on its own /memberships page with the
 * full tier table — it is not a participation type submitted here. */

type ParticipationType = (typeof PARTICIPATION_TYPES)[number]["value"]

interface RegistrationFormProps {
  events: { id: string; title: string; slug?: string | null }[]
}

export function RegistrationForm({ events }: RegistrationFormProps) {
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLDivElement>(null)

  const typeParam = searchParams.get("type") as ParticipationType | null
  const initialType =
    typeParam && PARTICIPATION_TYPES.some((t) => t.value === typeParam) ? typeParam : null

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
    setSelectedType(type)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  useEffect(() => {
    if (initialType) {
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

  const selected = PARTICIPATION_TYPES.find((t) => t.value === selectedType)
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
      {/* ── Picture-led role cards ── */}
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
                  "lf-glass group relative block rounded-[24px] p-2 sm:p-2.5 text-left transition-all duration-300 hover:-translate-y-1.5 cursor-pointer " +
                  (isSelected ? "ring-2 ring-[#0071e3]/55" : "")
                }
              >
                <div className="relative aspect-[5/4] rounded-[18px] overflow-hidden bg-[#0a0a14]">
                  <Image
                    src={type.image}
                    alt={type.label}
                    fill
                    sizes="(max-width: 640px) 100vw, 360px"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14]/85 via-[#0a0a14]/30 to-transparent" />
                  <div className="absolute inset-0 ring-1 ring-white/10 rounded-[18px]" />

                  {/* Top-left icon tile */}
                  <span
                    className={
                      "absolute top-3.5 left-3.5 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md transition-colors duration-300 " +
                      (isSelected
                        ? "bg-[#0071e3] shadow-[0_10px_24px_-8px_rgba(0,113,227,0.7)]"
                        : "bg-white/15 border border-white/30 group-hover:bg-[#0071e3]")
                    }
                  >
                    <Icon size={18} strokeWidth={1.9} className="text-white" />
                  </span>

                  {/* Top-right selected check */}
                  {isSelected && (
                    <span className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow">
                      <Check size={14} className="text-[#0071e3]" strokeWidth={2.6} />
                    </span>
                  )}

                  {/* Bottom text */}
                  <div className="absolute bottom-3.5 left-4 right-4">
                    <h3 className="text-[18px] sm:text-[19px] font-bold text-white tracking-[-0.015em] leading-tight">
                      {type.label}
                    </h3>
                    <p className="mt-1.5 text-[12.5px] text-white/80 leading-snug line-clamp-2">
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Form ── */}
      <div ref={formRef} className="max-w-3xl mx-auto px-6 sm:px-10 lg:px-16 pb-20 scroll-mt-24">
        <form
          onSubmit={handleSubmit}
          className="lf-glass-strong rounded-[28px] overflow-hidden"
        >
          {/* Selected-role banner — only when a path is chosen */}
          {selected && (
            <div className="relative h-[120px] sm:h-[140px] overflow-hidden bg-[#0a0a14]">
              <Image
                src={selected.image}
                alt={selected.label}
                fill
                sizes="(max-width: 1024px) 100vw, 720px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14]/90 via-[#0a0a14]/40 to-transparent" />
              <div className="absolute inset-0 flex items-end p-7">
                <div className="flex items-center gap-3.5">
                  <span className="w-11 h-11 rounded-xl bg-[#0071e3] flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(0,113,227,0.7)]">
                    <selected.icon size={20} className="text-white" strokeWidth={1.9} />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#4c9df2]">
                      Registering as
                    </p>
                    <p className="text-[19px] font-bold text-white tracking-[-0.015em]">
                      {selected.label}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-7 sm:p-10 space-y-4">
            {!selected && (
              <div className="mb-1">
                <h2 className="text-[20px] font-bold text-[#1d1d1f] tracking-[-0.02em]">
                  Registration details
                </h2>
                <p className="text-[13px] text-[#1d1d1f]/55 mt-1">
                  Pick a path above, or choose one in the dropdown. Fields marked * are required.
                </p>
              </div>
            )}

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
                {PARTICIPATION_TYPES.map((type) => (
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
          </div>
        </form>
      </div>
    </div>
  )
}
