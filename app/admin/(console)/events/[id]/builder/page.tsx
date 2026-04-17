"use client"

/**
 * ─── EVENT PAGE BUILDER (Backstage-style) ─────────────────────────────
 *
 * Layout:
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ top bar: back • title • LIVE • date │ device • live │ publish  │
 *   ├──────┬────────────────────────────────────────────────┬────────┤
 *   │ rail │ canvas (fast compact cards, live preview opt-in) │ inspector │
 *   └──────┴────────────────────────────────────────────────┴────────┘
 *
 * Perf:
 *   - Canvas defaults to compact mini-preview cards (no heavy public-site
 *     renderer). Live preview is an opt-in toggle that lazy-loads the
 *     full renderer.
 *   - SectionCard is React.memo'd; prop objects are stable via useMemo.
 *   - Move/delete/duplicate update local state optimistically — no full
 *     refetch after every action.
 *   - Drawer autosaves (debounced 700 ms). No Save button.
 */

import {
  useState, useEffect, useCallback, useMemo, useRef, memo, lazy, Suspense,
} from "react"
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
  reorderEventSections,
} from "@/app/actions/eventSectionActions"
import { SECTION_KINDS, type EventSection, type SectionKind } from "@/lib/event-sections"
import {
  ArrowLeft, ArrowUp, ArrowDown, Copy, Trash2, Plus, Eye, EyeOff, Loader2,
  ChevronDown, LayoutPanelTop, Type, BarChart3,
  Users, Clock, Ticket, Building2, PlayCircle, ImageIcon,
  MousePointerClick, HelpCircle, Layers, Palette, Search, Plug,
  Settings, X, Undo, Redo, Globe, Monitor, Tablet, Smartphone,
  FileText, History, Bell, Languages, Link2, Check, GripVertical, Sparkles, Keyboard,
} from "lucide-react"

/* Lazy-load the heavy public-site renderer — only when user opts into
 * live preview. Keeps initial canvas render < 16ms for typical events. */
const EventSectionsRendererLazy = lazy(() =>
  import("@/components/site/EventSections").then((m) => ({
    default: m.EventSectionsRenderer,
  }))
)

const sfFont = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

/* ── Section kind metadata ──────────────────────────────────────────── */
const KIND_META: Record<SectionKind, {
  label: string
  desc: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  imageAspect: number
}> = {
  hero:          { label: "Hero",          desc: "Banner with title, subtitle, CTA, background image", icon: LayoutPanelTop,     imageAspect: 16 / 9 },
  rich_text:     { label: "Rich Text",     desc: "Long-form about / description",                      icon: Type,               imageAspect: 0 },
  stats_row:     { label: "Stats Row",     desc: "Up to 4 headline metrics",                           icon: BarChart3,          imageAspect: 0 },
  speakers_grid: { label: "Speakers Grid", desc: "Auto-populates from event speakers",                 icon: Users,              imageAspect: 0 },
  agenda:        { label: "Agenda",        desc: "Auto-populates from event sessions",                 icon: Clock,              imageAspect: 0 },
  tickets_cta:   { label: "Tickets + CTA", desc: "Ticket tiers with Buy button",                       icon: Ticket,             imageAspect: 0 },
  sponsors_grid: { label: "Sponsors Grid", desc: "Auto-populates from event sponsors",                 icon: Building2,          imageAspect: 0 },
  video:         { label: "Video",         desc: "YouTube embed",                                      icon: PlayCircle,         imageAspect: 0 },
  gallery:       { label: "Gallery",       desc: "Image grid (paste URLs in data)",                    icon: ImageIcon,          imageAspect: 1 },
  cta_button:    { label: "CTA Button",    desc: "Centered call-to-action button",                     icon: MousePointerClick,  imageAspect: 0 },
  faqs:          { label: "FAQ",           desc: "Question + answer accordion",                        icon: HelpCircle,         imageAspect: 0 },
}

/* ── Left rail tabs ─────────────────────────────────────────────────── */
type RailTab = "sections" | "theme" | "pages" | "seo" | "integrations" | "settings"
const RAIL: Array<{ id: RailTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: "sections",     label: "Sections",     icon: Layers   },
  { id: "theme",        label: "Theme",        icon: Palette  },
  { id: "pages",        label: "Pages",        icon: FileText },
  { id: "seo",          label: "SEO",          icon: Search   },
  { id: "integrations", label: "Integrate",    icon: Plug     },
  { id: "settings",     label: "Settings",     icon: Settings },
]

/* ── Device preview viewport widths ─────────────────────────────────── */
const DEVICE_WIDTHS = { desktop: 1180, tablet: 820, mobile: 420 } as const
type Device = keyof typeof DEVICE_WIDTHS

/* ── Quick-start templates (one-click stacks) ───────────────────────── */
const TEMPLATES: Array<{
  id: string
  label: string
  desc: string
  kinds: SectionKind[]
}> = [
  {
    id: "standard",
    label: "Standard event",
    desc: "Hero → About → Speakers → Agenda → Tickets",
    kinds: ["hero", "rich_text", "speakers_grid", "agenda", "tickets_cta"],
  },
  {
    id: "conference",
    label: "Premium conference",
    desc: "Hero → Stats → About → Speakers → Agenda → Sponsors → Tickets → FAQ",
    kinds: ["hero", "stats_row", "rich_text", "speakers_grid", "agenda", "sponsors_grid", "tickets_cta", "faqs"],
  },
  {
    id: "launch",
    label: "Product / launch",
    desc: "Hero → Video → Stats → CTA",
    kinds: ["hero", "video", "stats_row", "cta_button"],
  },
]

/* ── Theme tokens (stub: persisted in localStorage per event) ───────── */
interface ThemeTokens {
  primary: string
  accent: string
  background: string
  text: string
  heading_font: "SF Pro" | "Inter" | "Playfair" | "Manrope" | "DM Serif"
  body_font: "SF Pro" | "Inter" | "Manrope" | "DM Sans"
  button_shape: "square" | "rounded" | "pill"
  scale: "compact" | "normal" | "large"
  radius: "sharp" | "soft" | "round"
}
const DEFAULT_THEME: ThemeTokens = {
  primary: "#e7ab1c",
  accent: "#1a1a2e",
  background: "#F4F8FF",
  text: "#1a1a2e",
  heading_font: "SF Pro",
  body_font: "SF Pro",
  button_shape: "rounded",
  scale: "normal",
  radius: "soft",
}

const FONT_STACKS: Record<ThemeTokens["heading_font"] | ThemeTokens["body_font"], string> = {
  "SF Pro":   "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
  "Inter":    "'Inter', system-ui, sans-serif",
  "Playfair": "'Playfair Display', Georgia, serif",
  "Manrope":  "'Manrope', system-ui, sans-serif",
  "DM Serif": "'DM Serif Display', Georgia, serif",
  "DM Sans":  "'DM Sans', system-ui, sans-serif",
}

const SCALE_MULT: Record<ThemeTokens["scale"], number> = { compact: 0.9, normal: 1, large: 1.15 }
const RADIUS_PX:  Record<ThemeTokens["radius"], string> = { sharp: "0px", soft: "12px", round: "24px" }

type EventMeta = {
  title: string
  slug: string
  status: string
  start_date: string | null
  end_date: string | null
  venue: string | null
  description: string | null
  cover_image_url: string | null
}

type SpeakerRow  = { id: string; name: string; designation: string | null; company: string | null; image_url: string | null }
type SessionRow  = { id: string; title: string; starts_at: string; ends_at: string | null; speaker_names: string[] | null; track: string | null }
type SponsorRow  = { id: string; name: string; logo_url: string | null; tier: string | null; website: string | null }
type TicketRow   = { id: string; name: string; description: string | null; price_inr: number; sold: number; inventory_limit: number | null }

/* ═════════════════════════════════════════════════════════════════════ */
/* ROOT                                                                  */
/* ═════════════════════════════════════════════════════════════════════ */

