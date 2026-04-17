"use client"

/**
 * ─── EVENT PAGE BUILDER (Zoho-Backstage-style) ───────────────────────
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ Top bar: back • event title • LIVE chip • date • Preview •   │
 *   │           View Website • Publish                              │
 *   ├─────┬─────────────────────────────────────────────────────────┤
 *   │     │                                                          │
 *   │ rail│  Canvas — section cards stacked, with inline "+ Add      │
 *   │     │  Section" between each, hover to reveal edit/move/delete │
 *   │     │                                                          │
 *   └─────┴──────────────────────────────────────────────────────────┘
 *
 *   Right drawer slides in when you click a section to edit it.
 *   Image fields use ImageUploadCrop (drag/pan + zoom + upload).
 */

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/utils/supabase/client"
import {
  getEventSections,
  createEventSection,
  updateEventSection,
  deleteEventSection,
  moveEventSection,
  duplicateEventSection,
} from "@/app/actions/eventSectionActions"
import { SECTION_KINDS, type EventSection, type SectionKind } from "@/lib/event-sections"
import { ImageUploadCrop } from "@/components/admin/ImageUploadCrop"
import { EventSectionsRenderer } from "@/components/site/EventSections"
import {
  ArrowLeft, ArrowUp, ArrowDown, Copy, Trash2, Plus, Eye, Loader2,
  Save, ChevronDown, ExternalLink, LayoutPanelTop, Type, BarChart3,
  Users, Clock, Ticket, Building2, PlayCircle, ImageIcon,
  MousePointerClick, HelpCircle, Layers, Palette, Search, Plug,
  Settings, X, Pencil, Undo, Redo, Globe,
} from "lucide-react"

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

const KIND_META: Record<SectionKind, {
  label: string
  desc: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  /** Image aspect-ratio hint for the uploader (w/h). 0 = no image. */
  imageAspect: number
}> = {
  hero:          { label: "Hero",          desc: "Banner with title, subtitle, CTA, background image", icon: LayoutPanelTop,        imageAspect: 16 / 9 },
  rich_text:     { label: "Rich Text",     desc: "Long-form about / description",                      icon: Type,                  imageAspect: 0 },
  stats_row:     { label: "Stats Row",     desc: "Up to 4 headline metrics",                           icon: BarChart3,             imageAspect: 0 },
  speakers_grid: { label: "Speakers Grid", desc: "Auto-populates from event speakers",                 icon: Users,                 imageAspect: 0 },
  agenda:        { label: "Agenda",        desc: "Auto-populates from event sessions",                 icon: Clock,                 imageAspect: 0 },
  tickets_cta:   { label: "Tickets + CTA", desc: "Ticket tiers with Buy button",                       icon: Ticket,                imageAspect: 0 },
  sponsors_grid: { label: "Sponsors Grid", desc: "Auto-populates from event sponsors",                 icon: Building2,             imageAspect: 0 },
  video:         { label: "Video",         desc: "YouTube embed",                                      icon: PlayCircle,            imageAspect: 0 },
  gallery:       { label: "Gallery",       desc: "Image grid (paste URLs in data)",                    icon: ImageIcon,             imageAspect: 1 },
  cta_button:    { label: "CTA Button",    desc: "Centered call-to-action button",                     icon: MousePointerClick,     imageAspect: 0 },
  faqs:          { label: "FAQ",           desc: "Question + answer accordion",                        icon: HelpCircle,            imageAspect: 0 },
}

/* ── Top-level tabs in the left rail ────────────────────────────────── */
const LEFT_RAIL = [
  { id: "sections",     label: "Sections",     icon: Layers,      active: true  },
  { id: "theme",        label: "Theme",        icon: Palette,     active: false },
  { id: "seo",          label: "SEO",          icon: Search,      active: false },
  { id: "integrations", label: "Integrations", icon: Plug,        active: false },
  { id: "settings",     label: "Settings",     icon: Settings,    active: false },
] as const

