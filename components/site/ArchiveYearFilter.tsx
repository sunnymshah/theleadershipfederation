"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, MapPin, ArrowRight } from "lucide-react"

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

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
 * Client wrapper — renders a year-filter bar above the archive grid and
 * shows matching cards. Server fetches the data and passes cards+years
 * in; client does the filtering without extra round-trips.
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

  return (
    <div>
      {/* Year filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelected("all")}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
            selected === "all"
              ? "bg-[#1a1a2e] text-white"
              : "bg-white text-[#1a1a2e] border border-[#1a1a2e]/10 hover:bg-[#1a1a2e]/5"
          }`}
        >
          All Years · {cards.length}
        </button>
        {years.map((yr) => {
          const count = cards.filter((c) => c.year === yr).length
          return (
            <button
              key={yr}
              onClick={() => setSelected(yr)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                selected === yr
                  ? "bg-[#1a1a2e] text-white"
                  : "bg-white text-[#1a1a2e] border border-[#1a1a2e]/10 hover:bg-[#1a1a2e]/5"
              }`}
            >
              {yr} · {count}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {visible.map((event) => {
          const card = (
            <div className="relative flex flex-col rounded-2xl overflow-hidden bg-white border border-[#1a1a2e]/[0.06] hover:shadow-[0_12px_40px_rgba(26,26,46,0.08)] transition-all duration-300 h-full">
              <div className="relative h-44 sm:h-48 overflow-hidden">
                {event.coverImage ? (
                  <Image
                    src={event.coverImage}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                    }}
                  >
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-2">
                      {event.series}
                    </span>
                    <span className="text-3xl font-bold text-white/10" style={sfFont}>
                      {event.city.split(",")[0] || event.year}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/30 via-transparent to-transparent" />
                {event.edition && (
                  <div className="absolute top-3 left-3 bg-[#e7ab1c] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {event.edition} Edition
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-[#1a1a2e]/85 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {event.year}
                </div>
                {event.venue && (
                  <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-[#1a1a2e]/60 to-transparent">
                    <span className="flex items-center gap-1.5 text-xs text-white/80 font-medium">
                      <MapPin size={12} className="text-[#e7ab1c]" />
                      {event.venue}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-1 p-5 sm:p-6">
                <h3
                  className="text-base sm:text-lg font-bold text-[#1a1a2e] mb-2 group-hover:text-[#e7ab1c] transition-colors leading-snug"
                  style={sfFont}
                >
                  {event.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#1a1a2e]/65 mb-3">
                  <Calendar size={13} className="shrink-0 text-[#e7ab1c]" />
                  {event.date}
                </div>
                {event.description && (
                  <p className="text-xs sm:text-sm text-[#1a1a2e]/70 line-clamp-2 mb-4 leading-relaxed">
                    {event.description}
                  </p>
                )}
                <div className="mt-auto pt-2">
                  <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#e7ab1c] group-hover:text-[#d49c10] transition-colors">
                    View Event
                    <ArrowRight
                      size={13}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </span>
                </div>
              </div>
            </div>
          )

          if (event.externalUrl) {
            return (
              <a
                key={event.id}
                href={event.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                {card}
              </a>
            )
          }
          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="block group"
            >
              {card}
            </Link>
          )
        })}
        {visible.length === 0 && (
          <div className="col-span-full text-center py-10 text-sm text-[#1a1a2e]/50">
            No events for {selected === "all" ? "any year" : selected} yet.
          </div>
        )}
      </div>
    </div>
  )
}
