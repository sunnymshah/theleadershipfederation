/**
 * Shared constants/types for event-page sections. Lives in lib/ (NOT in
 * a "use server" file) so we can export objects/arrays safely — Next 16
 * forbids non-async exports from "use server" files.
 */

export const SECTION_KINDS = [
  "hero",
  "rich_text",
  "stats_row",
  "speakers_grid",
  "agenda",
  "tickets_cta",
  "sponsors_grid",
  "video",
  "gallery",
  "cta_button",
  "faqs",
] as const

export type SectionKind = (typeof SECTION_KINDS)[number]

export type EventSection = {
  id: string
  event_id: string
  kind: SectionKind
  title: string | null
  subtitle: string | null
  body: string | null
  image_url: string | null
  video_url: string | null
  cta_label: string | null
  cta_url: string | null
  data: Record<string, unknown>
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}
