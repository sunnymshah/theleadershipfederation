import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { Calendar, MapPin, Ticket } from "lucide-react"
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

export default async function TicketsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, slug, start_date, end_date, venue, tickets(id, name, description, price_inr, inventory_limit, sold, status)"
    )
    .eq("status", "published")
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })

  // Filter tickets to only published ones
  const eventsWithTickets = (events ?? [])
    .map((e) => ({
      ...e,
      tickets: (e.tickets as any[]).filter(
        (t: { status: string }) => t.status === "published"
      ),
    }))
    .filter((e) => e.tickets.length > 0)

  return (
    <main className="min-h-screen bg-[#F4F8FF]" style={sfFont}>
      {/* ── Hero ── */}
      <section className="pt-20 sm:pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <AnimateOnScroll animation="fade-up" delay={0}>
            <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-4 px-4 py-1.5 rounded-full border border-[#e7ab1c]/20 bg-[#e7ab1c]/[0.06]">
              Secure Your Spot
            </span>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={80}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1a1a2e] tracking-tight mb-4">
              Tickets &amp;{" "}
              <span className="bg-gradient-to-r from-[#e7ab1c] to-[#d49c10] bg-clip-text text-transparent">
                Registration
              </span>
            </h1>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={160}>
            <p className="text-base sm:text-lg text-[#1a1a2e]/65 max-w-2xl mx-auto">
              Browse available tickets across our upcoming events. Limited seats
              — register early.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Tickets grouped by event ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        {eventsWithTickets.length > 0 ? (
          eventsWithTickets.map((event) => (
            <AnimateOnScroll key={event.id} animation="fade-up">
              {/* Event header card */}
              <div className="bg-white rounded-2xl p-6 border border-[#1a1a2e]/[0.06] mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[#1a1a2e] mb-3">
                  {event.title}
                </h2>
                <div className="flex flex-wrap items-center gap-5 text-sm text-[#1a1a2e]/75 mb-3">
                  <span className="inline-flex items-center gap-2">
                    <Calendar size={15} className="text-[#e7ab1c]" />
                    {fmtDate(event.start_date)}
                    {event.end_date &&
                      event.start_date !== event.end_date && (
                        <> &mdash; {fmtDate(event.end_date)}</>
                      )}
                  </span>
                  {event.venue && (
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={15} className="text-[#e7ab1c]" />
                      {event.venue}
                    </span>
                  )}
                </div>
                <Link
                  href={`/events/${event.slug}`}
                  className="text-sm font-semibold text-[#e7ab1c] hover:text-[#d49c10] transition-colors"
                >
                  View Event &rarr;
                </Link>
              </div>

              {/* Ticket cards grid */}
              <StaggerChildren
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12"
                animation="fade-up"
                stagger={80}
              >
                {(event.tickets as any[]).map(
                  (ticket: {
                    id: string
                    name: string
                    description: string | null
                    price_inr: number
                    inventory_limit: number | null
                    sold: number
                  }) => {
                    const soldOut =
                      ticket.inventory_limit !== null &&
                      ticket.sold >= ticket.inventory_limit
                    const spotsLeft =
                      ticket.inventory_limit !== null
                        ? ticket.inventory_limit - ticket.sold
                        : null

                    return (
                      <Link
                        key={ticket.id}
                        href={`/events/${event.slug}/tickets`}
                        className="block bg-white rounded-2xl overflow-hidden border border-[#1a1a2e]/[0.06] hover:shadow-md hover:border-[#e7ab1c]/20 transition-all p-5"
                      >
                        <h3 className="font-bold text-lg text-[#1a1a2e] mb-1">
                          {ticket.name}
                        </h3>

                        {ticket.description && (
                          <p className="text-sm text-[#1a1a2e]/65 line-clamp-2 mb-3">
                            {ticket.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-3 mb-4">
                          {ticket.price_inr === 0 ? (
                            <span className="text-sm font-bold text-green-600">
                              Free
                            </span>
                          ) : (
                            <span className="text-lg font-bold text-[#1a1a2e]">
                              ₹{ticket.price_inr.toLocaleString("en-IN")}
                            </span>
                          )}

                          {soldOut ? (
                            <span className="text-xs font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
                              Sold Out
                            </span>
                          ) : spotsLeft !== null ? (
                            <span className="text-xs font-medium text-[#1a1a2e]/55">
                              {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                            </span>
                          ) : null}
                        </div>

                        <span
                          className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-bold transition-colors ${
                            soldOut
                              ? "bg-[#1a1a2e]/[0.06] text-[#1a1a2e]/40 cursor-not-allowed"
                              : "bg-[#e7ab1c] hover:bg-[#d49c10] text-[#1a1a2e] shadow-[0_2px_12px_rgba(231,171,28,0.25)]"
                          }`}
                        >
                          {soldOut ? "Sold Out" : "Register →"}
                        </span>
                      </Link>
                    )
                  }
                )}
              </StaggerChildren>
            </AnimateOnScroll>
          ))
        ) : (
          /* ── Empty state ── */
          <AnimateOnScroll animation="fade-up">
            <div className="max-w-lg mx-auto text-center py-16 rounded-2xl bg-white shadow-sm border border-[#1a1a2e]/[0.06]">
              <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center bg-[#e7ab1c]/10">
                <Ticket size={28} className="text-[#e7ab1c]" />
              </div>
              <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">
                Tickets Coming Soon
              </h2>
              <p className="text-sm text-[#1a1a2e]/65 max-w-sm mx-auto mb-6">
                Stay tuned for upcoming events and registration.
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#e7ab1c] hover:bg-[#d49c10] text-[#1a1a2e] text-sm font-bold transition-colors shadow-[0_2px_12px_rgba(231,171,28,0.25)]"
              >
                Browse Events
              </Link>
            </div>
          </AnimateOnScroll>
        )}
      </section>
    </main>
  )
}
