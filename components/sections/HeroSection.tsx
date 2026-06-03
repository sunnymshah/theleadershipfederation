"use client"

import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { AnimatedCounter } from "@/components/ui/AnimatedCounter"

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

/**
 * Editorial hero — magazine-masthead composition.
 *
 * Deliberately NOT the centred text-left / image-card-right template:
 *   • a thin masthead kicker rule across the top,
 *   • a colossal Fraunces serif headline that owns the left two-thirds,
 *   • a tall photograph that bleeds off the right edge,
 *   • an oversized editorial stat baseline with serif numerals.
 * Restrained: white surface, one blue accent, generous negative space.
 */
export function HeroSection({ event, stats }: { event?: HeroEvent; stats?: HeroStats }) {
  const sectionRef = useRef<HTMLElement>(null)
  const [imageOffset, setImageOffset] = useState(0)
  const [daysLeft, setDaysLeft] = useState<number | null>(event ? getDaysUntil(event.start_date) : null)

  useEffect(() => {
    if (!event?.start_date) return
    setDaysLeft(getDaysUntil(event.start_date))
    const id = setInterval(() => setDaysLeft(getDaysUntil(event.start_date)), 60_000)
    return () => clearInterval(id)
  }, [event?.start_date])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    let ticking = false
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const rect = section!.getBoundingClientRect()
        const h = section!.offsetHeight
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          setImageOffset(Math.min(1, Math.max(0, -rect.top / h)))
        }
        ticking = false
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const imageY = imageOffset * 50

  const statItems = [
    { value: Math.max(stats?.events ?? 0, 50), suffix: "+", label: "Flagship Events" },
    { value: Math.max(stats?.speakers ?? 0, 500), suffix: "+", label: "Leaders Convened" },
    { value: 30, suffix: "+", label: "Countries" },
    { value: 2016, suffix: "", label: "Established", plain: true },
  ]

  const avatars = [
    "/people/mohammed-al-mashroom.png",
    "/people/ajai-lal.png",
    "/people/robin-arthur-joffe.png",
    "/people/srinivas-sampath.png",
  ]

  return (
    <section ref={sectionRef} className="relative bg-white overflow-hidden">
      {/* faint editorial wash, top-right */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(50% 48% at 88% 6%, rgba(0,113,227,0.08) 0%, transparent 66%)",
        }}
      />

      <style jsx>{`
        @keyframes hRise {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hImg {
          from { opacity: 0; transform: scale(1.05); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes hLine {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        .h-rise { opacity: 0; animation: hRise 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .h-img  { opacity: 0; animation: hImg 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .h-line {
          transform-origin: left;
          animation: hLine 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both;
        }
      `}</style>

      <div className="relative z-10 max-w-[1340px] mx-auto px-6 sm:px-10 lg:px-16 pt-28 lg:pt-32">
        {/* ── Masthead kicker rule ───────────────────────────────── */}
        <div className="h-rise flex items-center justify-between gap-4 flex-wrap pb-6">
          <div className="inline-flex items-center gap-2.5">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-[#0071e3] animate-ping opacity-70" />
              <span className="relative w-2 h-2 rounded-full bg-[#0071e3]" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1d1d1f]/70">
              {event
                ? `Now registering — ${event.title}`
                : "The Global Leadership Platform"}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#1d1d1f]/40">
            <span>Est. 2016</span>
            <span className="w-1 h-1 rounded-full bg-[#1d1d1f]/20" />
            <span>30+ Countries</span>
            <span className="w-1 h-1 rounded-full bg-[#1d1d1f]/20" />
            <span>500+ Leaders</span>
          </div>
        </div>
        <div className="h-line h-px bg-[#1d1d1f]/10" />

        {/* ── Headline + image, asymmetric ───────────────────────── */}
        <div className="grid lg:grid-cols-12 gap-y-10 lg:gap-x-8 pt-10 lg:pt-12 items-stretch">
          {/* Left — colossal serif headline */}
          <div className="lg:col-span-7 flex flex-col justify-center lg:pr-4 lg:pb-12">
            <h1
              className="h-rise text-[#1d1d1f]"
              style={{
                fontSize: "clamp(3.1rem, 7.6vw, 7rem)",
                lineHeight: 0.94,
                letterSpacing: "-0.035em",
                animationDelay: "0.08s",
              }}
            >
              Direct access
              <br />
              to{" "}
              <span className="italic text-[#0071e3]">global</span>
              <br className="hidden sm:block" />
              <span className="italic text-[#0071e3]">leaders</span>
              <span className="text-[#0071e3]">.</span>
            </h1>

            <p
              className="h-rise mt-8 max-w-[440px] text-[15px] sm:text-[16px] leading-[1.75] text-[#1d1d1f]/60"
              style={{ animationDelay: "0.16s" }}
            >
              We convene the CXOs, founders and policymakers shaping global
              enterprise — through conclaves, awards and private circles across
              30+ countries.
            </p>

            <div
              className="h-rise mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "0.24s" }}
            >
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

            {/* social proof — clean single line */}
            <div
              className="h-rise mt-9 flex items-center gap-3.5"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex -space-x-2.5">
                {avatars.map((src, i) => (
                  <span
                    key={src}
                    className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-white bg-[#0071e3]/10"
                    style={{ zIndex: 10 - i }}
                  >
                    <Image src={src} alt="" fill sizes="36px" className="object-cover" />
                  </span>
                ))}
                <span className="relative w-9 h-9 rounded-full ring-2 ring-white bg-[#0071e3] flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white tabular-nums">+500</span>
                </span>
              </div>
              <p className="text-[12.5px] text-[#1d1d1f]/55 leading-tight max-w-[180px]">
                The leaders who move enterprise are already in the room.
              </p>
            </div>
          </div>

          {/* Right — tall photograph, bleeds off the right edge */}
          <div className="lg:col-span-5 relative">
            <div className="h-img relative h-[380px] sm:h-[460px] lg:h-[600px] lg:-mr-16 xl:-mr-24 rounded-[26px] lg:rounded-l-[26px] lg:rounded-r-none overflow-hidden bg-[#0a0a14] shadow-[0_40px_90px_-40px_rgba(10,10,20,0.45)]">
              <div
                className="absolute inset-0 will-change-transform"
                style={{ transform: `translateY(${imageY}px) scale(1.06)` }}
              >
                <Image
                  src="/hero-speaker.jpg"
                  alt="A leader on stage at a Leadership Federation conclave"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14]/70 via-transparent to-transparent" />

              {/* Next-event glass ribbon — the one overlay element */}
              {event && (
                <Link
                  href={`/events/${event.slug}`}
                  className="lf-glass-panel group absolute bottom-4 left-4 right-4 rounded-2xl px-5 py-4 flex items-center gap-4 transition-transform duration-300 hover:-translate-y-1"
                >
                  {daysLeft !== null && (
                    <div className="shrink-0 text-center">
                      <div className="text-[26px] font-bold text-white leading-none tabular-nums">
                        {daysLeft}
                      </div>
                      <div className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/55 mt-0.5">
                        Days
                      </div>
                    </div>
                  )}
                  <div className="w-px self-stretch bg-white/15" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[8.5px] font-bold uppercase tracking-[0.16em] text-[#4c9df2] mb-1">
                      Next Event
                    </div>
                    <div className="text-[13.5px] font-bold text-white leading-tight truncate">
                      {event.title}
                    </div>
                    <div className="text-[11.5px] text-white/60 mt-0.5 truncate">
                      {fmtDateRange(event.start_date, event.end_date)}
                      {event.venue ? ` · ${event.venue}` : ""}
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="shrink-0 text-white/70 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Editorial stat baseline ────────────────────────────── */}
        <div className="h-line mt-12 lg:mt-4 h-px bg-[#1d1d1f]/10" />
        <div className="grid grid-cols-2 lg:grid-cols-4 pt-8 pb-16 lg:pb-20">
          {statItems.map((s, i) => (
            <div
              key={s.label}
              className={
                "h-rise px-1 lg:px-6 py-2 " +
                (i > 0 ? "lg:border-l border-[#1d1d1f]/10 " : "") +
                (i < 2 ? "mb-6 lg:mb-0 " : "")
              }
              style={{ animationDelay: `${0.32 + i * 0.06}s` }}
            >
              <div
                className="lf-display text-[#1d1d1f] leading-none"
                style={{ fontSize: "clamp(2.6rem, 4vw, 3.6rem)", letterSpacing: "-0.03em" }}
              >
                {s.plain ? (
                  <span className="tabular-nums">{s.value}</span>
                ) : (
                  <AnimatedCounter value={s.value} suffix={s.suffix} duration={1800 + i * 250} />
                )}
              </div>
              <div className="mt-2.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#1d1d1f]/45">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
