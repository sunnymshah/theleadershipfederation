"use client"

import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { GoldChevrons, GoldOrbs } from "@/components/ui/GoldPattern"
import { AnimatedCounter } from "@/components/ui/AnimatedCounter"
import { MagneticButton } from "@/components/ui/MagneticButton"

const sfDisplay = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}
const sfText = {
  fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

export interface HeroEvent {
  title: string
  slug: string
  start_date: string
  end_date: string
  venue: string | null
}

export interface HeroStats {
  events: number
  speakers: number
}

function fmtDateRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const sMonth = s.toLocaleDateString("en-US", { month: "short" })
  const eMonth = e.toLocaleDateString("en-US", { month: "short" })
  if (s.toDateString() === e.toDateString()) return `${sMonth} ${s.getDate()}`
  if (sMonth === eMonth) return `${sMonth} ${s.getDate()}-${e.getDate()}`
  return `${sMonth} ${s.getDate()} - ${eMonth} ${e.getDate()}`
}

function getDaysUntil(targetDate: string): number | null {
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) return null
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const TYPEWRITER_TEXT = "Direct Access to "
const TYPEWRITER_CHARS = TYPEWRITER_TEXT.length
const CHAR_DURATION_MS = 70
const TYPING_TOTAL_MS = TYPEWRITER_CHARS * CHAR_DURATION_MS
const GOLD_DELAY_MS = TYPING_TOTAL_MS + 300

