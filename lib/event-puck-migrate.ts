/**
 * Legacy → Puck migration helper.
 *
 * Converts an existing `event_sections` ordered list into a Puck `Data`
 * object. Each section row becomes one Puck component entry in the
 * content array. The JSONB `data` blob is mapped onto the component's
 * props 1:1 (stats, faqs, images, layout/frame/fit).
 *
 * Used by:
 *   - app/actions/eventBuilderActions.ts (getBuilderDraft first-time seed)
 *   - components/admin/puck/* (if we ever need to "import legacy" on demand)
 *
 * Lives outside "use server" files because this is a pure synchronous
 * helper (Next 16 forbids exporting non-async functions from server files).
 */

import type { EventSection } from "@/lib/event-sections"

/** Structural alias for the Puck `Data` shape we care about. We avoid
 *  importing Puck's own type here so this file can be used on both the
 *  server and client without dragging Puck client chunks into server
 *  action bundles. */
export type PuckDataLike = {
  content: Array<{
    type: string
    props: Record<string, unknown> & { id: string }
  }>
  root: { props: Record<string, unknown> }
  zones?: Record<string, unknown>
}

function uid(prefix: string): string {
  // Stable-ish id. Puck requires unique ids per component instance.
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

function coerceData(s: EventSection): Record<string, unknown> {
  return (s.data ?? {}) as Record<string, unknown>
}

export function legacyToPuck(
  sections: EventSection[],
  opts: { title: string },
): PuckDataLike {
  const content: PuckDataLike["content"] = []

  for (const s of sections) {
    const d = coerceData(s)
    const base = {
      id: `${s.kind}-${s.id.slice(0, 8)}`,
      title: s.title ?? "",
      subtitle: s.subtitle ?? "",
    }

    switch (s.kind) {
      case "hero":
        content.push({
          type: "Hero",
          props: {
            ...base,
            ctaLabel: s.cta_label ?? "",
            ctaUrl: s.cta_url ?? "",
            backgroundImage: s.image_url ?? "",
          },
        })
        break
      case "rich_text":
        content.push({
          type: "RichText",
          props: { ...base, body: s.body ?? "" },
        })
        break
      case "stats_row":
        content.push({
          type: "StatsRow",
          props: {
            ...base,
            stats: Array.isArray(d.stats) ? (d.stats as Array<{ value: string; label: string }>) : [],
          },
        })
        break
      case "speakers_grid":
        content.push({
          type: "SpeakersGrid",
          props: {
            ...base,
            layout: (d.layout as string) ?? "grid-4",
            frame: (d.frame as string) ?? "circle",
            fit: (d.fit as string) ?? "contain",
          },
        })
        break
      case "agenda":
        content.push({
          type: "Agenda",
          props: { ...base },
        })
        break
      case "tickets_cta":
        content.push({
          type: "TicketsCta",
          props: {
            ...base,
            ctaLabel: s.cta_label ?? "Buy Tickets",
          },
        })
        break
      case "sponsors_grid":
        content.push({
          type: "SponsorsGrid",
          props: { ...base },
        })
        break
      case "video":
        content.push({
          type: "Video",
          props: { ...base, videoUrl: s.video_url ?? "" },
        })
        break
      case "gallery":
        content.push({
          type: "Gallery",
          props: {
            ...base,
            images: Array.isArray(d.images)
              ? (d.images as string[]).map((url) => ({ url }))
              : [],
          },
        })
        break
      case "cta_button":
        content.push({
          type: "CtaButton",
          props: {
            ...base,
            ctaLabel: s.cta_label ?? "",
            ctaUrl: s.cta_url ?? "",
          },
        })
        break
      case "faqs":
        content.push({
          type: "Faqs",
          props: {
            ...base,
            faqs: Array.isArray(d.faqs) ? (d.faqs as Array<{ q: string; a: string }>) : [],
          },
        })
        break
      default:
        // Unknown kind — skip rather than break the page.
        break
    }
  }

  return {
    content,
    root: { props: { title: opts.title } },
    zones: {},
  }
}

/** Create a minimal Puck starter for an event that has never been built.
 *  A single Hero gives the admin a visible starting point. */
export function emptyBuilderSeed(title: string): PuckDataLike {
  return {
    content: [
      {
        type: "Hero",
        props: {
          id: uid("hero"),
          title,
          subtitle: "Use the left panel to add blocks. Drag to reorder.",
          ctaLabel: "",
          ctaUrl: "",
          backgroundImage: "",
        },
      },
    ],
    root: { props: { title } },
    zones: {},
  }
}
