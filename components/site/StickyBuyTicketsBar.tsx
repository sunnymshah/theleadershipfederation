"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, MapPin, Ticket } from "lucide-react"

interface Props {
  eventTitle: string
  eventDate: string
  venue?: string | null
  fromPrice?: number | null
  /** Full path to the tickets page, e.g. `/events/my-event/tickets`. */
  ticketsHref: string
}

function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function fmtPrice(n: number) {
  return new Intl.NumberFormat("en-IN").format(n)
}

/**
 * Sticky bar that appears once the user scrolls past the hero on an event page.
 * Floats at the bottom on mobile and at the top on desktop, with a prominent
 * "Buy Tickets" CTA that scrolls to the tickets section.
 */
export function StickyBuyTicketsBar({
  eventTitle,
  eventDate,
  venue,
  fromPrice,
  ticketsHref,
}: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // Show after scrolling past ~70% of viewport height (past hero)
        setVisible(window.scrollY > window.innerHeight * 0.7)
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      className={`fixed left-0 right-0 bottom-0 md:bottom-auto md:top-0 z-40 transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full md:-translate-y-full opacity-0 pointer-events-none"
      }`}
      role="region"
      aria-label="Buy tickets quick bar"
    >
      <div className="bg-white/95 backdrop-blur-md border-t md:border-t-0 md:border-b border-[#1a1a2e]/[0.08] shadow-[0_-4px_24px_rgba(26, 26, 46,0.06)] md:shadow-[0_4px_24px_rgba(26, 26, 46,0.06)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-6">
          {/* Event info — hidden on smallest screens */}
          <div className="hidden sm:flex flex-col min-w-0 flex-1">
            <p className="text-sm font-bold text-[#1a1a2e] truncate">
              {eventTitle}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-[#1a1a2e]/65 mt-0.5">
              <span className="inline-flex items-center gap-1">
                <Calendar size={11} className="text-[#e7ab1c]" />
                {fmtDateShort(eventDate)}
              </span>
              {venue && (
                <span className="inline-flex items-center gap-1 truncate">
                  <MapPin size={11} className="text-[#e7ab1c]" />
                  <span className="truncate">{venue}</span>
                </span>
              )}
            </div>
          </div>

          {/* Mobile: just price */}
          {fromPrice != null && fromPrice > 0 && (
            <div className="flex sm:hidden flex-col flex-1 min-w-0">
              <span className="text-[10px] text-[#1a1a2e]/65 uppercase tracking-wider font-semibold">
                From
              </span>
              <span className="text-base font-bold text-[#1a1a2e] tabular-nums leading-tight">
                &#8377;{fmtPrice(fromPrice)}
              </span>
            </div>
          )}

          {/* Desktop: price */}
          {fromPrice != null && fromPrice > 0 && (
            <div className="hidden sm:flex flex-col items-end shrink-0">
              <span className="text-[10px] text-[#1a1a2e]/65 uppercase tracking-wider font-semibold">
                Starting from
              </span>
              <span className="text-lg font-bold text-[#1a1a2e] tabular-nums leading-tight">
                &#8377;{fmtPrice(fromPrice)}
              </span>
            </div>
          )}

          {/* CTA */}
          <Link
            href={ticketsHref}
            className="shrink-0 inline-flex items-center gap-2 px-5 sm:px-7 py-3 rounded-full bg-[#e7ab1c] hover:bg-[#d49c10] text-white text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_20px_rgba(231,171,28,0.4)]"
          >
            <Ticket size={15} />
            <span className="hidden xs:inline sm:inline">Buy Tickets</span>
            <span className="inline xs:hidden sm:hidden">Buy</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