export default function EventBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const eventId = id as string
  const supabase = useMemo(() => createClient(), [])

  const [tab, setTab] = useState<RailTab>("sections")
  const [device, setDevice] = useState<Device>("desktop")
  const [livePreview, setLivePreview] = useState(false)

  const [eventMeta, setEventMeta] = useState<EventMeta>({
    title: "", slug: "", status: "", start_date: null, end_date: null, venue: null, description: null, cover_image_url: null,
  })
  const [sections, setSections] = useState<EventSection[]>([])
  const [speakers, setSpeakers] = useState<SpeakerRow[]>([])
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [sponsors, setSponsors] = useState<SponsorRow[]>([])
  const [tickets,  setTickets]  = useState<TicketRow[]>([])
  const [theme, setTheme]       = useState<ThemeTokens>(DEFAULT_THEME)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpenAt, setAddOpenAt] = useState<number | null>(null)
  const [editing, setEditing] = useState<EventSection | null>(null)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [publishPulse, setPublishPulse] = useState(false)
  const [publishState, setPublishState] = useState<"idle" | "publishing" | "done" | "error">("idle")
  const [inlineSaveState, setInlineSaveState] = useState<"idle" | "saving" | "saved">("idle")
  const [templating, setTemplating] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropAt, setDropAt] = useState<number | null>(null)

  /* ── Undo/redo history (content + order, local-only) ──────────────── */
  const pastRef   = useRef<EventSection[][]>([])
  const futureRef = useRef<EventSection[][]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const snapshot = useCallback((next: EventSection[]) => {
    pastRef.current = [...pastRef.current, sections].slice(-50) // cap stack
    futureRef.current = []
    setSections(next)
    setCanUndo(true)
    setCanRedo(false)
  }, [sections])
  const inlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Initial load (metadata + children in parallel) ──────────────── */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [evRes, secRes, sp, se, sn, tk] = await Promise.all([
        supabase.from("events").select("title, slug, status, start_date, end_date, venue, description, cover_image_url").eq("id", eventId).maybeSingle(),
        getEventSections(eventId),
        supabase.from("speakers").select("id, name, designation, company, image_url").eq("event_id", eventId).order("sort_order"),
        supabase.from("sessions").select("id, title, start_time, end_time, track").eq("event_id", eventId).order("start_time"),
        supabase.from("sponsors").select("id, name, logo_url, tier, website_url").eq("event_id", eventId).order("sort_order"),
        supabase.from("tickets").select("id, name, description, price_inr, sold, inventory_limit").eq("event_id", eventId).order("sort_order"),
      ])
      if (cancelled) return

      if (evRes.data) {
        const d = evRes.data as EventMeta
        setEventMeta({
          title: d.title ?? "Event",
          slug: d.slug ?? "",
          status: d.status ?? "",
          start_date: d.start_date ?? null,
          end_date: d.end_date ?? null,
          venue: d.venue ?? null,
          description: d.description ?? null,
          cover_image_url: d.cover_image_url ?? null,
        })
      }
      if (secRes.success) setSections(secRes.sections)
      else setError(secRes.error ?? "Failed to load sections")

      setSpeakers((sp.data ?? []) as SpeakerRow[])
      setSessions(
        ((se.data ?? []) as Array<{ id: string; title: string; start_time: string; end_time: string | null; track: string | null }>).map((s) => ({
          id: s.id, title: s.title, starts_at: s.start_time, ends_at: s.end_time, speaker_names: null, track: s.track,
        })),
      )
      setSponsors(
        ((sn.data ?? []) as Array<{ id: string; name: string; logo_url: string | null; tier: string | null; website_url: string | null }>).map((s) => ({
          id: s.id, name: s.name, logo_url: s.logo_url, tier: s.tier, website: s.website_url,
        })),
      )
      setTickets((tk.data ?? []) as TicketRow[])

      try {
        const stored = localStorage.getItem(`lf_theme_${eventId}`)
        if (stored) setTheme({ ...DEFAULT_THEME, ...JSON.parse(stored) })
      } catch { /* ignore */ }

      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [eventId, supabase])

  /* ── Mutations: optimistic local updates + background server call ─ */

  const markPending = useCallback((sid: string, on: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev)
      if (on) next.add(sid); else next.delete(sid)
      return next
    })
  }, [])

  const handleAdd = useCallback(async (kind: SectionKind) => {
    setAddOpenAt(null)
    const titleDefaults: Partial<Record<SectionKind, string>> = {
      hero: "Welcome", rich_text: "About the event", stats_row: "By the Numbers",
      speakers_grid: "Speakers", agenda: "Agenda", tickets_cta: "Reserve Your Seat",
      sponsors_grid: "Our Partners", video: "Highlights", gallery: "Gallery",
      cta_button: "Register Now", faqs: "Frequently Asked",
    }
    const data: Record<string, unknown> = {}
    if (kind === "stats_row") data.stats = [{ value: "30+", label: "Countries" }, { value: "500+", label: "CXOs" }]
    if (kind === "faqs") data.faqs = [{ q: "How do I register?", a: "Click the Register button above." }]
    if (kind === "gallery") data.images = []

    const res = await createEventSection({
      eventId, kind, title: titleDefaults[kind] ?? "", data,
    })
    if (res.success && res.section) {
      setSections((prev) => [...prev, res.section as EventSection])
    } else {
      setError(res.error ?? "Failed to add section")
    }
  }, [eventId])

  const handleMove = useCallback(async (sectionId: string, dir: "up" | "down") => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === sectionId)
      if (idx < 0) return prev
      const target = dir === "up" ? idx - 1 : idx + 1
      if (target < 0 || target >= prev.length) return prev
      const next = prev.slice()
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
    markPending(sectionId, true)
    const res = await moveEventSection(sectionId, dir)
    markPending(sectionId, false)
    if (!res.success) {
      setError(res.error ?? "Reorder failed")
      const fresh = await getEventSections(eventId)
      if (fresh.success) setSections(fresh.sections)
    }
  }, [eventId, markPending])

  const handleDelete = useCallback(async (sectionId: string) => {
    if (!confirm("Delete this section? This cannot be undone.")) return
    const snapshot = sections
    setSections((prev) => prev.filter((s) => s.id !== sectionId))
    if (editing?.id === sectionId) setEditing(null)
    const res = await deleteEventSection(sectionId)
    if (!res.success) {
      setSections(snapshot)
      setError(res.error ?? "Delete failed")
    }
  }, [sections, editing])

  const handleDuplicate = useCallback(async (sectionId: string) => {
    markPending(sectionId, true)
    const res = await duplicateEventSection(sectionId)
    markPending(sectionId, false)
    if (res.success) {
      const fresh = await getEventSections(eventId)
      if (fresh.success) setSections(fresh.sections)
    } else {
      setError(res.error ?? "Duplicate failed")
    }
  }, [eventId, markPending])

  /* ── Inline WYSIWYG edits from the preview ────────────────────────── */
  /* Debounced server save per-section. Local state updates immediately
   * so typing feels native, then 750 ms after the last keystroke we
   * flush to Supabase. */
  const pendingPatchesRef = useRef<Map<string, Partial<EventSection>>>(new Map())
  const flushInlineSaves = useCallback(async () => {
    const patches = pendingPatchesRef.current
    if (patches.size === 0) return
    setInlineSaveState("saving")
    const entries = Array.from(patches.entries())
    pendingPatchesRef.current = new Map()
    await Promise.all(entries.map(([id, patch]) =>
      updateEventSection(id, {
        ...(patch.title     !== undefined ? { title:     patch.title     ?? "" } : {}),
        ...(patch.subtitle  !== undefined ? { subtitle:  patch.subtitle  ?? "" } : {}),
        ...(patch.body      !== undefined ? { body:      patch.body      ?? "" } : {}),
        ...(patch.cta_label !== undefined ? { ctaLabel:  patch.cta_label ?? "" } : {}),
        ...(patch.image_url !== undefined ? { imageUrl:  patch.image_url ?? "" } : {}),
        ...((patch as { data?: Record<string, unknown> }).data !== undefined
          ? { data: (patch as { data?: Record<string, unknown> }).data }
          : {}),
      }),
    ))
    setInlineSaveState("saved")
    setTimeout(() => setInlineSaveState("idle"), 1200)
  }, [])
  const handleInlineEdit = useCallback((sectionId: string, patch: Partial<EventSection>) => {
    // 1. Snapshot current state for undo (before local mutation)
    pastRef.current = [...pastRef.current, sections].slice(-50)
    futureRef.current = []
    setCanUndo(true); setCanRedo(false)
    // 2. Apply local patch immediately
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)))
    // 3. Merge into pending server patches
    const existing = pendingPatchesRef.current.get(sectionId) ?? {}
    pendingPatchesRef.current.set(sectionId, { ...existing, ...patch })
    // 4. Debounced flush
    if (inlineTimerRef.current) clearTimeout(inlineTimerRef.current)
    inlineTimerRef.current = setTimeout(() => { void flushInlineSaves() }, 750)
  }, [sections, flushInlineSaves])

  /* ── Hide/show toggle (hover toolbar) ─────────────────────────────── */
  const handleToggleVisibility = useCallback(async (sectionId: string) => {
    let wasActive = true
    setSections((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s
      wasActive = s.is_active !== false
      return { ...s, is_active: !wasActive } as EventSection
    }))
    const res = await updateEventSection(sectionId, { isActive: !wasActive })
    if (!res.success) {
      setError(res.error ?? "Hide failed")
      setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, is_active: wasActive } as EventSection : s)))
    }
  }, [])

  /* ── Undo / redo ──────────────────────────────────────────────────── */
  const handleUndo = useCallback(() => {
    const prev = pastRef.current.pop()
    if (!prev) return
    futureRef.current = [sections, ...futureRef.current].slice(0, 50)
    setSections(prev)
    setCanUndo(pastRef.current.length > 0)
    setCanRedo(true)
    // Best-effort server resync for content changes
    void Promise.all(prev.map((s) => updateEventSection(s.id, {
      title: s.title ?? "", subtitle: s.subtitle ?? "", body: s.body ?? "",
      ctaLabel: s.cta_label ?? "", imageUrl: s.image_url ?? "",
    })))
    void reorderEventSections(eventId, prev.map((s) => s.id))
  }, [sections, eventId])
  const handleRedo = useCallback(() => {
    const next = futureRef.current.shift()
    if (!next) return
    pastRef.current = [...pastRef.current, sections].slice(-50)
    setSections(next)
    setCanUndo(true)
    setCanRedo(futureRef.current.length > 0)
    void Promise.all(next.map((s) => updateEventSection(s.id, {
      title: s.title ?? "", subtitle: s.subtitle ?? "", body: s.body ?? "",
      ctaLabel: s.cta_label ?? "", imageUrl: s.image_url ?? "",
    })))
    void reorderEventSections(eventId, next.map((s) => s.id))
  }, [sections, eventId])

  const handlePublish = useCallback(async () => {
    setPublishState("publishing")
    setPublishPulse(true)
    try {
      // Flush pending inline edits first
      if (inlineTimerRef.current) { clearTimeout(inlineTimerRef.current); inlineTimerRef.current = null }
      await flushInlineSaves()
      // Hit the public page to trigger Next.js ISR revalidation
      await fetch(`/events/${eventMeta.slug}?_refresh=${Date.now()}`, { cache: "no-store" })
      setPublishState("done")
    } catch {
      setPublishState("error")
    }
    setTimeout(() => { setPublishPulse(false); setPublishState("idle") }, 2200)
  }, [eventMeta.slug, flushInlineSaves])

  /* ── Keyboard shortcuts (defined after handlers) ──────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const target = e.target as HTMLElement | null
      const inField =
        target &&
        (target.tagName === "INPUT" ||
         target.tagName === "TEXTAREA" ||
         target.isContentEditable)
      if (e.key === "Escape") {
        if (addOpenAt !== null) { setAddOpenAt(null); return }
        if (editing) setEditing(null)
        if (inField && target) (target as HTMLElement).blur()
      } else if (mod && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault()
        handleUndo()
      } else if (mod && (e.shiftKey && e.key.toLowerCase() === "z" || e.key.toLowerCase() === "y")) {
        e.preventDefault()
        handleRedo()
      } else if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault()
        void handlePublish()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [addOpenAt, editing, handleUndo, handleRedo, handlePublish])

  const applyTemplate = useCallback(async (tpl: (typeof TEMPLATES)[number]) => {
    setTemplating(true)
    const created: EventSection[] = []
    for (const kind of tpl.kinds) {
      const titleDefaults: Partial<Record<SectionKind, string>> = {
        hero: "Welcome", rich_text: "About the event", stats_row: "By the Numbers",
        speakers_grid: "Speakers", agenda: "Agenda", tickets_cta: "Reserve Your Seat",
        sponsors_grid: "Our Partners", video: "Highlights", gallery: "Gallery",
        cta_button: "Register Now", faqs: "Frequently Asked",
      }
      const data: Record<string, unknown> = {}
      if (kind === "stats_row") data.stats = [{ value: "30+", label: "Countries" }, { value: "500+", label: "CXOs" }]
      if (kind === "faqs") data.faqs = [{ q: "How do I register?", a: "Click the Register button above." }]
      if (kind === "gallery") data.images = []
      const res = await createEventSection({ eventId, kind, title: titleDefaults[kind] ?? "", data })
      if (res.success && res.section) created.push(res.section as EventSection)
    }
    setSections((prev) => [...prev, ...created])
    setTemplating(false)
  }, [eventId])

  const onDragStart = useCallback((e: React.DragEvent, sid: string) => {
    setDragId(sid)
    e.dataTransfer.effectAllowed = "move"
    try { e.dataTransfer.setData("text/plain", sid) } catch { /* firefox needs setData to fire dragstart */ }
  }, [])

  const onDragOver = useCallback((e: React.DragEvent, overIndex: number) => {
    if (!dragId) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDropAt(overIndex)
  }, [dragId])

  const onDragEnd = useCallback(() => {
    setDragId(null)
    setDropAt(null)
  }, [])

  const onDrop = useCallback(async (e: React.DragEvent, insertIndex: number) => {
    e.preventDefault()
    const sid = dragId
    setDragId(null)
    setDropAt(null)
    if (!sid) return
    const fromIndex = sections.findIndex((s) => s.id === sid)
    if (fromIndex < 0) return
    // If dropping in the same slot (or just after itself), no-op.
    if (insertIndex === fromIndex || insertIndex === fromIndex + 1) return

    const next = sections.slice()
    const [moved] = next.splice(fromIndex, 1)
    const adjusted = insertIndex > fromIndex ? insertIndex - 1 : insertIndex
    next.splice(adjusted, 0, moved)
    setSections(next)

    const res = await reorderEventSections(eventId, next.map((s) => s.id))
    if (!res.success) {
      setError(res.error ?? "Reorder failed")
      const fresh = await getEventSections(eventId)
      if (fresh.success) setSections(fresh.sections)
    }
  }, [dragId, sections, eventId])

  /* ── Stable prop bag for SectionCard (prevents memo-busting) ─────── */
  const eventData = useMemo(() => ({
    id: eventId,
    slug: eventMeta.slug,
    title: eventMeta.title,
    start_date: eventMeta.start_date ?? new Date().toISOString(),
    end_date: eventMeta.end_date ?? null,
    venue: eventMeta.venue,
    description: eventMeta.description,
    cover_image_url: eventMeta.cover_image_url,
  }), [eventId, eventMeta])

  const isLive = eventMeta.status === "published"
  const dateLabel = eventMeta.start_date
    ? new Date(eventMeta.start_date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).toUpperCase()
    : ""

  const saveTheme = useCallback((next: ThemeTokens) => {
    setTheme(next)
    try { localStorage.setItem(`lf_theme_${eventId}`, JSON.stringify(next)) } catch { /* ignore */ }
  }, [eventId])

  /* ═════════════ RENDER ═══════════════════════════════════════════════ */
  const rootStyle = useMemo<React.CSSProperties>(() => ({
    ...sfFont,
    ["--lf-primary" as string]: theme.primary,
    ["--lf-accent" as string]: theme.accent,
    ["--lf-background" as string]: theme.background,
    ["--lf-text" as string]: theme.text,
    ["--lf-heading-font" as string]: FONT_STACKS[theme.heading_font],
    ["--lf-body-font" as string]: FONT_STACKS[theme.body_font],
    ["--lf-scale" as string]: String(SCALE_MULT[theme.scale]),
    ["--lf-radius" as string]: RADIUS_PX[theme.radius],
    ["--lf-btn-radius" as string]: theme.button_shape === "square" ? "0px" : theme.button_shape === "pill" ? "999px" : "8px",
  }), [theme])

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col text-white" style={rootStyle}>
      {/* ══════════════ TOP BAR ═════════════════════════════════════════ */}
      <header className="shrink-0 h-[52px] bg-[#111111] border-b border-[#1f1f1f] flex items-center px-4 gap-3">
        <Link href={`/admin/events/${eventId}`} className="p-1.5 rounded hover:bg-white/10 text-white/70" title="Back to event">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md bg-[#e7ab1c] flex items-center justify-center text-[#1a1a2e] text-[10px] font-black shrink-0">⚑</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-[14px] font-semibold truncate max-w-[360px]">{eventMeta.title || "Event"}</h1>
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

        <span className="hidden lg:inline-flex items-center gap-1 text-[10px] text-white/35 font-mono">
          <Keyboard size={11} /> ⌘S Publish · Esc close
        </span>

        {/* Device preview toggle */}
        <div className="hidden sm:flex items-center bg-[#1a1a1a] border border-white/10 rounded-md overflow-hidden">
          {(["desktop", "tablet", "mobile"] as Device[]).map((d) => {
            const Icon = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone
            return (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`p-1.5 transition-colors ${device === d ? "bg-white/10 text-[#e7ab1c]" : "text-white/50 hover:text-white"}`}
                title={d.charAt(0).toUpperCase() + d.slice(1)}
              >
                <Icon size={13} />
              </button>
            )
          })}
        </div>

        {/* Live preview toggle */}
        <button
          onClick={() => setLivePreview((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold border transition-colors ${
            livePreview
              ? "bg-[#e7ab1c]/15 text-[#e7ab1c] border-[#e7ab1c]/40"
              : "bg-transparent text-white/60 border-white/10 hover:text-white"
          }`}
          title="Render actual website components on the canvas (slower)"
        >
          {livePreview ? <Eye size={12} /> : <EyeOff size={12} />}
          Live
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button
          disabled={!canUndo}
          onClick={handleUndo}
          title="Undo (⌘Z)"
          className="p-1.5 rounded text-white/70 hover:text-white hover:bg-white/10 disabled:text-white/20 disabled:hover:bg-transparent"
        ><Undo size={14} /></button>
        <button
          disabled={!canRedo}
          onClick={handleRedo}
          title="Redo (⌘⇧Z)"
          className="p-1.5 rounded text-white/70 hover:text-white hover:bg-white/10 disabled:text-white/20 disabled:hover:bg-transparent"
        ><Redo size={14} /></button>
        {inlineSaveState !== "idle" && (
          <span className={`ml-1 text-[10px] font-semibold ${inlineSaveState === "saved" ? "text-emerald-400" : "text-white/50"}`}>
            {inlineSaveState === "saving" ? "Saving…" : "✓ Saved"}
          </span>
        )}

        <div className="w-px h-5 bg-white/10 mx-1" />

        {eventMeta.slug && (
          <Link href={`/events/${eventMeta.slug}`} target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold text-white/80 hover:text-white hover:bg-white/10">
            <Globe size={13} /> Preview site
          </Link>
        )}
        <button
          onClick={handlePublish}
          disabled={publishState === "publishing"}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-bold transition-all ${
            publishState === "done"  ? "bg-emerald-500 text-white" :
            publishState === "error" ? "bg-red-500 text-white" :
            publishPulse             ? "bg-emerald-500 text-white" :
                                        "bg-[#e7ab1c] text-[#1a1a2e] hover:bg-[#d49c10]"
          }`}
        >
          {publishState === "publishing" && <Loader2 size={12} className="animate-spin" />}
          {publishState === "publishing" ? "Publishing…" :
           publishState === "done"       ? "✓ Published" :
           publishState === "error"      ? "Retry" : "Publish"}
        </button>
      </header>

      {/* ══════════════ MAIN ROW ════════════════════════════════════════ */}
      <div className="flex-1 flex min-h-0">
        {/* ───── LEFT RAIL ───────────────────────────────────────────── */}
        <aside className="shrink-0 w-[64px] bg-[#111111] border-r border-[#1f1f1f] flex flex-col items-center py-4 gap-1">
          {RAIL.map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? "bg-white/10 text-[#e7ab1c]" : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
                title={item.label}
              >
                <Icon size={15} />
                <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
              </button>
            )
          })}
        </aside>

        {/* ───── RAIL PANEL + CANVAS ─────────────────────────────────── */}
        {tab !== "sections" && (
          <RailPanel
            tab={tab}
            theme={theme}
            onThemeChange={saveTheme}
            eventMeta={eventMeta}
            sections={sections}
          />
        )}

        <main className="flex-1 overflow-y-auto bg-[#0a0a0a]">
          {error && (
            <div className="max-w-[1100px] mt-4 mx-auto px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-200 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-3 underline">dismiss</button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24 text-white/40">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : (
            <div
              className="mx-auto py-8 px-4 space-y-0 transition-[max-width] duration-200"
              style={{
                maxWidth: DEVICE_WIDTHS[device],
                // subtle tint of the theme background so page-bg changes are visible between cards
                ["--canvas-tint" as string]: "color-mix(in srgb, var(--lf-background, #F4F8FF) 18%, #0a0a0a)",
                background: "var(--canvas-tint)",
                borderRadius: 10,
              }}
            >
              <div className="mb-3 px-1 text-[11px] text-white/50 uppercase tracking-wider flex items-center justify-between">
                <span>
                  {livePreview
                    ? "Live preview — what visitors see"
                    : "Click any text to edit · hover between cards to insert · theme panel on the left"}
                </span>
                <span className="text-white/30 font-mono">{sections.length} section{sections.length === 1 ? "" : "s"}</span>
              </div>

              <DropZone index={0} active={dropAt === 0 && dragId !== null} onOver={onDragOver} onDrop={onDrop} />
              <InlineAddButton open={addOpenAt === 0} onToggle={() => setAddOpenAt(addOpenAt === 0 ? null : 0)} onPick={handleAdd} />

              {sections.length === 0 ? (
                <EmptyHint
                  templating={templating}
                  onStart={() => setAddOpenAt(0)}
                  onApplyTemplate={applyTemplate}
                />
              ) : (
                sections.map((s, i) => (
                  <SectionRow
                    key={s.id}
                    section={s}
                    index={i}
                    total={sections.length}
                    busy={pendingIds.has(s.id)}
                    livePreview={livePreview}
                    eventData={eventData}
                    speakers={speakers}
                    sessions={sessions}
                    sponsors={sponsors}
                    tickets={tickets}
                    editing={editing?.id === s.id}
                    dragging={dragId === s.id}
                    dropOver={dropAt === i + 1 && dragId !== null && dragId !== s.id}
                    onEdit={setEditing}
                    onMove={handleMove}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onToggleVisibility={handleToggleVisibility}
                    onInlineEdit={handleInlineEdit}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onDragEnd={onDragEnd}
                    addOpen={addOpenAt === i + 1}
                    onAddToggle={() => setAddOpenAt(addOpenAt === i + 1 ? null : i + 1)}
                    onAddPick={handleAdd}
                  />
                ))
              )}
            </div>
          )}
        </main>
      </div>

    </div>
  )
}

