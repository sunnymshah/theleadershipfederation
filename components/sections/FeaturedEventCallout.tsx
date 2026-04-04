"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react"
import { GoldDiamonds } from "@/components/ui/GoldPattern"

const sfDisplay = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
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

export function FeaturedEventCallout({ event }: FeaturedEventCalloutProps) {
  const e = event ?? {
    title: "7th GCC Leadership Conclave",
    start_date: "2026-05-21",
    end_date: "2026-05-22",
    venue: "Mumbai, India",
    description: "700+ CXOs, innovators, and policymakers. AI integration, talent-first operations, cross-border leadership.",
  }

  return (
    <section className="relative py-20 lg:py-28 bg-black overflow-hidden">
      <GoldDiamonds />

      {/* Background event image */}
      <div className="absolute inset-0 opacity-[0.08]">
        <Image
          src="https://img.einpresswire.com/large/713803/4th-asia-leadership-awards.png"
          alt=""
          fill
          className="object-cover"
        />
      </div>

      {/* Gold glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(231,171,28,0.10) 0%, transparent 60%)" }}
        aria-hidden
      />

      {/* TOTY chevron arrows on right */}
      <svg className="absolute right-0 top-0 h-full w-1/3 pointer-events-none" viewBox="0 0 400 600" fill="none" aria-hidden>
        <path d="M100 20L380 300L100 580" stroke="rgba(231,171,28,0.12)" strokeWidth="3" strokeLinecap="round" />
        <path d="M60 60L340 300L60 540" stroke="rgba(231,171,28,0.08)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M30 100L300 300L30 500" stroke="rgba(231,171,28,0.05)" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
        <div className="animate-fade-in-up">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e7ab1c]/10 border border-[#e7ab1c]/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e7ab1c] animate-pulse" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-[#e7ab1c] font-semibold">
              Featured Event
            </span>
          </span>

          <h2
            className="mt-4 text-[clamp(1.6rem,4vw,2.8rem)] leading-[1.1] text-white font-bold tracking-[-0.02em]"
            style={sfDisplay}
          >
            {e.title}
          </h2>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-white/40 text-[14px] animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <span className="inline-flex items-center gap-2"><Calendar size={14} strokeWidth={1.5} /> May 21-22, 2026</span>
            <span className="inline-flex items-center gap-2"><MapPin size={14} strokeWidth={1.5} /> Mumbai, India</span>
            <span className="inline-flex items-center gap-2"><Users size={14} strokeWidth={1.5} /> 700+ CXOs</span>
          </div>

          <p className="mt-6 max-w-xl mx-auto text-white/30 text-[15px] leading-[1.7] animate-fade-in-up" style={{ animationDelay: "250ms" }}>
            {e.description}
          </p>

          {/* Event highlights */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: "350ms" }}>
            {["AI & Digital Transformation", "Cross-Border Leadership", "Innovation Awards"].map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full text-[11px] font-medium text-[#e7ab1c]/70 border border-[#e7ab1c]/15 bg-[#e7ab1c]/[0.05]">
                {tag}
              </span>
            ))}
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <Link
              href="/events"
              className="mt-8 inline-flex items-center gap-2 px-8 py-[14px] rounded-full font-semibold text-[14px] text-black bg-[#e7ab1c] hover:bg-[#d49c10] transition-all duration-200 hover:scale-[1.02] shadow-[0_4px_20px_rgba(231,171,28,0.3)]"
            >
              Register Now
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
