/**
 * ─── PAGE BUILDER HUB ────────────────────────────────────────────────
 *
 * Reached from the Backstage sidebar ("Page Builder"). Lists every
 * event as a card with:
 *   • title, dates, status pill
 *   • one-click "Open Builder" → /admin/builder/[id] (fullscreen Puck)
 *   • inline shortcuts to the event's Sessions / Speakers / Tickets /
 *     Sponsors tabs so organisers can manage the data that feeds the
 *     builder's blocks without bouncing back to the events list.
 *
 * Auth is inherited from (console)/layout.tsx.
 * Path gate via NAV_RESOURCE_MAP: /admin/builder → "events".
 */

import Link from "next/link"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { Hammer, Calendar, MapPin, ExternalLink, ArrowRight, Users, Ticket, ClipboardList, Building2, AlertTriangle } from "lucide-react"
import { findPlaceholderBlocks } from "@/lib/placeholder-detect"

export const metadata = { title: "Page Builder" }
export const dynamic = "force-dynamic"

type EventRow = {
  id: string
  slug: string
  title: string
  status: string | null
  start_date: string
  end_date: string | null
  venue: string | null
  cover_image_url: string | null
  /** PART B2 — populated from a builder_data + event_standard_pages
   *  walk so the card can render an amber badge when an admin is
   *  about to publish blocks that still carry seeded sample copy. */
  placeholderCount?: number
}

type DraftMeta = {
  event_id: string
  updated_at: string
  is_published: boolean
}

