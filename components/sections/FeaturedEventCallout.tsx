"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Calendar, MapPin, Sparkles } from "lucide-react"
import { MagneticButton } from "@/components/ui/MagneticButton"

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

/** Event cover used for the sharp framed thumbnail + the blurred backdrop. */
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

function getDaysUntil(targetDate: string): number | null {
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) return null
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Featured-event callout — REDESIGNED for guaranteed text legibility.
 *
 * The previous version laid white text directly over a busy, bright
 * award-collage photo, so the copy was unreadable. The new treatment:
 *
 *   • the cover photo is pushed back as a HEAVILY BLURRED, scaled
 *     ambient wash — it contributes colour + atmosphere, never detail
 *     that fights the text;
 *   • a near-opaque navy gradient sits on top, giving every word a
 *     guaranteed dark backing (no dependency on the photo's tones);
 *   • the actual event photo still gets shown — but deliberately, as a
 *     SHARP, gold-framed thumbnail in the right column, so it reads as
 *     an intentional design element instead of visual noise;
 *   • the countdown lives in a frosted-glass card.
 *
 * Content is always rendered (no scroll-gated opacity) — visibility is
 * never conditional on an observer firing.
 */
export function FeaturedEventCallout({ event }: FeaturedEventCalloutProps) {
  if (!event) return null
  const e = event
  const days = getDaysUntil(e.start_date)

  return (
    <section className="relative overflow-hidden isolate">
      {/* ── Layer 1: blurred ambient backdrop ───────────────────────
          The collage photo, blurred into a soft colour wash. scale-125
          hides the blur's transparent edges. */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={COVER_IMAGE}
          alt=""
          fill
          unoptimized
          aria-hidden
          className="object-cover scale-125 blur-2xl"
        />
      </div>

      {/* ── Layer 2: near-opaque navy scrim + gold glow ─────────────
          Guarantees a dark backing for every word regardless of the
          photo behind it. The warm gold radial (top-right) and the
          navy linear are stacked in ONE background so this stays a
          single `inset-0` element. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(540px circle at 88% 0%, rgba(231,171,28,0.20) 0%, transparent 55%), " +
            "linear-gradient(120deg, rgba(10,10,20,0.97) 0%, rgba(26,26,46,0.94) 45%, rgba(26,26,46,0.97) 100%)",
        }}
      />

      {/* White edge-fades blend the dark band into the pitch-white page. */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

      <div className="relative z-20 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-14 items-center">
          {/* ── Left — event copy ──────────────────────────────────── */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e7ab1c]/15 border border-[#e7ab1c]/30 mb-7">
              <Sparkles size={13} className="text-[#e7ab1c]" />
              <span className="text-[11px] tracking-[0.18em] uppercase text-[#e7ab1c] font-bold">
                Featured Event
              </span>
            </div>

            <h2 className="text-[clamp(1.9rem,4.4vw,3.1rem)] leading-[1.08] text-white font-bold tracking-[-0.02em]">
              {e.title}
            </h2>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-white/90 text-[14px] font-medium">
              <span className="inline-flex items-center gap-2">
                <Calendar size={15} strokeWidth={2} className="text-[#e7ab1c]" />
                {fmtDateRange(e.start_date, e.end_date)}
              </span>
              {e.venue && (
                <span className="inline-flex items-center gap-2">
                  <MapPin size={15} strokeWidth={2} className="text-[#e7ab1c]" />
                  {e.venue}
                </span>
              )}
            </div>

            {e.description && (
              <p className="mt-6 text-white/80 text-[15px] leading-[1.75] max-w-xl">
                {e.description}
              </p>
            )}

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <MagneticButton>
                <Link
                  href={`/events/${e.slug}#tickets`}
                  className="group inline-flex items-center gap-2 px-8 py-[15px] rounded-full font-bold text-[14px] text-[#1a1a2e] bg-[#e7ab1c] hover:bg-[#f0b93a] transition-all duration-200 shadow-[0_8px_30px_rgba(231,171,28,0.45)]"
                >
                  Buy Tickets
                  <ArrowRight
                    size={15}
                    className="group-hover:translate-x-1 transition-transform duration-200"
                  />
                </Link>
              </MagneticButton>
              <Link
                href={`/events/${e.slug}`}
                className="inline-flex items-center gap-2 px-7 py-[14px] rounded-full font-bold text-[14px] text-white border border-white/35 hover:border-white/70 hover:bg-white/10 transition-all duration-200"
              >
                View Details
              </Link>
            </div>
          </div>

          {/* ── Right — sharp framed photo + countdown ─────────────── */}
          <div className="flex flex-col gap-5">
            {/* The actual event photo, SHARP, in a gold frame — the
                deliberate hero image (vs. the blurred backdrop). */}
            <div className="relative rounded-2xl overflow-hidden border border-[#e7ab1c]/40 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]">
              <div className="relative aspect-[16/10]">
                <Image
                  src={COVER_IMAGE}
                  alt={e.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
                {/* Slight bottom darkening so a caption could sit if needed. */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14]/40 to-transparent" />
              </div>
            </div>

            {/* Countdown — frosted glass. */}
            {days !== null && (
              <div className="flex items-center gap-4 rounded-2xl px-6 py-5 bg-white/[0.07] backdrop-blur-xl border border-white/15">
                <div className="text-[44px] font-bold text-[#e7ab1c] leading-none tabular-nums">
                  {days}
                </div>
                <div className="leading-tight">
                  <div className="text-[12px] text-white uppercase tracking-[0.16em] font-bold">
                    Days to go
                  </div>
                  <div className="text-[12px] text-white/65 mt-0.5">
                    until doors open
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