export function HeroSection({ event, stats }: { event?: HeroEvent; stats?: HeroStats }) {
  const sectionRef = useRef<HTMLElement>(null)
  const [imageOffset, setImageOffset] = useState(0)
  const [daysLeft, setDaysLeft] = useState<number | null>(event ? getDaysUntil(event.start_date) : null)

  useEffect(() => {
    if (!event?.start_date) return
    setDaysLeft(getDaysUntil(event.start_date))
    const interval = setInterval(() => setDaysLeft(getDaysUntil(event.start_date)), 60_000)
    return () => clearInterval(interval)
  }, [event?.start_date])

  const statItems = [
    { value: stats?.events ?? 50, suffix: "+", label: "Events" },
    { value: stats?.speakers ?? 500, suffix: "+", label: "Speakers" },
    { value: 30, suffix: "+", label: "Countries" },
  ]

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    let ticking = false
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const rect = section!.getBoundingClientRect()
        const sectionH = section!.offsetHeight
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          const progress = Math.min(1, Math.max(0, -rect.top / sectionH))
          setImageOffset(progress)
        }
        ticking = false
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const imageY = imageOffset * 60
  const imageScale = 1 + imageOffset * 0.04

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#F4F8FF]"
    >
      {/* Background patterns — behind everything */}
      <div className="absolute inset-0 z-0">
        <GoldChevrons />
        <GoldOrbs />
      </div>

      <style jsx>{`
        @keyframes heroFadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroScaleIn {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes heroBadgeIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes heroEditionIn {
          from { opacity: 0; transform: scale(0.8) rotate(6deg); }
          to   { opacity: 1; transform: scale(1) rotate(6deg); }
        }
        .hero-anim {
          opacity: 0;
          animation: heroFadeIn 0.8s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .hero-anim-scale {
          opacity: 0;
          animation: heroScaleIn 1.1s cubic-bezier(0.16,1,0.3,1) 0.15s forwards;
        }
        .hero-anim-badge {
          opacity: 0;
          animation: heroBadgeIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.9s forwards;
        }
        .hero-anim-edition {
          opacity: 0;
          animation: heroEditionIn 0.6s ease 1.2s forwards;
        }

        @keyframes typing {
          from { max-width: 0; }
          to   { max-width: ${TYPEWRITER_CHARS + 1}ch; }
        }
        @keyframes blink-caret {
          from, to { border-color: currentColor; }
          50%      { border-color: transparent; }
        }
        @keyframes hide-caret {
          to { border-color: transparent; }
        }
        .hero-typewriter {
          display: inline-block;
          max-width: 0;
          overflow: hidden;
          white-space: nowrap;
          border-right: 2px solid currentColor;
          animation:
            typing ${TYPING_TOTAL_MS}ms steps(${TYPEWRITER_CHARS}, end) 0.4s forwards,
            blink-caret 0.6s step-end 6,
            hide-caret 0s ${GOLD_DELAY_MS + 200}ms forwards;
        }
        @keyframes goldReveal {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-gold-words {
          opacity: 0;
          display: inline-block;
          animation: goldReveal 0.7s cubic-bezier(0.16,1,0.3,1) ${GOLD_DELAY_MS}ms forwards;
        }

        /* Subtle glow behind stats on appear */
        @keyframes statLine {
          from { width: 0; }
          to   { width: 100%; }
        }
        .stat-line {
          animation: statLine 0.6s ease 2s forwards;
          width: 0;
        }
      `}</style>

      {/* Content — z-10 to sit above patterns but below navbar (z-50) */}
      <div className="relative z-10 max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-16 pt-24 lg:pt-28 pb-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center min-h-[calc(100vh-7rem)]">

          {/* LEFT — Copy (7 cols) */}
          <div className="lg:col-span-7 order-2 lg:order-1 flex flex-col justify-center">
            {/* Live event badge */}
            <div
              className="hero-anim inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e7ab1c]/[0.08] border border-[#e7ab1c]/[0.12] mb-8 self-start"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#e7ab1c] animate-pulse" />
              <span className="text-[10px] font-bold text-[#e7ab1c] tracking-[0.08em] uppercase" style={sfText}>
                {event
                  ? `${event.title} — ${fmtDateRange(event.start_date, event.end_date)}${event.venue ? `, ${event.venue}` : ""}`
                  : "Explore Upcoming Events"}
              </span>
            </div>

            {/* Headline */}
            <h1
              className="leading-[0.92] tracking-[-0.035em] text-black mb-7"
              style={{
                fontSize: "clamp(2.6rem, 5vw, 4.5rem)",
                fontWeight: 700,
                ...sfDisplay,
              }}
            >
              <span className="hero-typewriter">Direct Access to&nbsp;</span>
              <br className="hidden sm:block" />
              <span className="hero-gold-words text-[#e7ab1c]">
                Global Leaders
              </span>
            </h1>

            {/* Subtext */}
            <p
              className="hero-anim max-w-[420px] text-black/35 leading-[1.75] text-[15px]"
              style={{ animationDelay: "0.2s", ...sfText }}
            >
              Connecting GCC leaders, CXOs, and decision-makers through
              high-value conversations, strategic partnerships, and curated access.
            </p>

            {/* CTAs */}
            <div
              className="hero-anim mt-9 flex flex-wrap items-center gap-4"
              style={{ animationDelay: "0.35s" }}
            >
              <MagneticButton>
                <Link
                  href="/events"
                  className="group inline-flex items-center gap-2.5 px-8 py-[14px] rounded-full font-semibold text-[14px] text-white bg-[#e7ab1c] hover:bg-[#d49c10] transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] shadow-[0_4px_24px_rgba(231,171,28,0.25)]"
                >
                  Explore Events
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link
                  href="/platforms"
                  className="inline-flex items-center gap-2 px-7 py-[13px] rounded-full text-[14px] font-medium text-black/45 border border-black/[0.08] hover:border-black/15 hover:text-black/70 transition-all duration-200"
                >
                  Join Inner Circle
                </Link>
              </MagneticButton>
            </div>

            {/* Stats bar */}
            <div
              className="hero-anim mt-12 flex items-center"
              style={{ animationDelay: "0.5s" }}
            >
              {statItems.map(({ value, suffix, label }, i) => (
                <div key={label} className="flex items-center">
                  {i > 0 && <div className="w-px h-8 bg-black/[0.06] mx-6 sm:mx-8" />}
                  <div>
                    <div className="text-[22px] sm:text-[28px] font-bold text-black tracking-tight leading-none" style={sfDisplay}>
                      <AnimatedCounter value={value} suffix={suffix} duration={2200 + i * 300} />
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-black/25 tracking-[0.12em] uppercase font-semibold mt-1.5" style={sfText}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Image (5 cols) */}
          <div className="hero-anim-scale lg:col-span-5 order-1 lg:order-2 flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-[420px] lg:max-w-none">
              {/* Main photo */}
              <div className="relative w-full aspect-[3/4] rounded-[28px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.12)]">
                <div
                  className="w-full h-full"
                  style={{
                    transform: `translateY(${imageY}px) scale(${imageScale})`,
                    willChange: "transform",
                  }}
                >
                  <Image
                    src="/hero-speaker.jpg"
                    alt="Speaker on stage at a Leadership Federation event"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 90vw, 40vw"
                  />
                </div>
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/5" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#F4F8FF]/20 via-transparent to-transparent lg:from-[#F4F8FF]/30" />
              </div>

              {/* Next event floating card */}
              {event && (
                <Link href={`/events/${event.slug}`} className="hero-anim-badge absolute -bottom-5 -left-4 sm:-left-6 bg-white/95 backdrop-blur-2xl rounded-2xl px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-black/[0.04] hover:shadow-[0_16px_50px_rgba(0,0,0,0.12)] transition-shadow">
                  <div className="text-[9px] text-[#e7ab1c] uppercase tracking-[0.14em] font-bold mb-1.5" style={sfText}>Next Event</div>
                  <div className="text-[15px] font-bold text-black leading-tight" style={sfDisplay}>{event.title}</div>
                  <div className="text-[12px] text-black/35 mt-0.5" style={sfText}>
                    {fmtDateRange(event.start_date, event.end_date)}{event.venue ? ` · ${event.venue}` : ""}
                  </div>
                  {daysLeft !== null && (
                    <div className="text-[11px] font-bold text-[#e7ab1c] mt-1.5" style={sfText}>
                      {daysLeft} day{daysLeft !== 1 ? "s" : ""} to go
                    </div>
                  )}
                </Link>
              )}

              {/* Countdown badge — inset inside image */}
              {event && daysLeft !== null && (
                <div className="hero-anim-edition absolute top-4 right-4 w-14 h-14 bg-[#e7ab1c] rounded-xl flex flex-col items-center justify-center shadow-[0_8px_20px_rgba(231,171,28,0.35)]">
                  <span className="text-[17px] font-bold text-white leading-none tabular-nums">{daysLeft}</span>
                  <span className="text-[7px] text-white/70 uppercase tracking-wider font-semibold">Days</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#F4F8FF] to-transparent z-10 pointer-events-none" />
    </section>
  )
}
