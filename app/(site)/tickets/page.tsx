import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import {
  Calendar,
  MapPin,
  Ticket,
  ArrowRight,
  Clock,
  Flame,
  CheckCircle2,
  Sparkles,
  Shield,
  Star,
} from "lucide-react"
import { AnimateOnScroll, StaggerChildren } from "@/components/ui/AnimateOnScroll"

export const revalidate = 30

export const metadata = {
  title: "Tickets | The Leadership Federation",
  description:
    "Browse and register for upcoming leadership events. Limited seats available.",
}

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function getDaysUntil(d: string) {
  const diff = new Date(d).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function fmtPrice(amount: number) {
  if (amount === 0) return "Free"
  return `₹${amount.toLocaleString("en-IN")}`
}

interface TicketData {
  id: string
  name: string
  description: string | null
  price_inr: number
  inventory_limit: number | null
  sold: number
  status: string
}

export default async function TicketsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, slug, start_date, end_date, venue, cover_image_url, tickets(id, name, description, price_inr, inventory_limit, sold, status)"
    )
    .eq("status", "published")
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })

  const eventsWithTickets = (events ?? [])
    .map((e) => ({
      ...e,
      tickets: ((e.tickets as TicketData[]) ?? [])
        .filter((t) => t.status === "published")
        .sort((a, b) => a.price_inr - b.price_inr),
    }))
    .filter((e) => e.tickets.length > 0)

  return (
    <main className="min-h-screen bg-[#F4F8FF]" style={sfFont}>
      {/* ── Hero ── */}
      <section className="relative pt-20 sm:pt-24 pb-10 sm:pb-12 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #1a1a2e 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        <div className="relative max-w-5xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up" delay={0}>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-4 px-4 py-1.5 rounded-full border border-[#e7ab1c]/20 bg-[#e7ab1c]/[0.06]">
              <Ticket size={12} />
              Limited Availability
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={80}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a1a2e] tracking-tight mb-4 leading-[1.1]">
              Choose Your{" "}
              <span className="bg-gradient-to-r from-[#e7ab1c] to-[#d49c10] bg-clip-text text-transparent">
                Experience
              </span>
            </h1>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={160}>
            <p className="text-base sm:text-lg text-[#1a1a2e]/60 max-w-2xl mx-auto leading-relaxed mb-6">
              Select your tier and secure your place at the leadership events
              shaping the future of business.
            </p>
          </AnimateOnScroll>

          {/* Trust indicators */}
          <AnimateOnScroll animation="fade-up" delay={240}>
            <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs text-[#1a1a2e]/50">
              <span className="inline-flex items-center gap-1.5">
                <Shield size={13} className="text-emerald-500" />
                Secure Payment
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Instant Confirmation
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Ticket size={13} className="text-[#e7ab1c]" />
                QR Check-In
              </span>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Ticket sections per event ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        {eventsWithTickets.length > 0 ? (
          eventsWithTickets.map((event, eventIdx) => {
            const daysLeft = getDaysUntil(event.start_date)
            const tickets = event.tickets as TicketData[]

            // Find the most expensive tier to highlight as "recommended"
            const maxPriceTicket = tickets.reduce((max, t) =>
              t.price_inr > max.price_inr ? t : max, tickets[0])

            return (
              <AnimateOnScroll key={event.id} animation="fade-up" delay={eventIdx * 80}>
                <div className="mb-14 last:mb-0">
                  {/* ── Event context header ── */}
                  <div className="relative rounded-2xl bg-[#1a1a2e] p-5 sm:p-6 mb-6 overflow-hidden">
                    {/* Subtle pattern */}
                    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "24px 24px" }} />

                    <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
                          {event.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={13} className="text-[#e7ab1c]" />
                            {fmtDateShort(event.start_date)}
                            {event.end_date && event.start_date !== event.end_date && ` – ${fmtDateShort(event.end_date)}`}
                          </span>
                          {event.venue && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={13} className="text-[#e7ab1c]" />
                              {event.venue}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {daysLeft <= 14 && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-bold">
                            <Flame size={12} />
                            {daysLeft === 0 ? "Today!" : `${daysLeft}d left`}
                          </span>
                        )}
                        {daysLeft > 14 && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs font-medium">
                            <Clock size={12} />
                            {daysLeft} days away
                          </span>
                        )}
                        <Link
                          href={`/events/${event.slug}`}
                          className="text-sm font-semibold text-[#e7ab1c] hover:text-[#d4b85c] transition-colors whitespace-nowrap"
                        >
                          Event Details →
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* ── Pricing tier cards ── */}
                  <div className={`grid gap-5 ${
                    tickets.length === 1
                      ? "max-w-md mx-auto"
                      : tickets.length === 2
                      ? "md:grid-cols-2 max-w-3xl mx-auto"
                      : "md:grid-cols-2 lg:grid-cols-3"
                  }`}>
                    {tickets.map((ticket, tIdx) => {
                      const soldOut = ticket.inventory_limit !== null && ticket.sold >= ticket.inventory_limit
                      const spotsLeft = ticket.inventory_limit !== null ? ticket.inventory_limit - ticket.sold : null
                      const percentSold = ticket.inventory_limit
                        ? Math.min(100, Math.round((ticket.sold / ticket.inventory_limit) * 100))
                        : 0
                      const isPopular = tickets.length > 1 && ticket.id === maxPriceTicket.id && !soldOut
                      const isFillingFast = spotsLeft !== null && spotsLeft > 0 && percentSold >= 70

                      return (
                        <StaggerChildren key={ticket.id} animation="fade-up" stagger={100}>
                          <div
                            className={`relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
                              isPopular
                                ? "bg-white border-2 border-[#e7ab1c] shadow-[0_8px_40px_rgba(231,171,28,0.12)] scale-[1.02] md:scale-105"
                                : "bg-white border border-[#1a1a2e]/[0.08] hover:shadow-[0_8px_30px_rgba(26,26,46,0.06)] hover:border-[#e7ab1c]/20"
                            } ${soldOut ? "opacity-75" : ""}`}
                          >
                            {/* Popular badge */}
                            {isPopular && (
                              <div className="bg-[#e7ab1c] py-1.5 text-center">
                                <span className="text-[11px] font-bold text-[#1a1a2e] uppercase tracking-wider flex items-center justify-center gap-1.5">
                                  <Star size={11} fill="currentColor" /> Most Popular
                                </span>
                              </div>
                            )}

                            <div className="flex-1 p-5 sm:p-6">
                              {/* Ticket name */}
                              <h3 className="text-lg font-bold text-[#1a1a2e] mb-1">
                                {ticket.name}
                              </h3>

                              {ticket.description && (
                                <p className="text-sm text-[#1a1a2e]/55 line-clamp-2 mb-4 leading-relaxed">
                                  {ticket.description}
                                </p>
                              )}
                              {!ticket.description && <div className="mb-4" />}

                              {/* Price */}
                              <div className="mb-5">
                                {ticket.price_inr === 0 ? (
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600">Free</span>
                                  </div>
                                ) : (
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-medium text-[#1a1a2e]/40">₹</span>
                                    <span className="text-3xl sm:text-4xl font-extrabold text-[#1a1a2e] tabular-nums">
                                      {ticket.price_inr.toLocaleString("en-IN")}
                                    </span>
                                    <span className="text-sm text-[#1a1a2e]/40 ml-1">per person</span>
                                  </div>
                                )}
                              </div>

                              {/* Availability bar */}
                              {ticket.inventory_limit !== null && (
                                <div className="mb-5">
                                  <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="text-[#1a1a2e]/50">Availability</span>
                                    {soldOut ? (
                                      <span className="font-bold text-red-500">Sold Out</span>
                                    ) : isFillingFast ? (
                                      <span className="font-bold text-orange-500 flex items-center gap-1">
                                        <Flame size={11} /> Filling Fast
                                      </span>
                                    ) : (
                                      <span className="font-medium text-[#1a1a2e]/60">
                                        {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                                      </span>
                                    )}
                                  </div>
                                  <div className="h-2 rounded-full bg-[#1a1a2e]/[0.06] overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-700 ${
                                        soldOut
                                          ? "bg-red-400"
                                          : percentSold >= 70
                                          ? "bg-orange-400"
                                          : percentSold >= 40
                                          ? "bg-[#e7ab1c]"
                                          : "bg-emerald-400"
                                      }`}
                                      style={{ width: `${percentSold}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Feature bullets (from description lines) */}
                              {ticket.description && ticket.description.includes("\n") && (
                                <div className="space-y-2 mb-5">
                                  {ticket.description.split("\n").filter(Boolean).slice(0, 4).map((line, li) => (
                                    <div key={li} className="flex items-start gap-2 text-sm text-[#1a1a2e]/70">
                                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                      <span>{line.replace(/^[-•*]\s*/, "")}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* CTA */}
                            <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                              <Link
                                href={soldOut ? "#" : `/events/${event.slug}/tickets`}
                                className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                                  soldOut
                                    ? "bg-[#1a1a2e]/[0.06] text-[#1a1a2e]/35 cursor-not-allowed"
                                    : isPopular
                                    ? "bg-[#e7ab1c] text-[#1a1a2e] hover:bg-[#d49c10] shadow-[0_4px_16px_rgba(231,171,28,0.3)]"
                                    : "bg-[#1a1a2e] text-white hover:bg-[#2a2a4e]"
                                }`}
                              >
                                {soldOut ? (
                                  "Sold Out"
                                ) : (
                                  <>Register Now <ArrowRight size={14} /></>
                                )}
                              </Link>
                            </div>
                          </div>
                        </StaggerChildren>
                      )
                    })}
                  </div>
                </div>
              </AnimateOnScroll>
            )
          })
        ) : (
          /* ── Empty state ── */
          <AnimateOnScroll animation="fade-up">
            <div className="max-w-lg mx-auto text-center py-16 rounded-2xl bg-white shadow-sm border border-[#1a1a2e]/[0.06]">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-2xl bg-[#e7ab1c]/10 rotate-6" />
                <div className="relative w-full h-full rounded-2xl bg-white border border-[#e7ab1c]/20 flex items-center justify-center shadow-sm">
                  <Ticket size={32} className="text-[#e7ab1c]" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1a1a2e] mb-2">
                Tickets Coming Soon
              </h2>
              <p className="text-sm text-[#1a1a2e]/55 max-w-sm mx-auto mb-6 leading-relaxed">
                We are finalizing event details. Stay tuned for ticket
                availability and early-bird pricing.
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#e7ab1c] hover:bg-[#d49c10] text-[#1a1a2e] text-sm font-bold transition-colors shadow-[0_2px_12px_rgba(231,171,28,0.25)]"
              >
                Browse Events <ArrowRight size={14} />
              </Link>
            </div>
          </AnimateOnScroll>
        )}
      </section>
    </main>
  )
}
