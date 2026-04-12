import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, MapPin, Clock } from "lucide-react"
import { TicketPurchaseCard } from "@/components/site/TicketPurchaseCard"
import { getEvent } from "@/lib/get-event"

export const revalidate = 30

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) return { title: "Tickets Not Found" }
  return {
    title: `Tickets: ${event.title} | The Leadership Federation`,
    description: `Book your seat at ${event.title}${event.venue ? ` — ${event.venue}` : ""}`,
  }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function EventTicketsPage({ params }: Props) {
  const { slug } = await params
  const event = await getEvent(slug)
  if (!event) notFound()

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [ticketsRes, customFieldsRes] = await Promise.all([
    supabase
      .from("tickets")
      .select("*")
      .eq("event_id", event.id)
      .eq("status", "published")
      .order("price_inr"),
    supabase
      .from("custom_fields")
      .select("id, field_label, field_name, field_type, options, is_required, sort_order")
      .eq("event_id", event.id)
      .order("sort_order"),
  ])

  const tickets = ticketsRes.data ?? []
  const customFields = customFieldsRes.data ?? []

  // Fetch active price tiers (early bird / timed pricing)
  const now = new Date().toISOString()
  const ticketIds = tickets.map((t: { id: string }) => t.id)
  const { data: activePriceTiers } =
    ticketIds.length > 0
      ? await supabase
          .from("ticket_price_tiers")
          .select("*")
          .in("ticket_id", ticketIds)
          .eq("is_active", true)
          .lte("starts_at", now)
          .gte("ends_at", now)
      : { data: [] as { ticket_id: string; price_inr: number; name: string }[] }

  const priceTierMap: Record<string, { price: number; name: string }> = {}
  for (const tier of activePriceTiers ?? []) {
    if (!priceTierMap[tier.ticket_id]) {
      priceTierMap[tier.ticket_id] = { price: tier.price_inr, name: tier.name }
    }
  }

  const isCompleted =
    event.status === "completed" || new Date(event.end_date).getTime() < Date.now()

  return (
    <main className="min-h-screen bg-[#F4F8FF]">
      {/* Header */}
      <section className="pt-24 pb-10 px-6 border-b border-[#1a1a2e]/[0.05]">
        <div className="max-w-5xl mx-auto">
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-[#1a1a2e]/65 hover:text-[#e7ab1c] transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Back to event
          </Link>

          <span className="inline-block text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.25em] mb-3">
            Register Your Place
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1a1a2e] tracking-tight mb-4">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-5 text-sm text-[#1a1a2e]/75">
            <span className="inline-flex items-center gap-2">
              <Calendar size={15} className="text-[#e7ab1c]" />
              {fmtDate(event.start_date)}
              {event.start_date !== event.end_date && (
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
        </div>
      </section>

      {/* Tickets */}
      <section className="py-14 px-6">
        <div className="max-w-5xl mx-auto">
          {isCompleted ? (
            <div className="max-w-lg mx-auto text-center py-12 rounded-2xl bg-white shadow-sm border border-[#1a1a2e]/[0.06]">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-blue-500/10">
                <Clock size={28} className="text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-[#1a1a2e] mb-2">
                This Event Has Ended
              </h2>
              <p className="text-sm text-[#1a1a2e]/65 max-w-sm mx-auto">
                Registration is no longer available. Stay tuned for future events.
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full bg-[#e7ab1c] hover:bg-[#d49c10] text-[#1a1a2e] text-sm font-bold transition-colors shadow-[0_2px_12px_rgba(231,171,28,0.25)]"
              >
                Browse Upcoming Events
              </Link>
            </div>
          ) : tickets.length === 0 ? (
            <div className="max-w-lg mx-auto text-center py-12 rounded-2xl bg-white shadow-sm border border-[#1a1a2e]/[0.06]">
              <h2 className="text-lg font-semibold text-[#1a1a2e] mb-2">
                Tickets not yet available
              </h2>
              <p className="text-sm text-[#1a1a2e]/65 max-w-sm mx-auto">
                Registration for this event hasn&apos;t opened yet. Check back soon.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] mb-3">
                  Choose Your Experience
                </h2>
                <p className="text-sm text-[#1a1a2e]/65 max-w-lg mx-auto">
                  Select the tier that matches your level of engagement. Limited seats available.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map((ticket: { id: string; price_inr: number }) => (
                  <TicketPurchaseCard
                    key={ticket.id}
                    ticket={ticket as never}
                    eventId={event.id}
                    eventTitle={event.title}
                    currentPrice={priceTierMap[ticket.id]?.price ?? null}
                    tierName={priceTierMap[ticket.id]?.name ?? null}
                    customFields={customFields}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