/* ═════════════════════════════════════════════════════════════════════ */
/* SECTION ROW (card + inline add below)                                 */
/* ═════════════════════════════════════════════════════════════════════ */

const SectionRow = memo(function SectionRow(props: {
  section: EventSection
  index: number
  total: number
  busy: boolean
  livePreview: boolean
  eventData: Parameters<typeof SectionCard>[0]["eventData"]
  speakers: SpeakerRow[]
  sessions: SessionRow[]
  sponsors: SponsorRow[]
  tickets: TicketRow[]
  editing: boolean
  dragging: boolean
  dropOver: boolean
  onEdit: (s: EventSection) => void
  onMove: (id: string, dir: "up" | "down") => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onToggleVisibility: (id: string) => void
  onInlineEdit: (id: string, patch: Partial<EventSection>) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  addOpen: boolean
  onAddToggle: () => void
  onAddPick: (k: SectionKind) => void
}) {
  const {
    section, index, total, busy, livePreview, eventData,
    speakers, sessions, sponsors, tickets, editing, dragging, dropOver,
    onEdit, onMove, onDelete, onDuplicate, onToggleVisibility, onInlineEdit,
    onDragStart, onDragOver, onDrop, onDragEnd,
    addOpen, onAddToggle, onAddPick,
  } = props
  return (
    <>
      <SectionCard
        section={section}
        index={index}
        total={total}
        busy={busy}
        livePreview={livePreview}
        editing={editing}
        dragging={dragging}
        eventData={eventData}
        speakers={speakers}
        sessions={sessions}
        sponsors={sponsors}
        tickets={tickets}
        onEdit={onEdit}
        onMove={onMove}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onToggleVisibility={onToggleVisibility}
        onInlineEdit={onInlineEdit}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
      <DropZone index={index + 1} active={dropOver} onOver={onDragOver} onDrop={onDrop} />
      <InlineAddButton open={addOpen} onToggle={onAddToggle} onPick={onAddPick} />
    </>
  )
})

