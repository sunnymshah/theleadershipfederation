"use client"

import { useRef, useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { CalendarDays, Crown, Mic2, ArrowRight } from "lucide-react"

const sfDisplay = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}
const sfText = {
  fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

const pillars = [
  {
    icon: CalendarDays,
    title: "Global Conclaves & Summits",
    description:
      "GCC Leadership Conclave, Asia Leadership Awards, and Bharat Leadership Summit — flagship events connecting decision-makers across 30+ countries.",
    href: "/events",
    stat: "50+",
    statLabel: "Events",
    image: "https://img.einpresswire.com/large/757972/3rd-edition-middle-east-asia-le.png",
  },
  {
    icon: Crown,
    title: "The Inner Circle",
    description:
      "Invite-only membership for senior leaders. Private roundtables, curated access, and strategic dialogue.",
    href: "/platforms",
    stat: "500+",
    statLabel: "Members",
    image: "https://img.einpresswire.com/large/713803/4th-asia-leadership-awards.png",
  },
  {
    icon: Mic2,
    title: "The Sunny Shah Show",
    description:
      "Podcasts and media spotlights amplifying voices shaping global business. C-suite conversations that move industries.",
    href: "/media",
    stat: "60+",
    statLabel: "Episodes",
    image: "https://img.einpresswire.com/large/733210/bharat-leadership-awards.png",
  },
]

export function EcosystemGrid() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="relative py-12 lg:py-16 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Section header */}
        <div
          className="text-center mb-10"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <span className="text-[11px] tracking-[0.25em] uppercase text-[#e7ab1c] font-semibold">
            Three Pillars
          </span>
          <h2
            className="mt-3 text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] text-[#1a1a2e] font-bold tracking-[-0.02em]"
            style={sfDisplay}
          >
            The Ecosystem
          </h2>
          <p className="mt-3 text-[#1a1a2e]/70 text-[15px]" style={sfText}>
            One mission. Global impact.
          </p>
        </div>

        {/* Bento grid — first card large, two stacked beside it */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Featured card — tall */}
          <Link
            href={pillars[0].href}
            className="group relative block rounded-3xl overflow-hidden bg-[#1a1a2e] min-h-[420px] lg:min-h-[480px]"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.98)",
              transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s",
            }}
          >
            <Image
              src={pillars[0].image}
              alt={pillars[0].title}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/55 via-transparent to-transparent" />

            {/* Stat badge */}
            <div className="absolute top-5 right-5 bg-[#e7ab1c] rounded-xl px-4 py-2.5 shadow-[0_4px_16px_rgba(231,171,28,0.35)]">
              <div className="text-[22px] font-bold text-white leading-none" style={sfDisplay}>
                {pillars[0].stat}
              </div>
              <div className="text-[9px] text-white/85 uppercase tracking-wider font-semibold mt-0.5" style={sfText}>
                {pillars[0].statLabel}
              </div>
            </div>

            {/* Content — floating dark liquid-glass panel */}
            <div className="absolute bottom-4 left-4 right-4 lf-glass-dark rounded-2xl p-5 lg:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#e7ab1c] flex items-center justify-center shadow-[0_4px_12px_rgba(231,171,28,0.35)]">
                  <CalendarDays size={20} strokeWidth={1.8} className="text-white" />
                </div>
                <h3 className="text-[20px] lg:text-[22px] font-bold text-white" style={sfDisplay}>
                  {pillars[0].title}
                </h3>
              </div>
              <p className="text-[14px] text-white/85 leading-[1.7] max-w-sm mb-5" style={sfText}>
                {pillars[0].description}
              </p>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e7ab1c] group-hover:gap-2.5 transition-all duration-200">
                Explore Events <ArrowRight size={13} />
              </span>
            </div>
          </Link>

          {/* Right column — two stacked cards */}
          <div className="flex flex-col gap-5">
            {pillars.slice(1).map((p, i) => {
              const Icon = p.icon
              return (
                <Link
                  key={p.title}
                  href={p.href}
                  className="group relative block rounded-3xl overflow-hidden bg-[#1a1a2e] flex-1 min-h-[220px]"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.98)",
                    transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${(i + 1) * 0.15 + 0.1}s`,
                  }}
                >
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/55 via-transparent to-transparent" />

                  {/* Stat badge */}
                  <div className="absolute top-4 right-4 bg-[#e7ab1c] rounded-lg px-3 py-2 shadow-[0_4px_12px_rgba(231,171,28,0.35)]">
                    <div className="text-[18px] font-bold text-white leading-none" style={sfDisplay}>
                      {p.stat}
                    </div>
                    <div className="text-[8px] text-white/85 uppercase tracking-wider font-semibold mt-0.5" style={sfText}>
                      {p.statLabel}
                    </div>
                  </div>

                  {/* Content — floating dark liquid-glass panel */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 lf-glass-dark rounded-2xl p-4">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-[#e7ab1c] flex items-center justify-center shadow-[0_4px_12px_rgba(231,171,28,0.35)]">
                        <Icon size={16} strokeWidth={1.8} className="text-white" />
                      </div>
                      <h3 className="text-[17px] font-bold text-white" style={sfDisplay}>
                        {p.title}
                      </h3>
                    </div>
                    <p className="text-[13px] text-white/85 leading-[1.6] max-w-xs mb-3" style={sfText}>
                      {p.description}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#e7ab1c] group-hover:gap-2.5 transition-all duration-200">
                      Learn more <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
