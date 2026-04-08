"use client"

import { useRef, useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react"
import { MagneticButton } from "@/components/ui/MagneticButton"

const sfDisplay = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}
const sfText = {
  fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

interface FeaturedEventCalloutProps {
  event?: {
    title: string
    start_date: string
    end_date: string
    venue: string
    description: string
  }
}

const highlights = [
  "AI & Digital Transformation",
  "Cross-Border Leadership",
  "Innovation Awards",
  "Talent-First Operations",
]

export function FeaturedEventCallout({ event }: FeaturedEventCalloutProps) {
  const e = event ?? {
    title: "7th GCC Leadership Conclave",
    start_date: "2026-05-21",
    end_date: "2026-05-22",
    venue: "Mumbai, India",
    description:
      "700+ CXOs, innovators, and policymakers converge for two days of strategic dialogue, partnership building, and cross-border leadership.",
  }

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
    <section ref={ref} className="relative overflow-hidden">
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        <Image
          src="https://img.einpresswire.com/large/713803/4th-asia-leadership-awards.png"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
      </div>

      {/* Top edge */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#F4F8FF] to-transparent z-10 pointer-events-none" />
      {/* Bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-32 lg:py-44">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — event info */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(30px)",
              transition: "all 0.9s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e7ab1c]/10 border border-[#e7ab1c]/20 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e7ab1c] animate-pulse" />
              <span
                className="text-[11px] tracking-[0.15em] uppercase text-[#e7ab1c] font-semibold"
                style={sfText}
              >
                Featured Event
              </span>
            </div>

            <h2
              className="text-[clamp(1.8rem,4.5vw,3.2rem)] leading-[1.05] text-white font-bold tracking-[-0.02em]"
              style={sfDisplay}
            >
              {e.title}
            </h2>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-white/40 text-[14px]" style={sfText}>
              <span className="inline-flex items-center gap-2">
                <Calendar size={14} strokeWidth={1.5} className="text-[#e7ab1c]/60" />
                May 21-22, 2026
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin size={14} strokeWidth={1.5} className="text-[#e7ab1c]/60" />
                Mumbai, India
              </span>
              <span className="inline-flex items-center gap-2">
                <Users size={14} strokeWidth={1.5} className="text-[#e7ab1c]/60" />
                700+ CXOs
              </span>
            </div>

            <p className="mt-6 text-white/30 text-[15px] leading-[1.7] max-w-md" style={sfText}>
              {e.description}
            </p>

            <div className="mt-8">
              <MagneticButton>
                <Link
                  href="/events"
                  className="group inline-flex items-center gap-2 px-8 py-[14px] rounded-full font-semibold text-[14px] text-black bg-[#e7ab1c] hover:bg-[#d49c10] transition-all duration-200 hover:scale-[1.02] shadow-[0_4px_24px_rgba(231,171,28,0.3)]"
                >
                  Register Now
                  <ArrowRight
                    size={15}
                    className="group-hover:translate-x-1 transition-transform duration-200"
                  />
                </Link>
              </MagneticButton>
            </div>
          </div>

          {/* Right — highlight tags + edition badge */}
          <div
            className="flex flex-col items-start lg:items-end gap-6"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(30px)",
              transition: "all 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s",
            }}
          >
            {/* Edition badge */}
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-2xl px-8 py-6 border border-white/[0.08]">
              <div className="text-center">
                <div className="text-[48px] font-bold text-[#e7ab1c] leading-none" style={sfDisplay}>
                  7th
                </div>
                <div className="text-[11px] text-white/30 uppercase tracking-[0.15em] font-semibold mt-1" style={sfText}>
                  Edition
                </div>
              </div>
            </div>

            {/* Highlight tags */}
            <div className="flex flex-wrap gap-2.5 lg:justify-end">
              {highlights.map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 rounded-full text-[12px] font-medium text-white/50 border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm"
                  style={sfText}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Stat cards */}
            <div className="flex gap-3">
              {[
                { num: "30+", label: "Countries" },
                { num: "2000+", label: "Leaders" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/[0.04] backdrop-blur-xl rounded-xl px-5 py-3.5 border border-white/[0.06]"
                >
                  <div className="text-[20px] font-bold text-white/80 leading-none" style={sfDisplay}>
                    {s.num}
                  </div>
                  <div className="text-[9px] text-white/25 uppercase tracking-wider font-semibold mt-1" style={sfText}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