export default function EventBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [eventMeta, setEventMeta] = useState<{
    title: string; slug: string; status: string; start_date: string | null; venue: string | null
  }>({ title: "", slug: "", status: "", start_date: null, venue: null })
  const [sections, setSections] = useState<EventSection[]>([])
  // Real child data — loaded once so the canvas can render the actual
  // speakers grid / agenda / sponsors / tickets exactly like the public site.
  const [speakers, setSpeakers] = useState<Array<{ id: string; name: string; designation: string | null; company: string | null; image_url: string | null }>>([])
  const [sessions, setSessions] = useState<Array<{ id: string; title: string; starts_at: string; ends_at: string | null; speaker_names: string[] | null; track: string | null }>>([])
  const [sponsors, setSponsors] = useState<Array<{ id: string; name: string; logo_url: string | null; tier: string | null; website: string | null }>>([])
  const [tickets, setTickets] = useState<Array<{ id: string; name: string; description: string | null; price_inr: number; sold: number; inventory_limit: number | null }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpenAt, setAddOpenAt] = useState<number | null>(null) // null = closed, number = insert position
  const [editing, setEditing] = useState<EventSection | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [publishPulse, setPublishPulse] = useState(false)

  const refresh = useCallback(async () => {
    const res = await getEventSections(id as string)
    if (res.success) setSections(res.sections)
    else setError(res.error ?? "Failed to load sections")
    setLoading(false)
  }, [id])

  useEffect(() => {
    (async () => {
      // Event metadata
      const { data } = await supabase
        .from("events")
        .select("title, slug, status, start_date, venue")
        .eq("id", id)
        .maybeSingle()
      if (data) {
        setEventMeta({
          title: (data.title as string) ?? "Event",
          slug: (data.slug as string) ?? "",
          status: (data.status as string) ?? "",
          start_date: (data.start_date as string) ?? null,
          venue: (data.venue as string) ?? null,
        })
      }

      // Child data in parallel — feeds the live canvas so it looks like
      // the real public site (speakers grid with photos, agenda with
      // real sessions, sponsor logos, ticket tiers).
      const [sp, se, sn, tk] = await Promise.all([
        supabase.from("speakers").select("id, name, designation, company, image_url").eq("event_id", id).order("sort_order"),
        supabase.from("sessions").select("id, title, start_time, end_time, track").eq("event_id", id).order("start_time"),
        supabase.from("sponsors").select("id, name, logo_url, tier, website_url").eq("event_id", id).order("sort_order"),
        supabase.from("tickets").select("id, name, description, price_inr, sold, inventory_limit").eq("event_id", id).order("sort_order"),
      ])
      setSpeakers((sp.data ?? []) as typeof speakers)
      setSessions(
        ((se.data ?? []) as Array<{ id: string; title: string; start_time: string; end_time: string | null; track: string | null }>).map((s) => ({
          id: s.id,
          title: s.title,
          starts_at: s.start_time,
          ends_at: s.end_time,
          speaker_names: null,
          track: s.track,
        })),
      )
      setSponsors(
        ((sn.data ?? []) as Array<{ id: string; name: string; logo_url: string | null; tier: string | null; website_url: string | null }>).map((s) => ({
          id: s.id,
          name: s.name,
          logo_url: s.logo_url,
          tier: s.tier,
          website: s.website_url,
        })),
      )
      setTickets(((tk.data ?? []) as typeof tickets))

    })()
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleAdd(kind: SectionKind) {
    setAddOpenAt(null)
    setBusy("add")
    const titleDefaults: Partial<Record<SectionKind, string>> = {
      hero: "Welcome",
      rich_text: "About the event",
      stats_row: "By the Numbers",
      speakers_grid: "Speakers",
      agenda: "Agenda",
      tickets_cta: "Reserve Your Seat",
      sponsors_grid: "Our Partners",
      video: "Highlights",
      gallery: "Gallery",
      cta_button: "Register Now",
      faqs: "Frequently Asked",
    }
    const data: Record<string, unknown> = {}
    if (kind === "stats_row") data.stats = [{ value: "30+", label: "Countries" }, { value: "500+", label: "CXOs" }]
    if (kind === "faqs") data.faqs = [{ q: "How do I register?", a: "Click the Register button above." }]
    if (kind === "gallery") data.images = []

    const res = await createEventSection({
      eventId: id as string,
      kind,
      title: titleDefaults[kind] ?? "",
      data,
    })
    setBusy(null)
    if (res.success && res.section) {
      await refresh()
      // Open the new section in the drawer immediately so user can edit
      setEditing(res.section as EventSection)
    } else setError(res.error ?? "Failed to add section")
  }

  async function handleMove(sectionId: string, dir: "up" | "down") {
    setBusy(sectionId)
    const res = await moveEventSection(sectionId, dir)
    setBusy(null)
    if (!res.success) setError(res.error ?? "Reorder failed")
    await refresh()
  }

  async function handleDelete(sectionId: string) {
    if (!confirm("Delete this section? This cannot be undone.")) return
    setBusy(sectionId)
    const res = await deleteEventSection(sectionId)
    setBusy(null)
    if (!res.success) setError(res.error ?? "Delete failed")
    await refresh()
  }

  async function handleDuplicate(sectionId: string) {
    setBusy(sectionId)
    const res = await duplicateEventSection(sectionId)
    setBusy(null)
    if (!res.success) setError(res.error ?? "Duplicate failed")
    await refresh()
  }

  async function handlePublish() {
    // We already persist on Save Section; "Publish" here just re-validates
    // the public page and shows a quick UI cue. Real publish toggle (draft
    // vs live) is on the event status, managed from /admin/events/[id].
    setPublishPulse(true)
    setTimeout(() => setPublishPulse(false), 1800)
    // Fetch the public page to warm/revalidate
    try {
      await fetch(`/events/${eventMeta.slug}`, { cache: "no-store" })
    } catch {}
  }

  const isLive = eventMeta.status === "published"
  const dateLabel = eventMeta.start_date
    ? new Date(eventMeta.start_date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).toUpperCase()
    : ""

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col text-white" style={sfFont}>
      {/* ══════════════ TOP BAR ═════════════════════════════════════════ */}
      <header className="shrink-0 h-[52px] bg-[#111111] border-b border-[#1f1f1f] flex items-center px-4 gap-3">
        <Link href={`/admin/events/${id}`} className="p-1.5 rounded hover:bg-white/10 text-white/70" title="Back to event">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md bg-[#e7ab1c] flex items-center justify-center text-[#1a1a2e] text-[10px] font-black shrink-0">
            ⚑
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-[14px] font-semibold truncate max-w-[420px]">{eventMeta.title || "Event"}</h1>
              {isLive && (
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/50">{dateLabel}</p>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <button disabled className="p-1.5 rounded text-white/30" title="Undo (coming soon)">
            <Undo size={14} />
          </button>
          <button disabled className="p-1.5 rounded text-white/30" title="Redo (coming soon)">
            <Redo size={14} />
          </button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          {eventMeta.slug && (
            <Link
              href={`/events/${eventMeta.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold text-white/80 hover:text-white hover:bg-white/10"
            >
              <Eye size={13} /> Preview
            </Link>
          )}
          {eventMeta.slug && (
            <Link
              href="/"
              target="_blank"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold text-white/80 hover:text-white hover:bg-white/10"
            >
              <Globe size={13} /> View Website
            </Link>
          )}
          <button
            onClick={handlePublish}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-bold transition-all ${
              publishPulse
                ? "bg-emerald-500 text-white"
                : "bg-[#e7ab1c] text-[#1a1a2e] hover:bg-[#d49c10]"
            }`}
          >
            {publishPulse ? "✓ Published" : "Publish"}
          </button>
        </div>
      </header>

      {/* ══════════════ MAIN ROW ════════════════════════════════════════ */}
      <div className="flex-1 flex min-h-0">
        {/* ───── LEFT RAIL ────────────────────────────────────────────── */}
        <aside className="shrink-0 w-[64px] bg-[#111111] border-r border-[#1f1f1f] flex flex-col items-center py-4 gap-2">
          {LEFT_RAIL.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                disabled={!item.active}
                className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  item.active
                    ? "bg-white/10 text-[#e7ab1c]"
                    : "text-white/30 hover:text-white/50"
                }`}
                title={item.active ? item.label : `${item.label} (coming soon)`}
              >
                <Icon size={16} />
                <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
              </button>
            )
          })}
        </aside>

        {/* ───── CANVAS ───────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0a]">
          {error && (
            <div className="max-w-[1100px] mt-4 mx-auto px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-200">
              {error}
              <button onClick={() => setError(null)} className="ml-3 underline">dismiss</button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24 text-white/40">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : (
            <div className="max-w-[1100px] mx-auto py-8 px-6 space-y-0">
              <div className="mb-3 px-2 text-[11px] text-white/50 uppercase tracking-wider">
                Live canvas — click any section to edit · hover between to insert new
              </div>
              {/* First Add button (insert at top) */}
              <InlineAddButton
                position={0}
                open={addOpenAt === 0}
                onToggle={() => setAddOpenAt(addOpenAt === 0 ? null : 0)}
                onPick={handleAdd}
              />

              {sections.length === 0 ? (
                <EmptyHint onStart={() => setAddOpenAt(0)} />
              ) : (
                sections.map((s, i) => (
                  <div key={s.id}>
                    <SectionCard
                      section={s}
                      index={i}
                      total={sections.length}
                      busy={busy === s.id}
                      onEdit={() => setEditing(s)}
                      onMove={handleMove}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      eventData={{
                        id: id as string,
                        slug: eventMeta.slug,
                        title: eventMeta.title,
                        start_date: eventMeta.start_date ?? new Date().toISOString(),
                        end_date: null,
                        venue: eventMeta.venue,
                        description: null,
                        cover_image_url: null,
                      }}
                      speakers={speakers}
                      sessions={sessions}
                      sponsors={sponsors}
                      tickets={tickets}
                    />
                    <InlineAddButton
                      position={i + 1}
                      open={addOpenAt === i + 1}
                      onToggle={() => setAddOpenAt(addOpenAt === i + 1 ? null : i + 1)}
                      onPick={handleAdd}
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* ══════════════ EDIT DRAWER ════════════════════════════════════ */}
      {editing && (
        <SectionEditDrawer
          key={editing.id}
          section={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { await refresh(); }}
          onDelete={async (sid) => { await handleDelete(sid); setEditing(null) }}
        />
      )}
    </div>
  )
}

/* ═════════════ INLINE ADD BUTTON ══════════════════════════════════════ */
function InlineAddButton({
  open,
  onToggle,
  onPick,
}: {
  position: number
  open: boolean
  onToggle: () => void
  onPick: (kind: SectionKind) => void
}) {
  return (
    <div className="relative h-8 flex items-center justify-center group">
      <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-white/10 ${open ? "" : "group-hover:bg-white/30"} transition-colors`} />
      <button
        onClick={onToggle}
        className={`relative z-10 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
          open
            ? "bg-[#e7ab1c] text-[#1a1a2e]"
            : "bg-[#1a1a1a] text-white/60 border border-white/10 opacity-0 group-hover:opacity-100 hover:text-white hover:border-[#e7ab1c]/50"
        }`}
      >
        <Plus size={12} />
        Add Section
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[360px] bg-[#141414] rounded-xl shadow-2xl border border-white/10 z-50 p-2 max-h-[440px] overflow-y-auto">
          {SECTION_KINDS.map((kind) => {
            const meta = KIND_META[kind]
            const Icon = meta.icon
            return (
              <button
                key={kind}
                onClick={() => onPick(kind)}
                className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#e7ab1c]/15 flex items-center justify-center text-[#e7ab1c] shrink-0">
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{meta.label}</p>
                  <p className="text-[11px] text-white/50 leading-snug">{meta.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ═════════════ EMPTY HINT ═════════════════════════════════════════════ */
function EmptyHint({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center py-20 px-6 border border-dashed border-white/15 rounded-2xl bg-white/[0.02]">
      <LayoutPanelTop size={32} className="mx-auto text-[#e7ab1c] mb-4" />
      <h3 className="text-base font-semibold text-white">Your event page is empty</h3>
      <p className="text-sm text-white/50 mt-1 max-w-md mx-auto">
        Hover between sections and click <span className="font-semibold text-[#e7ab1c]">+ Add Section</span> to start. Most events use:
        Hero → About → Speakers → Agenda → Tickets.
      </p>
      <button
        onClick={onStart}
        className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e7ab1c] text-[#1a1a2e] text-sm font-bold hover:bg-[#d49c10]"
      >
        <Plus size={14} /> Add your first section
      </button>
    </div>
  )
}

/* ═════════════ SECTION CARD — actual website rendering + edit overlay ═ */
function SectionCard({
  section: s,
  index,
  total,
  busy,
  onEdit,
  onMove,
  onDelete,
  onDuplicate,
  eventData,
  speakers,
  sessions,
  sponsors,
  tickets,
}: {
  section: EventSection
  index: number
  total: number
  busy: boolean
  onEdit: () => void
  onMove: (id: string, dir: "up" | "down") => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  eventData: { id: string; slug: string; title: string; start_date: string; end_date: string | null; venue: string | null; description: string | null; cover_image_url: string | null }
  speakers: Array<{ id: string; name: string; designation: string | null; company: string | null; image_url: string | null }>
  sessions: Array<{ id: string; title: string; starts_at: string; ends_at: string | null; speaker_names: string[] | null; track: string | null }>
  sponsors: Array<{ id: string; name: string; logo_url: string | null; tier: string | null; website: string | null }>
  tickets: Array<{ id: string; name: string; description: string | null; price_inr: number; sold: number; inventory_limit: number | null }>
}) {
  const meta = KIND_META[s.kind]
  const Icon = meta.icon

  return (
    <div
      className="group relative rounded-xl overflow-hidden bg-white border-2 border-transparent hover:border-[#e7ab1c] transition-colors cursor-pointer shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
      onClick={onEdit}
    >
      {/* Real website rendering — same component the public /events/[slug] uses */}
      <div className="pointer-events-none">
        <EventSectionsRenderer
          sections={[s]}
          event={eventData}
          speakers={speakers}
          sessions={sessions}
          sponsors={sponsors}
          tickets={tickets}
        />
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-[#0a0a0a]/0 group-hover:bg-[#0a0a0a]/30 transition-colors pointer-events-none" />

      {/* Controls — top-right */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <button
          disabled={busy || index === 0}
          onClick={() => onMove(s.id, "up")}
          title="Move up"
          className="w-8 h-8 rounded-md bg-[#1a1a1a]/90 backdrop-blur border border-white/10 text-white/80 hover:text-white hover:bg-[#2a2a2a] disabled:opacity-30 flex items-center justify-center"
        >
          <ArrowUp size={13} />
        </button>
        <button
          disabled={busy || index === total - 1}
          onClick={() => onMove(s.id, "down")}
          title="Move down"
          className="w-8 h-8 rounded-md bg-[#1a1a1a]/90 backdrop-blur border border-white/10 text-white/80 hover:text-white hover:bg-[#2a2a2a] disabled:opacity-30 flex items-center justify-center"
        >
          <ArrowDown size={13} />
        </button>
        <button
          disabled={busy}
          onClick={() => onDuplicate(s.id)}
          title="Duplicate"
          className="w-8 h-8 rounded-md bg-[#1a1a1a]/90 backdrop-blur border border-white/10 text-white/80 hover:text-white hover:bg-[#2a2a2a] disabled:opacity-30 flex items-center justify-center"
        >
          <Copy size={13} />
        </button>
        <button
          onClick={onEdit}
          title="Edit"
          className="w-8 h-8 rounded-md bg-[#e7ab1c] text-[#1a1a2e] hover:bg-[#d49c10] flex items-center justify-center"
        >
          <Pencil size={13} />
        </button>
        <button
          disabled={busy}
          onClick={() => onDelete(s.id)}
          title="Delete"
          className="w-8 h-8 rounded-md bg-red-500/15 backdrop-blur border border-red-500/30 text-red-300 hover:bg-red-500/25 disabled:opacity-30 flex items-center justify-center"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Section label — top-left */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#1a1a1a]/85 backdrop-blur border border-white/10">
        <Icon size={11} className="text-[#e7ab1c]" />
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{meta.label}</span>
      </div>

      {busy && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 size={18} className="text-white animate-spin" />
        </div>
      )}
    </div>
  )
}

/* ═════════════ MINI PREVIEW (visual summary of each block) ═══════════ */
function MiniPreview({ section: s }: { section: EventSection }) {
  switch (s.kind) {
    case "hero":
      return (
        <div className="relative min-h-[180px] p-8 flex flex-col justify-end" style={{ background: s.image_url ? undefined : "linear-gradient(135deg,#1a1a2e,#16213e)" }}>
          {s.image_url && (
            <Image src={s.image_url} alt="" fill className="object-cover opacity-60" />
          )}
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white">{s.title || "Untitled hero"}</h3>
            {s.subtitle && <p className="text-sm text-white/80 mt-1 max-w-lg">{s.subtitle}</p>}
            {s.cta_label && <span className="inline-block mt-3 px-4 py-1.5 rounded-md bg-[#e7ab1c] text-[#1a1a2e] text-xs font-bold">{s.cta_label}</span>}
          </div>
        </div>
      )
    case "rich_text":
      return (
        <div className="p-6 bg-white text-[#1a1a2e]">
          <h3 className="text-xl font-bold">{s.title || "Rich text"}</h3>
          {s.subtitle && <p className="text-xs text-[#e7ab1c] font-semibold uppercase tracking-wider mt-1">{s.subtitle}</p>}
          {s.body && <p className="text-sm text-[#1a1a2e]/70 mt-2 whitespace-pre-wrap line-clamp-4">{s.body}</p>}
        </div>
      )
    case "stats_row": {
      const stats = ((s.data as Record<string, unknown>)?.stats as Array<{ value: string; label: string }>) ?? []
      return (
        <div className="p-6 bg-[#F4F8FF] text-[#1a1a2e]">
          <h3 className="text-base font-bold text-center">{s.title || "Stats"}</h3>
          <div className="grid grid-cols-4 gap-4 mt-4">
            {stats.slice(0, 4).map((st, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-[#e7ab1c]">{st.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-[#1a1a2e]/60">{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "speakers_grid":
    case "agenda":
    case "sponsors_grid":
    case "tickets_cta":
    case "faqs":
      return (
        <div className="p-8 bg-[#f6f6f7]">
          <h3 className="text-base font-bold text-center text-[#1a1a2e]">{s.title || KIND_META[s.kind].label}</h3>
          {s.subtitle && <p className="text-xs text-[#1a1a2e]/60 text-center mt-1">{s.subtitle}</p>}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-100 font-medium">
              Auto-populated from event data
            </span>
          </div>
        </div>
      )
    case "video": {
      const vid = s.video_url
      return (
        <div className="p-8 bg-[#0a0a0a] text-white">
          <h3 className="text-base font-bold text-center">{s.title || "Video"}</h3>
          <div className="mt-4 aspect-video max-w-xs mx-auto rounded-lg bg-white/5 flex items-center justify-center">
            <PlayCircle size={32} className="text-[#e7ab1c]" />
          </div>
          {vid && <p className="text-[10px] text-white/40 text-center mt-2 truncate">{vid}</p>}
        </div>
      )
    }
    case "gallery": {
      const images = ((s.data as Record<string, unknown>)?.images as string[]) ?? []
      return (
        <div className="p-6 bg-white">
          <h3 className="text-base font-bold text-center text-[#1a1a2e]">{s.title || "Gallery"}</h3>
          <div className="grid grid-cols-4 gap-2 mt-4 max-w-xs mx-auto">
            {(images.length ? images.slice(0, 4) : [null, null, null, null]).map((img, i) => (
              <div key={i} className="aspect-square rounded bg-[#F4F8FF] overflow-hidden relative">
                {img && <Image src={img} alt="" fill className="object-cover" />}
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "cta_button":
      return (
        <div className="p-10 bg-white text-center">
          <h3 className="text-xl font-bold text-[#1a1a2e]">{s.title || "Call to action"}</h3>
          {s.subtitle && <p className="text-sm text-[#1a1a2e]/60 mt-1">{s.subtitle}</p>}
          {s.cta_label && (
            <span className="inline-block mt-4 px-6 py-2 rounded-md bg-[#e7ab1c] text-[#1a1a2e] text-sm font-bold">
              {s.cta_label}
            </span>
          )}
        </div>
      )
    default:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <div className="p-4 text-white/50 text-sm">{(KIND_META as any)[s.kind]?.label ?? s.kind}</div>
  }
}

/* ═════════════ EDIT DRAWER (right-side) ══════════════════════════════ */
function SectionEditDrawer({
  section,
  onClose,
  onSaved,
  onDelete,
}: {
  section: EventSection
  onClose: () => void
  onSaved: () => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const meta = KIND_META[section.kind]
  const Icon = meta.icon

  const [title, setTitle] = useState(section.title ?? "")
  const [subtitle, setSubtitle] = useState(section.subtitle ?? "")
  const [body, setBody] = useState(section.body ?? "")
  const [imageUrl, setImageUrl] = useState<string | null>(section.image_url)
  const [videoUrl, setVideoUrl] = useState(section.video_url ?? "")
  const [ctaLabel, setCtaLabel] = useState(section.cta_label ?? "")
  const [ctaUrl, setCtaUrl] = useState(section.cta_url ?? "")
  const [dataJson, setDataJson] = useState(JSON.stringify(section.data ?? {}, null, 2))
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setErr(null)
    let parsed: Record<string, unknown> = {}
    try { parsed = JSON.parse(dataJson || "{}") } catch {
      setErr("Advanced data is not valid JSON")
      setSaving(false)
      return
    }
    const res = await updateEventSection(section.id, {
      title, subtitle, body,
      imageUrl: imageUrl ?? "",
      videoUrl, ctaLabel, ctaUrl,
      data: parsed,
    })
    setSaving(false)
    if (res.success) {
      setSavedAt(new Date().toLocaleTimeString())
      await onSaved()
    } else {
      setErr(res.error ?? "Save failed")
    }
  }

  const usesBody = ["rich_text", "hero"].includes(section.kind)
  const usesImage = ["hero", "gallery"].includes(section.kind)
  const usesVideo = section.kind === "video"
  const usesCta = ["hero", "cta_button", "tickets_cta"].includes(section.kind)
  const usesAdvanced = ["stats_row", "faqs", "gallery"].includes(section.kind)

  return (
    <>
      {/* Scrim */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      {/* Drawer */}
      <aside className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[480px] bg-white text-[#1a1a2e] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#e7ab1c]/15 flex items-center justify-center text-[#a37410] shrink-0">
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#888]">Editing</p>
              <h3 className="text-sm font-semibold truncate">{meta.label}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder={meta.label} />
          </Field>

          <Field label="Subtitle">
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={inputCls} placeholder="Optional — shown below title" />
          </Field>

          {usesBody && (
            <Field label="Body">
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6}
                className={`${inputCls} font-mono text-[13px] leading-relaxed resize-y`}
                placeholder="Paragraphs — blank lines for breaks." />
            </Field>
          )}

          {usesImage && (
            <ImageUploadCrop
              value={imageUrl}
              onChange={setImageUrl}
              aspectRatio={meta.imageAspect}
              folder="sections"
              label="Background image"
              help={`Best ratio: ${meta.imageAspect.toFixed(2)} · 5 MB max`}
            />
          )}

          {usesVideo && (
            <Field label="YouTube URL">
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={inputCls}
                placeholder="https://www.youtube.com/watch?v=..." />
            </Field>
          )}

          {usesCta && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Button label">
                <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className={inputCls} placeholder="Register Now" />
              </Field>
              <Field label="Button URL">
                <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} className={inputCls} placeholder="/register" />
              </Field>
            </div>
          )}

          {usesAdvanced && (
            <Field
              label={section.kind === "stats_row" ? "Stats (JSON)" : section.kind === "faqs" ? "FAQs (JSON)" : "Images (JSON)"}
              hint={
                section.kind === "stats_row"
                  ? `{ "stats": [{ "value": "30+", "label": "Countries" }] }`
                  : section.kind === "faqs"
                    ? `{ "faqs": [{ "q": "When?", "a": "15 March" }] }`
                    : `{ "images": ["https://..."] }`
              }
            >
              <textarea value={dataJson} onChange={(e) => setDataJson(e.target.value)} rows={6}
                className={`${inputCls} font-mono text-[12px] resize-y bg-gray-50`} />
            </Field>
          )}

          {["speakers_grid", "agenda", "sponsors_grid"].includes(section.kind) && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-[12px] text-blue-800">
              <strong>Auto-populated.</strong>
              {section.kind === "speakers_grid" && " Speakers live in Admin → Events → this event → Speakers tab."}
              {section.kind === "agenda" && " Sessions live in Admin → Events → this event → Sessions tab."}
              {section.kind === "sponsors_grid" && " Sponsors live in Admin → Events → this event → Sponsors tab."}
            </div>
          )}

          {err && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{err}</div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-white">
          <button
            onClick={() => onDelete(section.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={12} /> Delete
          </button>
          <div className="flex items-center gap-2">
            {savedAt && <span className="text-[11px] text-gray-400">Saved {savedAt}</span>}
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100">
              Close
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1a1a2e] text-white text-xs font-bold hover:bg-[#2a2a4e] disabled:opacity-60"
            >
              {saving ? <><Loader2 size={12} className="animate-spin" /> Saving</> : <><Save size={12} /> Save</>}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

const inputCls =
  "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#e7ab1c]/30 focus:border-[#e7ab1c]/50 transition-colors"

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-[#888] uppercase tracking-wider mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-[#aaa] mt-1 font-mono">{hint}</span>}
    </label>
  )
}
