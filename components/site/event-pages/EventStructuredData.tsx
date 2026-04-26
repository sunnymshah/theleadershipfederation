/**
 * JSON-LD schema.org/Event structured data for the home page.
 * Search engines + LinkedIn previews use this to render rich cards.
 */

import Script from "next/script"

type EventLite = {
  id: string
  slug: string
  title: string
  start_date: string
  end_date: string
  venue: string
  description: string | null
  cover_image_url: string | null
}

export function EventStructuredData({
  event,
  speakers,
  sponsors,
  tickets,
}: {
  event: EventLite
  speakers: Array<Record<string, unknown>>
  sponsors: Array<Record<string, unknown>>
  tickets: Array<Record<string, unknown>>
}) {
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.start_date,
    endDate: event.end_date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    description: event.description ?? undefined,
    image: event.cover_image_url ? [event.cover_image_url] : undefined,
    location: event.venue
      ? {
          "@type": "Place",
          name: event.venue,
        }
      : undefined,
    organizer: {
      "@type": "Organization",
      name: "The Leadership Federation",
      url: "https://www.leadershipfederation.com",
    },
    performer: speakers
      .filter((s) => s.name)
      .map((s) => ({
        "@type": "Person",
        name: s.name,
        jobTitle: s.designation ?? undefined,
        worksFor: s.company ? { "@type": "Organization", name: s.company } : undefined,
      })),
    sponsor: sponsors
      .filter((s) => s.name)
      .map((s) => ({
        "@type": "Organization",
        name: s.name,
        url: s.website ?? undefined,
      })),
    offers: tickets
      .filter((t) => t.price_inr !== undefined)
      .map((t) => ({
        "@type": "Offer",
        name: t.name,
        price: String(t.price_inr ?? 0),
        priceCurrency: "INR",
        availability:
          (t.sold ?? 0) >= (t.inventory_limit ?? Infinity)
            ? "https://schema.org/SoldOut"
            : "https://schema.org/InStock",
      })),
  }

  // Strip undefined fields so the JSON stays tight.
  const cleaned = JSON.parse(JSON.stringify(ld))

  return (
    <Script
      id={`event-jsonld-${event.id}`}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleaned) }}
    />
  )
}