function fmtDate(d: string | null) {
  if (!d) return ""
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function relativeTime(iso: string | null): string | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

const statusStyle: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  draft:      { label: "Draft",      bg: "bg-gray-100",    text: "text-gray-600",    dot: "bg-gray-400" },
  published:  { label: "Live",       bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  completed:  { label: "Completed",  bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500" },
  cancelled:  { label: "Cancelled",  bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500" },
}

export default async function BuilderHubPage() {
  // Resolve events + builder drafts via the service-role client to dodge
  // RLS (same pattern the console layout uses). Graceful fallback if the
  // env var is missing locally — we render an empty state with guidance.
  let events: EventRow[] = []
  let draftsByEvent: Record<string, DraftMeta> = {}
  let envMissing = false

  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const admin = createAdminClient()
      const [{ data: eventRows }, { data: draftRows }, builderDataRes, stdPagesRes] = await Promise.all([
        admin
          .from("events")
          .select("id, slug, title, status, start_date, end_date, venue, cover_image_url")
          .order("start_date", { ascending: false })
          .limit(100),
        admin
          .from("event_builder_drafts")
          .select("event_id, updated_at, is_published")
          .limit(500),
        // PART B2 — pull the live home-page Puck content for every event
        // so the hub can tally placeholder blocks per event.
        admin
          .from("events")
          .select("id, builder_data")
          .limit(100),
        admin
          .from("event_standard_pages")
          .select("event_id, settings")
          .limit(2000),
      ])
      events = (eventRows as EventRow[]) ?? []
      for (const d of (draftRows as DraftMeta[]) ?? []) {
        draftsByEvent[d.event_id] = d
      }
      // Walk the home + sub-page Puck content for each event and count
      // any block whose props still match seeded sample copy.
      const counts: Record<string, number> = {}
      type RawContent = ReadonlyArray<{ type?: string; props?: Record<string, unknown> }>
      for (const row of (builderDataRes.data ?? []) as Array<{ id: string; builder_data: { content?: unknown } | null }>) {
        const c = (row.builder_data?.content ?? []) as RawContent
        counts[row.id] = (counts[row.id] ?? 0) + findPlaceholderBlocks(c).length
      }
      for (const row of (stdPagesRes.data ?? []) as Array<{ event_id: string; settings: { puckData?: { content?: unknown } } | null }>) {
        const c = (row.settings?.puckData?.content ?? []) as RawContent
        counts[row.event_id] = (counts[row.event_id] ?? 0) + findPlaceholderBlocks(c).length
      }
      events = events.map((e) => ({ ...e, placeholderCount: counts[e.id] ?? 0 }))
    }
  } catch (e) {
    envMissing = /SUPABASE_SERVICE_ROLE_KEY/i.test((e as Error)?.message ?? "")
  }

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 md:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-gray-400 mb-2">
          <Hammer size={12} />
          Page Builder
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#1a1a2e] tracking-tight">
          Design your event pages
        </h1>
        <p className="mt-1 text-sm text-gray-500 max-w-2xl">
          Pick an event to open the drag-and-drop builder. Speakers, sessions, tickets and sponsors you add here auto-populate on the public page.
        </p>
      </div>

      {envMissing && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          Builder data isn&rsquo;t available locally &mdash; <code className="bg-white/60 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> isn&rsquo;t set. The hub will work on the deployed site.
        </div>
      )}

      {events.length === 0 && !envMissing ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {events.map((e) => (
            <EventBuilderCard
              key={e.id}
              event={e}
              draft={draftsByEvent[e.id] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#c9a84c]/10 text-[#c9a84c] mb-4">
        <Hammer size={20} />
      </div>
      <div className="text-base font-semibold text-[#1a1a2e]">No events yet</div>
      <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
        Create an event first &mdash; then come back here to design its page with the builder.
      </p>
      <Link
        href="/admin/events"
        className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1a1a2e] text-white text-[13px] font-semibold hover:bg-black transition-colors"
      >
        Go to Events
        <ArrowRight size={13} />
      </Link>
    </div>
  )
}

function EventBuilderCard({
  event,
  draft,
}: {
  event: EventRow
  draft: DraftMeta | null
}) {
  const badge = statusStyle[event.status ?? "draft"] ?? statusStyle.draft
  const lastEdited = relativeTime(draft?.updated_at ?? null)
  const isPublishedBuild = draft?.is_published

  return (
    <div className="group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-[#c9a84c]/60 hover:shadow-[0_16px_40px_rgba(26,26,46,0.06)] transition-all flex flex-col">
      {/* Cover strip */}
      <div
        className="h-28 w-full relative"
        style={{
          backgroundImage: event.cover_image_url
            ? `linear-gradient(to top, rgba(26,26,46,0.6), rgba(26,26,46,0.1)), url(${event.cover_image_url})`
            : "linear-gradient(135deg, #1a1a2e 0%, #2563eb 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            {badge.label}
          </span>
          {isPublishedBuild && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#c9a84c]/90 text-white">
              Build Live
            </span>
          )}
          {/* PART B2 — placeholder warning. Renders only when at
              least one block still carries seeded sample copy (matched
              via lib/placeholder-detect against the full home + sub-pages
              walk). Admin opens the builder to fix. */}
          {(event.placeholderCount ?? 0) > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/95 text-white"
              title={`${event.placeholderCount} section${event.placeholderCount === 1 ? "" : "s"} still carry placeholder content. Open the builder to review.`}
            >
              <AlertTriangle size={10} strokeWidth={2} />
              {event.placeholderCount} placeholder{event.placeholderCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 md:p-5 flex flex-col flex-1">
        <div className="mb-2">
          <h3 className="text-[15px] md:text-base font-semibold text-[#1a1a2e] line-clamp-1">
            {event.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} />
              {fmtDate(event.start_date)}
              {event.end_date && event.end_date !== event.start_date && (
                <> &mdash; {fmtDate(event.end_date)}</>
              )}
            </span>
            {event.venue && (
              <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                <MapPin size={11} />
                <span className="truncate">{event.venue}</span>
              </span>
            )}
          </div>
        </div>

        <div className="text-[11px] text-gray-400 mb-4">
          {lastEdited ? `Builder edited ${lastEdited}` : "Builder not started yet"}
        </div>

        {/* Primary CTA + live link */}
        <div className="flex items-center gap-2 mb-3">
          <Link
            href={`/admin/builder/${event.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#c9a84c] text-[#1a1a2e] text-[13px] font-bold hover:bg-[#d4b85c] transition-colors shadow-[0_2px_8px_rgba(201,168,76,0.25)]"
          >
            <Hammer size={14} />
            Open Builder
          </Link>
          {event.status === "published" && (
            <Link
              href={`/events/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View live page"
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-gray-500 hover:text-[#1a1a2e] hover:border-gray-300 transition-colors"
            >
              <ExternalLink size={14} />
            </Link>
          )}
        </div>

        {/* Data shortcuts — the "same controls" inside the builder
            experience so organisers can manage what the blocks pull from. */}
        <div className="grid grid-cols-4 gap-1.5">
          <DataShortcut href={`/admin/events/${event.id}?tab=speakers`}   icon={Users}         label="Speakers" />
          <DataShortcut href={`/admin/events/${event.id}?tab=agenda`}     icon={ClipboardList} label="Sessions" />
          <DataShortcut href={`/admin/events/${event.id}?tab=tickets`}    icon={Ticket}        label="Tickets" />
          <DataShortcut href={`/admin/events/${event.id}?tab=sponsors`}   icon={Building2}     label="Sponsors" />
        </div>
      </div>
    </div>
  )
}

function DataShortcut({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-300 text-gray-600 hover:text-[#1a1a2e] transition-colors"
    >
      <Icon size={13} className="text-gray-400" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}
