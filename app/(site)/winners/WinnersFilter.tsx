"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Trophy,
  MapPin,
  Calendar,
  ArrowRight,
  Building2,
  Award,
  ChevronDown,
  ExternalLink,
} from "lucide-react"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

interface AwardEdition {
  id: string
  name: string
  slug: string
  event_name: string
  year: number
  city: string | null
  country: string | null
  sort_order: number
}

interface AwardWinner {
  id: string
  edition_id: string
  name: string
  company: string | null
  designation: string | null
  award_category: string | null
  image_url: string | null
  linkedin_url: string | null
  sort_order: number
  award_editions: {
    name: string
    slug: string
    event_name: string
    year: number
    city: string | null
    country: string | null
  } | null
}

export function WinnersFilter({
  editions,
  winners,
}: {
  editions: AwardEdition[]
  winners: AwardWinner[]
}) {
  const [activeEdition, setActiveEdition] = useState<string | null>(null)
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false)

  const filteredWinners = useMemo(() => {
    if (!activeEdition) return winners
    return winners.filter((w) => w.edition_id === activeEdition)
  }, [activeEdition, winners])

  const activeEditionData = editions.find((e) => e.id === activeEdition)

  /* Group winners by award_category for display */
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, AwardWinner[]> = {}
    filteredWinners.forEach((w) => {
      const cat = w.award_category || "General"
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(w)
    })
    return groups
  }, [filteredWinners])

  return (
    <>
      {/* ── Edition filter ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-8">
        {/* Desktop: horizontal pills */}
        <div className="hidden sm:flex flex-wrap gap-2">
          <button
            onClick={() => setActiveEdition(null)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
              activeEdition === null
                ? "bg-[#e7ab1c] text-white shadow-[0_2px_12px_rgba(231,171,28,0.3)]"
                : "bg-white text-[#1a1a2e]/70 border border-[#1a1a2e]/10 hover:border-[#e7ab1c]/30 hover:text-[#e7ab1c]"
            }`}
          >
            <Trophy size={13} />
            All Editions
          </button>
          {editions.map((edition) => (
            <button
              key={edition.id}
              onClick={() => setActiveEdition(edition.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                activeEdition === edition.id
                  ? "bg-[#e7ab1c] text-white shadow-[0_2px_12px_rgba(231,171,28,0.3)]"
                  : "bg-white text-[#1a1a2e]/70 border border-[#1a1a2e]/10 hover:border-[#e7ab1c]/30 hover:text-[#e7ab1c]"
              }`}
            >
              {edition.name}
              <span className="opacity-60">({edition.year})</span>
            </button>
          ))}
        </div>

        {/* Mobile: dropdown */}
        <div className="sm:hidden relative">
          <button
            onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-[#1a1a2e]/10 text-sm font-semibold text-[#1a1a2e]"
          >
            <span className="flex items-center gap-2">
              <Trophy size={14} className="text-[#e7ab1c]" />
              {activeEditionData ? activeEditionData.name : "All Editions"}
            </span>
            <ChevronDown size={16} className={`text-[#1a1a2e]/50 transition-transform ${mobileDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {mobileDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-[#1a1a2e]/10 shadow-lg z-20 max-h-64 overflow-y-auto">
              <button
                onClick={() => { setActiveEdition(null); setMobileDropdownOpen(false) }}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                  activeEdition === null ? "text-[#e7ab1c] bg-[#e7ab1c]/5" : "text-[#1a1a2e]/70 hover:bg-[#f0f0f0]"
                }`}
              >
                All Editions
              </button>
              {editions.map((edition) => (
                <button
                  key={edition.id}
                  onClick={() => { setActiveEdition(edition.id); setMobileDropdownOpen(false) }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-t border-[#1a1a2e]/5 ${
                    activeEdition === edition.id ? "text-[#e7ab1c] bg-[#e7ab1c]/5" : "text-[#1a1a2e]/70 hover:bg-[#f0f0f0]"
                  }`}
                >
                  {edition.name} ({edition.year})
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Active edition header ── */}
      {activeEditionData && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-6">
          <AnimateOnScroll animation="fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 rounded-xl bg-white border border-[#1a1a2e]/[0.06]">
              <div>
                <h2
                  className="text-lg sm:text-xl font-bold text-[#1a1a2e]"
                  style={sfFont}
                >
                  {activeEditionData.name}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#1a1a2e]/60">
                  {activeEditionData.city && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-[#e7ab1c]" />
                      {activeEditionData.city}, {activeEditionData.country}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-[#e7ab1c]" />
                    {activeEditionData.year}
                  </span>
                </div>
              </div>
              <Link
                href="/archive"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#e7ab1c] hover:text-[#d49c10] transition-colors"
              >
                View Event Details <ExternalLink size={12} />
              </Link>
            </div>
          </AnimateOnScroll>
        </section>
      )}

      {/* ── Winners grid ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 sm:pb-16">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-bold text-[#1a1a2e]/65 uppercase tracking-[0.2em]">
            {filteredWinners.length} Winner{filteredWinners.length !== 1 ? "s" : ""}
          </h3>
        </div>

        {Object.entries(groupedByCategory).map(([category, categoryWinners]) => (
          <div key={category} className="mb-10 last:mb-0">
            {/* Category header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#e7ab1c]/10 border border-[#e7ab1c]/20 flex items-center justify-center">
                <Award size={16} className="text-[#e7ab1c]" />
              </div>
              <h4 className="text-sm font-bold text-[#1a1a2e] uppercase tracking-[0.1em]">
                {category}
              </h4>
              <div className="flex-1 h-px bg-[#1a1a2e]/[0.06]" />
            </div>

            <StaggerChildren
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
              animation="fade-up"
              stagger={60}
            >
              {categoryWinners.map((winner) => (
                <div
                  key={winner.id}
                  className="group relative rounded-2xl overflow-hidden bg-white border border-[#1a1a2e]/[0.06] hover:shadow-lg hover:border-[#e7ab1c]/30 transition-all duration-300"
                >
                  {/* Photo or avatar */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#2a2440] to-[#1a1a2e]">
                    {winner.image_url ? (
                      <Image
                        src={winner.image_url}
                        alt={winner.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <>
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: "radial-gradient(circle at 50% 40%, rgba(231,171,28,0.15) 0%, transparent 65%)",
                          }}
                          aria-hidden
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className="text-5xl font-bold text-[#e7ab1c]/50 leading-none tracking-tighter"
                            style={sfFont}
                          >
                            {winner.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Gold ribbon accent */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#e7ab1c]/40 via-[#e7ab1c] to-[#e7ab1c]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Trophy badge */}
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#e7ab1c]/20 backdrop-blur-sm border border-[#e7ab1c]/30 flex items-center justify-center">
                      <Trophy size={13} className="text-[#e7ab1c]" />
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <h5
                      className="text-[15px] font-bold text-[#1a1a2e] mb-1 leading-snug group-hover:text-[#e7ab1c] transition-colors"
                      style={sfFont}
                    >
                      {winner.linkedin_url ? (
                        <a
                          href={winner.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {winner.name}
                        </a>
                      ) : (
                        winner.name
                      )}
                    </h5>

                    {winner.designation && (
                      <p className="text-xs text-[#1a1a2e]/60 mb-1">
                        {winner.designation}
                      </p>
                    )}

                    {winner.company && (
                      <p className="flex items-center gap-1 text-xs text-[#1a1a2e]/50 mb-3">
                        <Building2 size={11} className="text-[#e7ab1c]/60" />
                        {winner.company}
                      </p>
                    )}

                    {/* Edition tag (when viewing all) */}
                    {!activeEdition && winner.award_editions && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e7ab1c]/8 text-[#e7ab1c] text-[10px] font-bold">
                        {winner.award_editions.name} ({winner.award_editions.year})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </StaggerChildren>
          </div>
        ))}
      </section>

      {/* ── CTA ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <AnimateOnScroll animation="fade-up">
          <div className="text-center">
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#1a1a2e] mb-4"
              style={sfFont}
            >
              Explore Our Legacy
            </h2>
            <p className="text-[#1a1a2e]/70 text-base leading-relaxed mb-8 max-w-xl mx-auto">
              Browse all past events and relive the moments that shaped leadership
              discourse across Asia and the Middle East.
            </p>
            <Link
              href="/archive"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#e7ab1c] text-white text-sm font-semibold transition-all duration-200 hover:bg-[#d49c10] shadow-[0_4px_20px_rgba(231,171,28,0.3)]"
            >
              Event Archive
              <ArrowRight size={16} />
            </Link>
          </div>
        </AnimateOnScroll>
      </section>
    </>
  )
}
