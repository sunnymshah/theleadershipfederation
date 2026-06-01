"use client"

import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, ArrowDown } from "lucide-react"

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

/* The kinetic headline, word by word. Each word rises out of a mask on
 * load, staggered. The two accent words are flagged for the blue italic. */
const WORDS: { t: string; accent?: boolean; br?: boolean }[] = [
  { t: "Direct" },
  { t: "access", br: true },
  { t: "to" },
  { t: "global", accent: true, br: true },
  { t: "leaders.", accent: true },
]

/**
 * Kinetic-type hero (Marcelo-style).
 *
 *  • The headline IS the hero — colossal Fraunces type filling the
 *    viewport, each word rising out of a mask on load (staggered).
 *  • Cursor-reactive: a soft accent blob + a subtle parallax tilt of the
 *    whole headline follow the pointer (the "alive" feel).
 *  • Scroll-reactive: the headline drifts up and fades as you scroll,
 *    handing off to the page below.
 * Near-empty white canvas, one blue accent, generous space. No imagery
 * competing with the type — restraint is the point.
 */
export function HeroSection({ event, stats }: { event?: HeroEvent; stats?: HeroStats }) {
  const sectionRef = useRef<HTMLElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const blobRef = useRef<HTMLDivElement>(null)
  const [scrollP, setScrollP] = useState(0)
  const [daysLeft, setDaysLeft] = useState<number | null>(event ? getDaysUntil(event.start_date) : null)

  useEffect(() => {
    if (!event?.start_date) return
    setDaysLeft(getDaysUntil(event.start_date))
    const id = setInterval(() => setDaysLeft(getDaysUntil(event.start_date)), 60_000)
    return () => clearInterval(id)
  }, [event?.start_date])

  /* Scroll → fade/rise the headline as the hero leaves. */
  useEffect(() => {
    let ticking = false
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const h = window.innerHeight || 1
        setScrollP(Math.min(1, Math.max(0, window.scrollY / h)))
        ticking = false
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* Pointer → move the accent blob + tilt the headline a touch. CSS vars
   * set straight on the DOM (no React re-render) so it stays buttery. */
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    let raf = 0
    function onMove(e: MouseEvent) {
      if (raf) return
      raf = requestAnimationFrame(() => {
        const r = section!.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5 // -0.5..0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        if (blobRef.current) {
          blobRef.current.style.transform = `translate3d(${x * 80}px, ${y * 80}px, 0)`
        }
        if (headlineRef.current) {
          headlineRef.current.style.transform = `translate3d(${x * -14}px, ${y * -10}px, 0)`
        }
        raf = 0
      })
    }
    section.addEventListener("mousemove", onMove)
    return () => {
      section.removeEventListener("mousemove", onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const eventsN = Math.max(stats?.events ?? 0, 50)
  const leadersN = Math.max(stats?.speakers ?? 0, 500)

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] flex flex-col bg-white overflow-hidden"
    >
      {/* cursor-reactive accent blob */}
      <div
        ref={blobRef}
        aria-hidden
        className="absolute -z-0 top-[18%] right-[6%] w-[44vw] h-[44vw] max-w-[680px] max-h-[680px] rounded-full pointer-events-none transition-transform duration-300 ease-out will-change-transform"
        style={{
          background:
            "radial-gradient(circle, rgba(0,113,227,0.16) 0%, rgba(0,113,227,0.06) 40%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      {/* faint second wash, bottom-left */}
      <div
        aria-hidden
        className="absolute inset-0 -z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(46% 50% at 6% 92%, rgba(0,113,227,0.05) 0%, transparent 66%)",
        }}
      />

      <style jsx>{`
        @keyframes wordUp {
          from { transform: translateY(112%) rotate(3deg); }
          to   { transform: translateY(0) rotate(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineGrow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes scrollNudge {
          0%, 100% { transform: translateY(0); opacity: 0.55; }
          50%      { transform: translateY(5px); opacity: 1; }
        }
        .word-mask { display: inline-block; overflow: hidden; vertical-align: top; padding: 0 0.04em; }
        .word {
          display: inline-block;
          transform: translateY(112%);
          animation: wordUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .fade-up { opacity: 0; animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .line-grow { transform-origin: left; animation: lineGrow 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        .scroll-nudge { animation: scrollNudge 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .word { transform: none; animation: none; }
          .fade-up { opacity: 1; animation: none; }
          .scroll-nudge { animation: none; }
        }
      `}</style>

      {/* ── Masthead kicker ─────────────────────────────────────── */}
      <div className="relative z-10 max-w-[1340px] w-full mx-auto px-6 sm:px-10 lg:px-16 pt-28 lg:pt-32">
        <div
          className="fade-up flex items-center justify-between gap-4 flex-wrap pb-5"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="inline-flex items-center gap-2.5">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-[#0071e3] animate-ping opacity-70" />
              <span className="relative w-2 h-2 rounded-full bg-[#0071e3]" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1d1d1f]/70">
              {event ? `Now registering — ${event.title}` : "The Global Leadership Platform"}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#1d1d1f]/40">
            <span>Est. 2016</span>
            <span className="w-1 h-1 rounded-full bg-[#1d1d1f]/20" />
            <span>30+ Countries</span>
            <span className="w-1 h-1 rounded-full bg-[#1d1d1f]/20" />
            <span>500+ Leaders</span>
          </div>
        </div>
        <div className="line-grow h-px bg-[#1d1d1f]/10" style={{ animationDelay: "0.05s" }} />
      </div>

      {/* ── Kinetic headline — the hero ─────────────────────────── */}
      <div className="relative z-10 flex-1 flex items-center">
        <div
          className="max-w-[1340px] w-full mx-auto px-6 sm:px-10 lg:px-16 py-10"
          style={{
            opacity: 1 - scrollP * 1.1,
            transform: `translateY(${scrollP * -50}px)`,
          }}
        >
          <h1
            ref={headlineRef}
            className="lf-display text-[#1d1d1f] transition-transform duration-300 ease-out will-change-transform"
            style={{
              fontSize: "clamp(3.4rem, 12vw, 11rem)",
              lineHeight: 0.9,
              letterSpacing: "-0.045em",
            }}
          >
            {WORDS.map((w, i) => (
              <span key={i}>
                <span className="word-mask">
                  <span
                    className={"word " + (w.accent ? "italic text-[#0071e3]" : "")}
                    style={{ animationDelay: `${0.15 + i * 0.09}s` }}
                  >
                    {w.t}
                  </span>
                </span>
                {w.br ? <br /> : " "}
              </span>
            ))}
          </h1>
        </div>
      </div>

      {/* ── Baseline: standfirst + CTAs + event chip ────────────── */}
      <div className="relative z-10 max-w-[1340px] w-full mx-auto px-6 sm:px-10 lg:px-16 pb-12 lg:pb-16">
        <div className="line-grow h-px bg-[#1d1d1f]/10 mb-8" style={{ animationDelay: "0.7s" }} />
        <div className="grid lg:grid-cols-12 gap-y-8 lg:gap-x-10 items-end">
          {/* standfirst + CTAs */}
          <div className="lg:col-span-7 fade-up" style={{ animationDelay: "0.85s" }}>
            <p className="max-w-[460px] text-[15px] sm:text-[16px] leading-[1.7] text-[#1d1d1f]/60">
              We convene the CXOs, founders and policymakers shaping global
              enterprise — through conclaves, awards and private circles across
              30+ countries.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/events"
                className="group inline-flex items-center gap-2.5 px-8 py-[15px] rounded-full font-bold text-[14px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_16px_38px_-12px_rgba(0,113,227,0.7)]"
              >
                Explore Events
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href="/inner-circle"
                className="lf-glass inline-flex items-center gap-1.5 px-7 py-[14px] rounded-full text-[14px] font-bold text-[#1d1d1f] transition-all duration-200"
              >
                Join the Inner Circle
                <ArrowUpRight size={15} className="text-[#0071e3]" />
              </Link>
            </div>
          </div>

          {/* live-event chip + scroll cue */}
          <div className="lg:col-span-5 fade-up flex items-center justify-between gap-5" style={{ animationDelay: "0.95s" }}>
            {event && (
              <Link
                href={`/events/${event.slug}`}
                className="lf-glass group rounded-2xl px-5 py-4 flex items-center gap-4 flex-1 transition-transform duration-300 hover:-translate-y-1"
              >
                {daysLeft !== null && (
                  <div className="shrink-0 text-center">
                    <div className="lf-display text-[30px] text-[#0071e3] leading-none tabular-nums">
                      {daysLeft}
                    </div>
                    <div className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-[#1d1d1f]/45 mt-0.5">
                      Days
                    </div>
                  </div>
                )}
                <div className="w-px self-stretch bg-[#1d1d1f]/10" />
                <div className="min-w-0 flex-1">
                  <div className="text-[8.5px] font-bold uppercase tracking-[0.16em] text-[#0071e3] mb-1">
                    Next Event
                  </div>
                  <div className="text-[13.5px] font-bold text-[#1d1d1f] leading-tight truncate">
                    {event.title}
                  </div>
                  <div className="text-[11.5px] text-[#1d1d1f]/55 mt-0.5 truncate">
                    {fmtDateRange(event.start_date, event.end_date)}
                    {event.venue ? ` · ${event.venue}` : ""}
                  </div>
                </div>
                <ArrowUpRight size={17} className="shrink-0 text-[#1d1d1f]/35 group-hover:text-[#0071e3] transition-colors" />
              </Link>
            )}
            <div className="hidden lg:flex flex-col items-center gap-1.5 shrink-0 text-[#1d1d1f]/40">
              <span className="scroll-nudge"><ArrowDown size={18} /></span>
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] [writing-mode:vertical-rl] rotate-180">
                Scroll
              </span>
            </div>
          </div>
        </div>

        {/* micro stat line */}
        <div className="fade-up mt-9 flex flex-wrap items-center gap-x-8 gap-y-2 text-[12px] text-[#1d1d1f]/50" style={{ animationDelay: "1.05s" }}>
          <span><b className="text-[#1d1d1f] font-bold tabular-nums">{eventsN}+</b> flagship events</span>
          <span className="w-1 h-1 rounded-full bg-[#1d1d1f]/20" />
          <span><b className="text-[#1d1d1f] font-bold tabular-nums">{leadersN}+</b> leaders convened</span>
          <span className="w-1 h-1 rounded-full bg-[#1d1d1f]/20" />
          <span><b className="text-[#1d1d1f] font-bold tabular-nums">30+</b> countries</span>
        </div>
      </div>
    </section>
  )
}
