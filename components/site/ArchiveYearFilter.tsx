"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, MapPin, ArrowRight, ExternalLink } from "lucide-react"

export type ArchiveCardData = {
  id: string
  title: string
  date: string
  sortDate: string
  year: number
  venue: string
  city: string
  series: string
  edition: string
  description: string
  coverImage?: string
  externalUrl?: string
  slug?: string
}

/**
 * Client wrapper — a year-filter bar above the archive grid. Every card
 * links to that event's own page: legacy editions open their page on
 * theleadershipfederation.com, native events open /events/[slug].
 */
export function ArchiveFilteredGrid({ cards }: { cards: ArchiveCardData[] }) {
  const years = useMemo(
    () =>
      [...new Set(cards.map((c) => c.year))]
        .filter((y) => Number.isFinite(y))
        .sort((a, b) => b - a),
    [cards],
  )
  const [selected, setSelected] = useState<number | "all">("all")

  const visible = useMemo(
    () => (selected === "all" ? cards : cards.filter((c) => c.year === selected)),
    [cards, selected],
  )

  function pill(active: boolean) {
    return (
      "px-4 py-2 rounded-full text-[12px] font-bold transition-all duration-200 " +
      (active
        ? "bg-[#0071e3] text-white shadow-[0_8px_20px_-8px_rgba(0,113,227,0.7)]"
        : "bg-white text-[#1d1d1f] border border-black/[0.08] hover:border-black/20")
    )
  }

  return (
    <div>
      {/* Year filter */}
      <div className="flex flex-wrap gap-2 mb-8 sm:mb-10">
        <button onClick={() => setSelected("all")} className={pill(selected === "all")}>
          All Years · {cards.length}
        </button>
        {years.map((yr) => (
          <button
            key={yr}
            onClick={() => setSelected(yr)}
            className={pill(selected === yr)}
          >
            {yr} · {cards.filter((c) => c.year === yr).length}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((event) => {
          const isExternal = !!event.externalUrl
          const card = (
            <div className="lf-glass relative flex flex-col rounded-[22px] overflow-hidden h-full transition-all duration-300 group-hover:-translate-y-1.5">
              {/* Cover */}
              <div className="relative aspect-[16/10] overflow-hidden bg-[#0a0a14]">
                {event.coverImage ? (
                  <Image
                    src={event.coverImage}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1d1d1f] via-[#23232a] to-[#0a0a14]">
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] mb-2 px-4 text-center">
                      {event.series}
                    </span>
                    <span className="text-[36px] font-bold text-[#4c9df2]/30 tracking-tight">
                      {event.city.split(",")[0] || event.year}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14]/65 via-transparent to-transparent" />

                {event.edition && (
                  <span className="absolute top-3 left-3 bg-[#0071e3] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                    {event.edition} Edition
                  </span>
                )}
                <span className="absolute top-3 right-3 lf-glass-dark text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider tabular-nums">
                  {event.year}
                </span>
                {event.venue && (
                  <span className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 text-[12px] text-white font-semibold">
                    <MapPin size={12} className="text-[#4c9df2] shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-5 sm:p-6">
                <h3 className="text-[16px] sm:text-[17px] font-bold text-[#1d1d1f] mb-2 leading-snug tracking-[-0.015em] line-clamp-2">
                  {event.title}
                </h3>
                <div className="flex items-center gap-1.5 text-[12.5px] text-[#1d1d1f]/60 mb-3">
                  <Calendar size={13} className="shrink-0 text-[#0071e3]" />
                  {event.date}
                </div>
                {event.description && (
                  <p className="text-[13px] text-[#1d1d1f]/60 line-clamp-2 mb-4 leading-relaxed">
                    {event.description}
                  </p>
                )}
                <div className="mt-auto pt-3 border-t border-black/[0.06]">
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#0071e3] group-hover:gap-2.5 transition-all duration-200">
                    {isExternal ? "Visit event page" : "View event"}
                    {isExternal ? <ExternalLink size={13} /> : <ArrowRight size={14} />}
                  </span>
                </div>
              </div>
            </div>
          )

          if (isExternal) {
            return (
              <a
                key={event.id}
                href={event.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                {card}
              </a>
            )
          }
          return (
            <Link key={event.id} href={`/events/${event.slug}`} className="group block">
              {card}
            </Link>
          )
        })}
        {visible.length === 0 && (
          <div className="col-span-full text-center py-12 text-[14px] text-[#1d1d1f]/50">
            No events for {selected === "all" ? "any year" : selected} yet.
          </div>
        )}
      </div>
    </div>
  )
}
