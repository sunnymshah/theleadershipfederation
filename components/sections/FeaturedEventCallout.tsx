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

/** Event cover — hosted locally in /public so it loads instantly and is
 *  optimised by next/image (WebP/AVIF, resized, edge-cached). */
const COVER_IMAGE = "/events/asia-leadership-awards.jpg"

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
 * Featured-event callout — a clean light section (Soft Monochrome).
 *
 *  • Left column: the headline + light info chips + description.
 *  • Right column: a self-contained white REGISTRATION CARD — the sharp
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
    <section className="relative bg-[#f5f5f7]">
      <div className="relative max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
          {/* ── Left — event copy ──────────────────────────────────── */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0071e3]/[0.08] border border-[#0071e3]/15 mb-7">
              <Sparkles size={13} className="text-[#0071e3]" />
              <span className="text-[11px] tracking-[0.18em] uppercase text-[#0071e3] font-bold">
                Featured Event
              </span>
            </div>

            <h2 className="text-[clamp(2rem,4.6vw,3.3rem)] leading-[1.06] text-[#1d1d1f] font-bold tracking-[-0.025em]">
              {e.title}
            </h2>

            {/* Info chips */}
            <div className="mt-7 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-black/[0.07] text-[13px] font-semibold text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <Calendar size={14} className="text-[#0071e3]" />
                {dateLabel}
              </span>
              {e.venue && (
                <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-black/[0.07] text-[13px] font-semibold text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <MapPin size={14} className="text-[#0071e3]" />
                  {e.venue}
                </span>
              )}
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-black/[0.07] text-[13px] font-semibold text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <CalendarDays size={14} className="text-[#0071e3]" />
                {dayCount}-Day Programme
              </span>
            </div>

            {e.description && (
              <p className="mt-6 text-[#1d1d1f]/65 text-[15px] leading-[1.75] max-w-xl">
                {e.description}
              </p>
            )}

            <div className="mt-7 inline-flex items-center gap-2 text-[13px] text-[#1d1d1f]/55">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Registrations are open — limited seats
            </div>
          </div>

          {/* ── Right — REGISTRATION CARD ──────────────────────────── */}
          <div className="rounded-3xl overflow-hidden border border-black/[0.07] bg-white shadow-[0_30px_70px_-28px_rgba(0,0,0,0.28)]">
            {/* Sharp event photo */}
            <div className="relative aspect-[16/9]">
              <Image
                src={COVER_IMAGE}
                alt={e.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-cover"
              />
              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-black/[0.06]">
                <Ticket size={12} className="text-[#0071e3]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1d1d1f]">
                  Now Registering
                </span>
              </div>
            </div>

            {/* Card body */}
            <div className="p-6 sm:p-7">
              {/* Compact date line */}
              <div className="flex items-center justify-center gap-2 text-[13px] font-semibold text-[#1d1d1f]/70 mb-5">
                <Calendar size={14} className="text-[#0071e3]" />
                {dateLabel}
              </div>

              {/* Live countdown */}
              <div className="flex items-center justify-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#0071e3] mb-3">
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
                    className="rounded-xl bg-[#f5f5f7] border border-black/[0.06] py-3 text-center"
                  >
                    <div
                      suppressHydrationWarning
                      className="text-[26px] sm:text-[30px] font-bold text-[#1d1d1f] leading-none tabular-nums"
                    >
                      {value !== undefined
                        ? String(value).padStart(2, "0")
                        : "––"}
                    </div>
                    <div className="text-[10px] text-[#1d1d1f]/50 uppercase tracking-[0.12em] font-semibold mt-1.5">
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Primary register action */}
              <Link
                href="/register"
                data-ab-convert
                className="group flex items-center justify-center gap-2 w-full px-7 py-[15px] rounded-full font-bold text-[15px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_10px_30px_-8px_rgba(0,113,227,0.45)] active:scale-[0.98]"
              >
                Register Now
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform duration-200"
                />
              </Link>

              {/* Trust line */}
              <div className="flex items-center justify-center gap-1.5 mt-3.5 text-[11.5px] text-[#1d1d1f]/45">
                <ShieldCheck size={13} className="text-emerald-500" />
                Secure checkout · Instant confirmation
              </div>

              {/* Secondary action */}
              <Link
                href={`/events/${e.slug}`}
                className="block text-center mt-3 text-[13px] font-semibold text-[#0071e3] hover:text-[#0077ed] transition-colors"
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