/* ═════════════════════════════════════════════════════════════════════ */
/* DROP ZONE (thin strip that lights up when dragging over)              */
/* ═════════════════════════════════════════════════════════════════════ */

const DropZone = memo(function DropZone({
  index, active, onOver, onDrop,
}: {
  index: number
  active: boolean
  onOver: (e: React.DragEvent, index: number) => void
  onDrop: (e: React.DragEvent, index: number) => void
}) {
  return (
    <div
      onDragOver={(e) => onOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className={`h-2 my-0.5 rounded-full transition-all ${
        active ? "bg-[#e7ab1c] h-3" : "bg-transparent"
      }`}
    />
  )
})

/* ═════════════════════════════════════════════════════════════════════ */
/* SECTION CARD (compact + optional live render)                         */
/* ═════════════════════════════════════════════════════════════════════ */

const SectionCard = memo(function SectionCard(props: {
  section: EventSection
  index: number
  total: number
  busy: boolean
  livePreview: boolean
  editing: boolean
  dragging: boolean
  eventData: { id: string; slug: string; title: string; start_date: string; end_date: string | null; venue: string | null; description: string | null; cover_image_url: string | null }
  speakers: SpeakerRow[]
  sessions: SessionRow[]
  sponsors: SponsorRow[]
  tickets: TicketRow[]
  onEdit: (s: EventSection) => void
  onMove: (id: string, dir: "up" | "down") => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onToggleVisibility: (id: string) => void
  onInlineEdit: (id: string, patch: Partial<EventSection>) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
}) {
  const {
    section: s, index, total, busy, livePreview, editing, dragging, eventData,
    speakers, sessions, sponsors, tickets,
    onEdit, onMove, onDelete, onDuplicate, onToggleVisibility, onInlineEdit,
    onDragStart, onDragEnd,
  } = props
  const meta = KIND_META[s.kind]
  const Icon = meta.icon
  const onlineSections = useMemo(() => [s], [s])
  const hidden = s.is_active === false

  return (
    <div
      className={`group relative rounded-xl overflow-hidden border-2 transition-colors shadow-[0_0_0_1px_rgba(255,255,255,0.05)] ${
        editing ? "border-[#e7ab1c]" : "border-transparent hover:border-[#e7ab1c]/60"
      } ${dragging ? "opacity-50" : ""} ${hidden ? "opacity-50" : ""}`}
      style={{ background: "var(--lf-background, #ffffff)" }}
    >
      {livePreview ? (
        <div className="pointer-events-none">
          <Suspense fallback={<div className="h-[120px] bg-gray-100 animate-pulse" />}>
            <EventSectionsRendererLazy
              sections={onlineSections}
              event={eventData}
              speakers={speakers}
              sessions={sessions}
              sponsors={sponsors}
              tickets={tickets}
            />
          </Suspense>
        </div>
      ) : (
        <MiniPreview section={s} onInlineEdit={(patch) => onInlineEdit(s.id, patch)} />
      )}

      {/* Drag handle (left edge, vertical center) */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, s.id)}
        onDragEnd={onDragEnd}
        onClick={(e) => e.stopPropagation()}
        title="Drag to reorder"
        className="absolute top-2 left-[160px] opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-md bg-[#1a1a1a]/90 backdrop-blur border border-white/10 text-white/70 hover:text-white hover:bg-[#2a2a2a] flex items-center justify-center cursor-grab active:cursor-grabbing z-20"
      >
        <GripVertical size={12} />
      </div>

      {/* Controls (top-right) */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20" onClick={(e) => e.stopPropagation()}>
        <button disabled={busy || index === 0} onClick={() => onMove(s.id, "up")} title="Move up"
          className="w-7 h-7 rounded-md bg-[#1a1a1a]/90 backdrop-blur border border-white/10 text-white/80 hover:text-white hover:bg-[#2a2a2a] disabled:opacity-30 flex items-center justify-center">
          <ArrowUp size={12} />
        </button>
        <button disabled={busy || index === total - 1} onClick={() => onMove(s.id, "down")} title="Move down"
          className="w-7 h-7 rounded-md bg-[#1a1a1a]/90 backdrop-blur border border-white/10 text-white/80 hover:text-white hover:bg-[#2a2a2a] disabled:opacity-30 flex items-center justify-center">
          <ArrowDown size={12} />
        </button>
        <button disabled={busy} onClick={() => onDuplicate(s.id)} title="Duplicate"
          className="w-7 h-7 rounded-md bg-[#1a1a1a]/90 backdrop-blur border border-white/10 text-white/80 hover:text-white hover:bg-[#2a2a2a] disabled:opacity-30 flex items-center justify-center">
          <Copy size={12} />
        </button>
        <button disabled={busy} onClick={() => onToggleVisibility(s.id)} title={hidden ? "Show" : "Hide"}
          className={`w-7 h-7 rounded-md bg-[#1a1a1a]/90 backdrop-blur border border-white/10 hover:bg-[#2a2a2a] disabled:opacity-30 flex items-center justify-center ${hidden ? "text-amber-300" : "text-white/80 hover:text-white"}`}>
          {hidden ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
        <button disabled={busy} onClick={() => onDelete(s.id)} title="Delete"
          className="w-7 h-7 rounded-md bg-red-500/15 backdrop-blur border border-red-500/30 text-red-300 hover:bg-red-500/25 disabled:opacity-30 flex items-center justify-center">
          <Trash2 size={12} />
        </button>
      </div>

      {/* Label (top-left) */}
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
})

/* ═════════════════════════════════════════════════════════════════════ */
/* MINI PREVIEW (lightweight)                                            */
/* ═════════════════════════════════════════════════════════════════════ */

/* ── Editable text helper: click-to-edit in the preview, blur to save ──
 *
 * multiline=true → block element, Enter inserts a newline, commit uses
 * innerText (preserves line breaks). Otherwise Enter blurs.
 */
function Editable({
  value, onCommit, placeholder, as: Tag = "span", className, style, multiline = false,
}: {
  value: string
  onCommit: (v: string) => void
  placeholder?: string
  as?: "span" | "h1" | "h2" | "h3" | "p" | "div"
  className?: string
  style?: React.CSSProperties
  multiline?: boolean
}) {
  const ref = useRef<HTMLElement | null>(null)
  const lastCommitted = useRef(value)
  const readOut = () =>
    multiline
      ? ((ref.current as HTMLElement | null)?.innerText ?? "")
      : ((ref.current as HTMLElement | null)?.textContent ?? "")
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const cur = multiline ? el.innerText : el.textContent
    if (cur !== value) {
      if (multiline) el.innerText = value
      else el.textContent = value
    }
    lastCommitted.current = value
  }, [value, multiline])
  const commit = () => {
    const next = readOut().replace(/\s+$/g, "")
    if (next !== lastCommitted.current) {
      lastCommitted.current = next
      onCommit(next)
    }
  }
  return (
    <Tag
      ref={ref as React.Ref<never>}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder}
      onFocus={(e: React.FocusEvent) => e.stopPropagation()}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
      onBlur={commit}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && !multiline) {
          e.preventDefault()
          ;(e.target as HTMLElement).blur()
        }
        if (e.key === "Escape") {
          if (ref.current) {
            if (multiline) (ref.current as HTMLElement).innerText = lastCommitted.current
            else ref.current.textContent = lastCommitted.current
          }
          ;(e.target as HTMLElement).blur()
        }
      }}
      className={`outline-none focus:ring-2 focus:ring-[#e7ab1c]/60 focus:bg-white/20 rounded px-1 -mx-1 cursor-text [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:opacity-40 ${className ?? ""}`}
      style={style}
    />
  )
}

