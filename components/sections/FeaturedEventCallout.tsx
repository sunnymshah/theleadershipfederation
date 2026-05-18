"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Calendar,
  MapPin,
  Sparkles,
  Ticket,
  Clock,
  CalendarDays,
  ShieldCheck,
} from "lucide-react"

interface FeaturedEventCalloutProps {
  event?: {
    title: string
    slug: string
    start_date: string
    end_date: string
    venue: string | null
    description: string | null
  }
}

/** Event cover — sharp inside the registration card, blurred behind. */
const COVER_IMAGE =
  "https://img.einpresswire.com/large/713803/4th-asia-leadership-awards.png"

function fmtDateRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  if (s.toDateString() === e.toDateString())
    return s.toLocaleDateString("en-US", { ...opts, year: "numeric" })
  const sMonth = s.toLocaleDateString("en-US", { month: "short" })
  const eMonth = e.toLocaleDateString("en-US", { month: "short" })
  if (sMonth === eMonth)
    return `${sMonth} ${s.getDate()}-${e.getDate()}, ${s.getFullYear()}`
  return `${s.toLocaleDateString("en-US", opts)} - ${e.toLocaleDateString("en-US", opts)}, ${s.getFullYear()}`
}

/** Inclusive day count of the event window (min 1). */
function getDayCount(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  const d = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1
  return Number.isFinite(d) && d > 0 ? d : 1
}

type Parts = { days: number; hours: number; minutes: number }
function getParts(target: string): Parts | null {
  const diff = new Date(target).getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
  }
}

/**
 * Featured-event callout.
 *
 *  • The cover photo is a heavily-blurred ambient backdrop — colour and
 *    atmosphere only, never detail that fights the copy.
 *  • A near-opaque navy scrim + a solid bg-[#1a1a2e] guarantee a dark
 *    backing so every word is legible.
 *  • The left column carries the headline + frosted info chips.
 *  • The right column is a self-contained REGISTRATION CARD: the sharp
 *    event photo, a live ticking countdown, the date, one primary
 *    "Register Now" action and a trust line.
 *
 * Content is always rendered (no scroll-gated opacity). The countdown
 * is seeded with a lazy initializer and ticks via an interval; the
 * digits carry `suppressHydrationWarning`.
 */
export function FeaturedEventCallout({ event }: FeaturedEventCalloutProps) {
  const startDate = event?.start_date
  const [parts, setParts] = useState<Parts | null>(() =>
    startDate ? getParts(startDate) : null,
  )

  useEffect(() => {
    if (!startDate) return
    const id = setInterval(() => setParts(getParts(startDate)), 1000)
    return () => clearInterval(id)
  }, [startDate])

  if (!event) return null
  const e = event
  const dateLabel = fmtDateRange(e.start_date, e.end_date)
  const dayCount = getDayCount(e.start_date, e.end_date)

  return (
    <section className="relative overflow-hidden isolate bg-[#1a1a2e]">
      {/* Blurred ambient backdrop. */}
      <div className="absolute inset-0 z-0">
        <Image
          src={COVER_IMAGE}
          alt=""
          fill
          unoptimized
          className="object-cover scale-125 blur-2xl opacity-60"
        />
      </div>
      {/* Navy scrim + gold glow. */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(560px circle at 85% 5%, rgba(231,171,28,0.22) 0%, transparent 55%), " +
            "linear-gradient(120deg, rgba(10,10,20,0.93) 0%, rgba(26,26,46,0.87) 45%, rgba(26,26,46,0.93) 100%)",
        }}
      />
      {/* White edge-fades into the pitch-white page. */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

      <div className="relative z-20 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
          {/* ── Left — event copy ──────────────────────────────────── */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 mb-7">
              <Sparkles size={13} className="text-[#e7ab1c]" />
              <span className="text-[11px] tracking-[0.18em] uppercase text-[#e7ab1c] font-bold">
                Featured Event
              </span>
            </div>

            <h2 className="text-[clamp(2rem,4.6vw,3.3rem)] leading-[1.06] text-white font-bold tracking-[-0.025em]">
              {e.title}
            </h2>

            {/* Frosted info chips */}
            <div className="mt-7 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.07] border border-white/10 text-[13px] font-semibold text-white">
                <Calendar size={14} className="text-[#e7ab1c]" />
                {dateLabel}
              </span>
              {e.venue && (
                <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.07] border border-white/10 text-[13px] font-semibold text-white">
                  <MapPin size={14} className="text-[#e7ab1c]" />
                  {e.venue}
                </span>
              )}
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.07] border border-white/10 text-[13px] font-semibold text-white">
                <CalendarDays size={14} className="text-[#e7ab1c]" />
                {dayCount}-Day Programme
              </span>
            </div>

            {e.description && (
              <p className="mt-6 text-white/80 text-[15px] leading-[1.75] max-w-xl">
                {e.description}
              </p>
            )}

            <div className="mt-7 inline-flex items-center gap-2 text-[13px] text-white/55">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Registrations are open — limited seats
            </div>
          </div>

          {/* ── Right — REGISTRATION CARD (the event-register CTA) ──── */}
          <div className="rounded-3xl overflow-hidden border border-white/12 bg-[#0a0a14] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.75)]">
            {/* Sharp event photo */}
            <div className="relative aspect-[16/9]">
              <Image
                src={COVER_IMAGE}
                alt={e.title}
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-[#0a0a14]/30 to-transparent" />
              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a0a14]/80 backdrop-blur-sm border border-white/10">
                <Ticket size={12} className="text-[#e7ab1c]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                  Now Registering
                </span>
              </div>
            </div>

            {/* Card body */}
            <div className="p-6 sm:p-7">
              {/* Compact date line */}
              <div className="flex items-center justify-center gap-2 text-[13px] font-semibold text-white/75 mb-5">
                <Calendar size={14} className="text-[#e7ab1c]" />
                {dateLabel}
              </div>

              {/* Live countdown */}
              <div className="flex items-center justify-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#e7ab1c] mb-3">
                <Clock size={12} />
                Event starts in
              </div>
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                {(
                  [
                    ["Days", parts?.days],
                    ["Hours", parts?.hours],
                    ["Mins", parts?.minutes],
                  ] as const
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl bg-white/[0.05] border border-white/10 py-3 text-center"
                  >
                    <div
                      suppressHydrationWarning
                      className="text-[26px] sm:text-[30px] font-bold text-white leading-none tabular-nums"
                    >
                      {value !== undefined
                        ? String(value).padStart(2, "0")
                        : "––"}
                    </div>
                    <div className="text-[10px] text-white/55 uppercase tracking-[0.12em] font-semibold mt-1.5">
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Primary register action */}
              <Link
                href={`/events/${e.slug}#tickets`}
                data-ab-convert
                className="group flex items-center justify-center gap-2 w-full px-7 py-[15px] rounded-full font-bold text-[15px] text-[#1a1a2e] bg-[#e7ab1c] hover:bg-[#f0b93a] transition-all duration-200 shadow-[0_10px_34px_rgba(231,171,28,0.5)] active:scale-[0.98]"
              >
                Register Now
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform duration-200"
                />
              </Link>

              {/* Trust line */}
              <div className="flex items-center justify-center gap-1.5 mt-3.5 text-[11.5px] text-white/45">
                <ShieldCheck size={13} className="text-emerald-400/80" />
                Secure checkout · Instant confirmation
              </div>

              {/* Secondary action */}
              <Link
                href={`/events/${e.slug}`}
                className="block text-center mt-3 text-[13px] font-semibold text-white/60 hover:text-white transition-colors"
              >
                View full event details →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