const MiniPreview = memo(function MiniPreview({
  section: s, onInlineEdit,
}: { section: EventSection; onInlineEdit: (patch: Partial<EventSection>) => void }) {
  switch (s.kind) {
    case "hero":
      return (
        <div
          className="relative min-h-[220px] p-8 flex flex-col justify-end overflow-hidden"
          style={{
            background: s.image_url
              ? undefined
              : "linear-gradient(135deg, var(--lf-accent, #1a1a2e), color-mix(in srgb, var(--lf-accent, #1a1a2e) 80%, black))",
            fontFamily: "var(--lf-body-font, inherit)",
          }}
        >
          {s.image_url && <Image src={s.image_url} alt="" fill sizes="(max-width: 1100px) 100vw, 1100px" className="object-cover opacity-60" />}
          <div className="relative z-10">
            <Editable
              as="h3"
              value={s.title ?? ""}
              onCommit={(v) => onInlineEdit({ title: v })}
              placeholder="Event title"
              className="text-white font-bold block"
              style={{ fontFamily: "var(--lf-heading-font, inherit)", fontSize: "calc(1.75rem * var(--lf-scale, 1))", lineHeight: 1.15 }}
            />
            <Editable
              as="p"
              value={s.subtitle ?? ""}
              onCommit={(v) => onInlineEdit({ subtitle: v })}
              placeholder="Subtitle · date · venue"
              className="text-white/80 mt-1 max-w-lg block"
              style={{ fontSize: "calc(0.9rem * var(--lf-scale, 1))" }}
            />
            <Editable
              as="span"
              value={s.cta_label ?? ""}
              onCommit={(v) => onInlineEdit({ cta_label: v })}
              placeholder="+ button label"
              className="inline-block mt-3 px-4 py-1.5 text-xs font-bold"
              style={{ background: "var(--lf-primary, #e7ab1c)", color: "var(--lf-accent, #1a1a2e)", borderRadius: "var(--lf-btn-radius, 8px)" }}
            />
          </div>
        </div>
      )
    case "rich_text":
      return (
        <div
          className="p-6"
          style={{
            background: "var(--lf-background, #ffffff)",
            color: "var(--lf-text, #1a1a2e)",
            fontFamily: "var(--lf-body-font, inherit)",
          }}
        >
          <Editable
            as="h3"
            value={s.title ?? ""}
            onCommit={(v) => onInlineEdit({ title: v })}
            placeholder="Section heading"
            className="font-bold block"
            style={{ fontFamily: "var(--lf-heading-font, inherit)", fontSize: "calc(1.25rem * var(--lf-scale, 1))", color: "var(--lf-text, #1a1a2e)" }}
          />
          <Editable
            as="p"
            value={s.subtitle ?? ""}
            onCommit={(v) => onInlineEdit({ subtitle: v })}
            placeholder="EYEBROW / KICKER"
            className="text-xs font-semibold uppercase tracking-wider mt-1 block"
            style={{ color: "var(--lf-primary, #e7ab1c)" }}
          />
          <Editable
            as="div"
            multiline
            value={s.body ?? ""}
            onCommit={(v) => onInlineEdit({ body: v })}
            placeholder="Body paragraph — click to edit. Enter for new line."
            className="text-sm mt-2 whitespace-pre-wrap block leading-relaxed"
            style={{
              fontSize: "calc(0.875rem * var(--lf-scale, 1))",
              color: "color-mix(in srgb, var(--lf-text, #1a1a2e) 75%, transparent)",
            }}
          />
        </div>
      )
    case "stats_row": {
      const stats = ((s.data as Record<string, unknown>)?.stats as Array<{ value: string; label: string }>) ?? []
      const updateStat = (idx: number, key: "value" | "label", v: string) => {
        const next = stats.slice()
        next[idx] = { ...next[idx], [key]: v }
        onInlineEdit({ data: { ...(s.data as Record<string, unknown> ?? {}), stats: next } as never })
      }
      const addStat = () => {
        const next = [...stats, { value: "0", label: "New" }]
        onInlineEdit({ data: { ...(s.data as Record<string, unknown> ?? {}), stats: next } as never })
      }
      return (
        <div
          className="p-6"
          style={{
            background: "var(--lf-background, #F4F8FF)",
            color: "var(--lf-text, #1a1a2e)",
            fontFamily: "var(--lf-body-font, inherit)",
          }}
        >
          <Editable as="h3" value={s.title ?? ""} onCommit={(v) => onInlineEdit({ title: v })}
            placeholder="By the numbers" className="font-bold text-center block"
            style={{ fontFamily: "var(--lf-heading-font, inherit)", fontSize: "calc(1rem * var(--lf-scale, 1))", color: "var(--lf-text, #1a1a2e)" }} />
          <div className="grid grid-cols-4 gap-4 mt-4">
            {stats.slice(0, 4).map((st, i) => (
              <div key={i} className="text-center">
                <Editable as="div" value={st.value} onCommit={(v) => updateStat(i, "value", v)}
                  placeholder="42+" className="text-2xl font-bold"
                  style={{ color: "var(--lf-primary, #e7ab1c)" }} />
                <Editable as="div" value={st.label} onCommit={(v) => updateStat(i, "label", v)}
                  placeholder="label" className="text-[10px] uppercase tracking-wider"
                  style={{ color: "color-mix(in srgb, var(--lf-text, #1a1a2e) 60%, transparent)" }} />
              </div>
            ))}
            {stats.length < 4 && (
              <button
                onClick={(e) => { e.stopPropagation(); addStat() }}
                className="col-span-1 aspect-square min-h-[60px] rounded border-2 border-dashed border-[#e7ab1c]/50 text-[#e7ab1c] text-xs font-semibold hover:bg-[#e7ab1c]/5 transition-colors flex items-center justify-center gap-1"
              >
                <Plus size={12} /> Stat
              </button>
            )}
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
        <div
          className="p-8"
          style={{
            background: "color-mix(in srgb, var(--lf-background, #ffffff) 96%, black)",
            color: "var(--lf-text, #1a1a2e)",
            fontFamily: "var(--lf-body-font, inherit)",
          }}
        >
          <Editable as="h3" value={s.title ?? ""} onCommit={(v) => onInlineEdit({ title: v })}
            placeholder={KIND_META[s.kind].label} className="font-bold text-center block"
            style={{ fontFamily: "var(--lf-heading-font, inherit)", fontSize: "calc(1rem * var(--lf-scale, 1))", color: "var(--lf-text, #1a1a2e)" }} />
          <Editable as="p" value={s.subtitle ?? ""} onCommit={(v) => onInlineEdit({ subtitle: v })}
            placeholder="Optional subtitle" className="text-xs text-center mt-1 block"
            style={{ color: "color-mix(in srgb, var(--lf-text, #1a1a2e) 60%, transparent)" }} />
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-100 font-medium">
              Auto-populated from event data
            </span>
          </div>
        </div>
      )
    case "video":
      return (
        <div className="p-8 bg-[#0a0a0a] text-white" style={{ fontFamily: "var(--lf-body-font, inherit)" }}>
          <Editable as="h3" value={s.title ?? ""} onCommit={(v) => onInlineEdit({ title: v })}
            placeholder="Video" className="font-bold text-center block"
            style={{ fontFamily: "var(--lf-heading-font, inherit)", fontSize: "calc(1rem * var(--lf-scale, 1))" }} />
          <div className="mt-4 aspect-video max-w-xs mx-auto rounded-lg bg-white/5 flex items-center justify-center">
            <PlayCircle size={32} className="text-[#e7ab1c]" />
          </div>
          {s.video_url && <p className="text-[10px] text-white/40 text-center mt-2 truncate">{s.video_url}</p>}
        </div>
      )
    case "gallery": {
      const images = ((s.data as Record<string, unknown>)?.images as string[]) ?? []
      return (
        <div
          className="p-6"
          style={{
            background: "var(--lf-background, #ffffff)",
            color: "var(--lf-text, #1a1a2e)",
            fontFamily: "var(--lf-body-font, inherit)",
          }}
        >
          <Editable as="h3" value={s.title ?? ""} onCommit={(v) => onInlineEdit({ title: v })}
            placeholder="Gallery" className="font-bold text-center block"
            style={{ fontFamily: "var(--lf-heading-font, inherit)", fontSize: "calc(1rem * var(--lf-scale, 1))", color: "var(--lf-text, #1a1a2e)" }} />
          <div className="grid grid-cols-4 gap-2 mt-4 max-w-xs mx-auto">
            {(images.length ? images.slice(0, 4) : [null, null, null, null]).map((img, i) => (
              <div key={i} className="aspect-square rounded bg-[#F4F8FF] overflow-hidden relative">
                {img && <Image src={img} alt="" fill sizes="120px" className="object-cover" />}
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "cta_button":
      return (
        <div
          className="p-10 text-center"
          style={{
            background: "var(--lf-background, #ffffff)",
            color: "var(--lf-text, #1a1a2e)",
            fontFamily: "var(--lf-body-font, inherit)",
          }}
        >
          <Editable as="h3" value={s.title ?? ""} onCommit={(v) => onInlineEdit({ title: v })}
            placeholder="Call to action" className="font-bold block"
            style={{ fontFamily: "var(--lf-heading-font, inherit)", fontSize: "calc(1.25rem * var(--lf-scale, 1))", color: "var(--lf-text, #1a1a2e)" }} />
          <Editable as="p" value={s.subtitle ?? ""} onCommit={(v) => onInlineEdit({ subtitle: v })}
            placeholder="Supporting line" className="text-sm mt-1 block"
            style={{ color: "color-mix(in srgb, var(--lf-text, #1a1a2e) 60%, transparent)" }} />
          <Editable as="span" value={s.cta_label ?? ""} onCommit={(v) => onInlineEdit({ cta_label: v })}
            placeholder="+ button label"
            className="inline-block mt-4 px-6 py-2 text-sm font-bold"
            style={{ background: "var(--lf-primary, #e7ab1c)", color: "var(--lf-accent, #1a1a2e)", borderRadius: "var(--lf-btn-radius, 8px)" }} />
        </div>
      )
    default:
      return <div className="p-4 text-white/50 text-sm">Unknown section</div>
  }
})

/* ═════════════════════════════════════════════════════════════════════ */
/* INLINE ADD BUTTON                                                     */
/* ═════════════════════════════════════════════════════════════════════ */

const InlineAddButton = memo(function InlineAddButton({
  open, onToggle, onPick,
}: { open: boolean; onToggle: () => void; onPick: (kind: SectionKind) => void }) {
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
})

/* ═════════════════════════════════════════════════════════════════════ */
/* EMPTY HINT                                                            */
/* ═════════════════════════════════════════════════════════════════════ */

function EmptyHint({
  templating, onStart, onApplyTemplate,
}: {
  templating: boolean
  onStart: () => void
  onApplyTemplate: (t: (typeof TEMPLATES)[number]) => void
}) {
  return (
    <div className="py-16 px-6 border border-dashed border-white/15 rounded-2xl bg-white/[0.02]">
      <div className="text-center">
        <Sparkles size={28} className="mx-auto text-[#e7ab1c] mb-3" />
        <h3 className="text-base font-semibold text-white">Start with a template</h3>
        <p className="text-sm text-white/50 mt-1 max-w-md mx-auto">
          Pick a stack below to scaffold a full event page in one click — every section is editable right after.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 max-w-3xl mx-auto">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            disabled={templating}
            onClick={() => onApplyTemplate(t)}
            className="text-left p-4 rounded-xl border border-white/10 bg-[#141414] hover:border-[#e7ab1c]/50 hover:bg-[#1a1a1a] transition-all disabled:opacity-50 disabled:cursor-wait"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#e7ab1c]">{t.label}</span>
              {templating ? <Loader2 size={12} className="text-white/40 animate-spin" /> : <Plus size={12} className="text-white/40" />}
            </div>
            <p className="text-[12px] text-white/70 leading-snug">{t.desc}</p>
            <p className="text-[10px] text-white/40 mt-2">{t.kinds.length} sections</p>
          </button>
        ))}
      </div>

      <div className="text-center mt-6">
        <button onClick={onStart} className="text-[11px] font-semibold text-white/50 hover:text-white underline">
          or start from scratch
        </button>
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════════════════════════════ */
/* RAIL PANEL (Theme / Pages / SEO / Integrations / Settings)            */
/* ═════════════════════════════════════════════════════════════════════ */

function RailPanel({
  tab, theme, onThemeChange, eventMeta, sections,
}: {
  tab: RailTab
  theme: ThemeTokens
  onThemeChange: (t: ThemeTokens) => void
  eventMeta: EventMeta
  sections: EventSection[]
}) {
  return (
    <section className="shrink-0 w-[280px] bg-[#141414] border-r border-[#1f1f1f] overflow-y-auto">
      {tab === "theme"        && <ThemePanel theme={theme} onChange={onThemeChange} />}
      {tab === "pages"        && <PagesPanel eventMeta={eventMeta} sectionCount={sections.length} />}
      {tab === "seo"          && <SEOPanel eventMeta={eventMeta} />}
      {tab === "integrations" && <IntegrationsPanel />}
      {tab === "settings"     && <SettingsPanel />}
    </section>
  )
}

/* ─── THEME ─────────────────────────────────────────────────────────── */
function ThemePanel({ theme, onChange }: { theme: ThemeTokens; onChange: (t: ThemeTokens) => void }) {
  const set = <K extends keyof ThemeTokens>(k: K, v: ThemeTokens[K]) => onChange({ ...theme, [k]: v })
  const COLOR_KEYS: Array<"primary" | "accent" | "background" | "text"> = ["primary", "accent", "background", "text"]
  const PRESETS: Array<{ id: string; label: string; theme: Partial<ThemeTokens> }> = [
    { id: "gold",     label: "Gold & Indigo", theme: { primary: "#e7ab1c", accent: "#1a1a2e", background: "#F4F8FF", text: "#1a1a2e" } },
    { id: "emerald",  label: "Emerald",       theme: { primary: "#10b981", accent: "#064e3b", background: "#ecfdf5", text: "#0b3b2e" } },
    { id: "rose",     label: "Rose",          theme: { primary: "#f43f5e", accent: "#881337", background: "#fff1f2", text: "#4c0519" } },
    { id: "mono",     label: "Monochrome",    theme: { primary: "#111111", accent: "#000000", background: "#ffffff", text: "#111111" } },
    { id: "azure",    label: "Azure",         theme: { primary: "#2563eb", accent: "#1e3a8a", background: "#eff6ff", text: "#0f172a" } },
  ]
  return (
    <div className="p-4 space-y-5">
      <PanelHeader icon={Palette} title="Theme" subtitle="Tokens cascade into every section via CSS vars. Edits preview instantly." />

      <div className="space-y-2">
        <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Preset</h4>
        <div className="grid grid-cols-5 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ ...theme, ...p.theme })}
              title={p.label}
              className="aspect-square rounded-md border border-white/10 hover:border-white/40 overflow-hidden relative"
              style={{ background: p.theme.background }}
            >
              <div className="absolute inset-1 rounded" style={{ background: p.theme.accent }} />
              <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full" style={{ background: p.theme.primary }} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Colors</h4>
        {COLOR_KEYS.map((key) => (
          <label key={key} className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-white/70 capitalize">{key}</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme[key]}
                onChange={(e) => set(key, e.target.value)}
                className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={theme[key]}
                onChange={(e) => set(key, e.target.value)}
                className="w-20 px-2 py-1 bg-[#0a0a0a] border border-white/10 rounded text-[11px] text-white/80 font-mono"
              />
            </div>
          </label>
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Typography</h4>
        <Select label="Heading font" value={theme.heading_font}
          onChange={(v) => set("heading_font", v as ThemeTokens["heading_font"])}
          options={["SF Pro", "Inter", "Playfair", "Manrope", "DM Serif"]} />
        <Select label="Body font" value={theme.body_font}
          onChange={(v) => set("body_font", v as ThemeTokens["body_font"])}
          options={["SF Pro", "Inter", "Manrope", "DM Sans"]} />
        <div>
          <span className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">Text scale</span>
          <div className="grid grid-cols-3 gap-2">
            {(["compact", "normal", "large"] as const).map((sc) => (
              <button key={sc} onClick={() => set("scale", sc)}
                className={`py-2 text-[10px] font-bold uppercase tracking-wider border rounded-md transition-colors ${
                  theme.scale === sc ? "bg-[#e7ab1c] text-[#1a1a2e] border-[#e7ab1c]" : "bg-transparent text-white/60 border-white/10 hover:text-white"
                }`}>{sc}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Buttons &amp; corners</h4>
        <div>
          <span className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">Button shape</span>
          <div className="grid grid-cols-3 gap-2">
            {(["square", "rounded", "pill"] as const).map((shape) => (
              <button
                key={shape}
                onClick={() => set("button_shape", shape)}
                className={`py-2 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                  theme.button_shape === shape
                    ? "bg-[#e7ab1c] text-[#1a1a2e] border-[#e7ab1c]"
                    : "bg-transparent text-white/60 border-white/10 hover:text-white"
                } ${shape === "square" ? "rounded-none" : shape === "rounded" ? "rounded-md" : "rounded-full"}`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">Card corners</span>
          <div className="grid grid-cols-3 gap-2">
            {(["sharp", "soft", "round"] as const).map((r) => (
              <button key={r} onClick={() => set("radius", r)}
                className={`py-2 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                  theme.radius === r ? "bg-[#e7ab1c] text-[#1a1a2e] border-[#e7ab1c]" : "bg-transparent text-white/60 border-white/10 hover:text-white"
                } ${r === "sharp" ? "rounded-none" : r === "soft" ? "rounded-md" : "rounded-full"}`}>{r}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Live preview card */}
      <div className="rounded-lg p-3 border border-white/10"
           style={{ background: theme.background }}>
        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: theme.text, opacity: 0.45, fontFamily: FONT_STACKS[theme.body_font] }}>
          Live preview
        </p>
        <h4 className="mt-1 font-bold"
            style={{ color: theme.accent, fontFamily: FONT_STACKS[theme.heading_font], fontSize: `calc(1rem * ${SCALE_MULT[theme.scale]})` }}>
          Your event title
        </h4>
        <p className="mt-1" style={{ color: theme.text, fontFamily: FONT_STACKS[theme.body_font], fontSize: `calc(0.8rem * ${SCALE_MULT[theme.scale]})`, opacity: 0.75 }}>
          Body text preview with your fonts and scale.
        </p>
        <div className="mt-2 inline-block px-3 py-1.5 text-[11px] font-bold"
             style={{
               background: theme.primary,
               color: theme.accent,
               borderRadius: theme.button_shape === "square" ? "0px" : theme.button_shape === "pill" ? "999px" : "8px",
               fontFamily: FONT_STACKS[theme.body_font],
             }}>
          Register Now
        </div>
      </div>
    </div>
  )
}

/* ─── PAGES ─────────────────────────────────────────────────────────── */
function PagesPanel({ eventMeta, sectionCount }: { eventMeta: EventMeta; sectionCount: number }) {
  const pages = [
    { slug: eventMeta.slug || "home",              label: "Home",      status: "ACTIVE",  count: sectionCount },
    { slug: `${eventMeta.slug}/schedule`,           label: "Agenda",    status: "AUTO",    count: null },
    { slug: `${eventMeta.slug}/speakers`,           label: "Speakers",  status: "AUTO",    count: null },
    { slug: `${eventMeta.slug}/sponsors`,           label: "Sponsors",  status: "AUTO",    count: null },
    { slug: `${eventMeta.slug}/tickets`,            label: "Tickets",   status: "AUTO",    count: null },
    { slug: `${eventMeta.slug}/venue`,              label: "Venue",     status: "AUTO",    count: null },
  ]
  return (
    <div className="p-4 space-y-5">
      <PanelHeader icon={FileText} title="Pages" subtitle="Every page is a page-builder canvas. Agenda / Speakers / Sponsors auto-populate from the event graph." />
      <div className="space-y-2">
        {pages.map((p) => (
          <div key={p.slug} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-colors cursor-pointer">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-white truncate">{p.label}</p>
              <p className="text-[10px] text-white/40 font-mono truncate">/{p.slug}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {p.count !== null && <span className="text-[9px] text-white/40 font-mono">{p.count}</span>}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                p.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
              }`}>
                {p.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      <button disabled className="w-full py-2 rounded-lg border border-dashed border-white/15 text-[11px] font-semibold text-white/30 cursor-not-allowed">
        + Custom page (coming soon)
      </button>
    </div>
  )
}

/* ─── SEO ───────────────────────────────────────────────────────────── */
function SEOPanel({ eventMeta }: { eventMeta: EventMeta }) {
  return (
    <div className="p-4 space-y-5">
      <PanelHeader icon={Search} title="SEO" subtitle="Metadata, social cards, sitemap inclusion." />
      <div className="space-y-3">
        <Info label="Title">{eventMeta.title || "—"}</Info>
        <Info label="Slug">/{eventMeta.slug || "—"}</Info>
        <Info label="Description">{eventMeta.description || "None set"}</Info>
        <Info label="OG Image">{eventMeta.cover_image_url ? "Set" : "Falls back to cover"}</Info>
      </div>
      <Link href={`/admin/events/${eventMeta.slug ? "" : ""}`} className="block text-[11px] text-[#e7ab1c] font-semibold hover:underline">
        Edit event metadata →
      </Link>
    </div>
  )
}

/* ─── INTEGRATIONS ──────────────────────────────────────────────────── */
function IntegrationsPanel() {
  const integrations = [
    { name: "Razorpay",   status: "CONNECTED", desc: "Payment gateway" },
    { name: "Resend",     status: "CONNECTED", desc: "Transactional email" },
    { name: "Supabase",   status: "CONNECTED", desc: "Database & auth" },
    { name: "WhatsApp",   status: "PLANNED",   desc: "Template broadcasts" },
    { name: "Zoom",       status: "PLANNED",   desc: "Virtual sessions" },
    { name: "Google Analytics", status: "PLANNED", desc: "Attendee funnel" },
  ]
  return (
    <div className="p-4 space-y-5">
      <PanelHeader icon={Plug} title="Integrations" subtitle="External systems connected to this event." />
      <div className="space-y-2">
        {integrations.map((i) => (
          <div key={i.name} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
            <div>
              <p className="text-[12px] font-semibold text-white">{i.name}</p>
              <p className="text-[10px] text-white/40">{i.desc}</p>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
              i.status === "CONNECTED" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/40"
            }`}>
              {i.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── SETTINGS ──────────────────────────────────────────────────────── */
function SettingsPanel() {
  return (
    <div className="p-4 space-y-5">
      <PanelHeader icon={Settings} title="Settings" subtitle="Navigation, top banner, languages, activity log." />
      <div className="space-y-2">
        <SettingsRow icon={Bell}       label="Top banner"         hint="Site-wide notification strip" />
        <SettingsRow icon={Link2}      label="Navigation"         hint="Tabs + sub-nav groups" />
        <SettingsRow icon={Languages}  label="Languages"          hint="Export / import string packs" />
        <SettingsRow icon={History}    label="Version history"    hint="Draft + activity log" />
      </div>
      <Link href="/admin/audit-log" className="block text-[11px] text-[#e7ab1c] font-semibold hover:underline">
        Open full audit log →
      </Link>
    </div>
  )
}

function SettingsRow({ icon: Icon, label, hint }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; hint: string }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/10">
      <div className="flex items-center gap-3">
        <Icon size={14} className="text-[#e7ab1c]" />
        <div>
          <p className="text-[12px] font-semibold text-white">{label}</p>
          <p className="text-[10px] text-white/40">{hint}</p>
        </div>
      </div>
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/40">SOON</span>
    </div>
  )
}

/* ─── Panel bits ────────────────────────────────────────────────────── */
function PanelHeader({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; subtitle: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-[#e7ab1c]/15 text-[#e7ab1c] flex items-center justify-center"><Icon size={14} /></div>
        <h3 className="text-[13px] font-bold text-white">{title}</h3>
      </div>
      <p className="text-[11px] text-white/50 mt-1.5 leading-snug">{subtitle}</p>
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-2.5 py-1.5 pr-7 bg-[#0a0a0a] border border-white/10 rounded text-[11px] text-white/80 cursor-pointer hover:border-white/25"
        >
          {options.map((o) => <option key={o} value={o} className="bg-[#111]">{o}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
      </div>
    </label>
  )
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">{label}</p>
      <p className="text-[12px] text-white/80 mt-1 break-words">{children}</p>
    </div>
  )
}

