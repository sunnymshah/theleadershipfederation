"use client"

/**
 * ── PuckEventBuilder ──────────────────────────────────────────────────
 *
 * Fullscreen wrapper around Puck's `<Puck>` editor with MULTI-PAGE support.
 *
 * Every event has exactly one "Home" page (stored in events.builder_data)
 * plus zero-or-more sub-pages (stored in events.builder_pages, keyed by a
 * URL-safe slug). The editor renders a tab strip across the top — one tab
 * per page — and re-mounts the Puck canvas with a new `data` whenever the
 * active tab changes.
 *
 * Key behaviours:
 *   - Autosave is debounced 700ms per page (home → saveBuilderDraft,
 *     sub-page → saveBuilderPageDraft).
 *   - Publish fires for BOTH home and the sub-pages atomically so the
 *     public nav never points at a missing page.
 *   - Overrides header entirely so we have ONE Publish button (not two).
 *
 * Mounted from `app/admin/builder/[id]/page.tsx`, which lives OUTSIDE
 * the `(console)` route group so the editor owns the entire viewport —
 * no admin sidebar, no top bar, just `h-screen w-screen`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Puck, type Data } from "@measured/puck"
import "@measured/puck/puck.css"
import "./builder-theme.css"
import "@/components/admin/zoho-theme.css"
import {
  ArrowLeft, ExternalLink, Loader2, Check, Globe, ChevronDown,
  Users, Ticket, ClipboardList, Building2, Settings, Database,
  Plus, Pencil, Trash2, Home, FileText, RefreshCw, ChevronLeft, ChevronRight, Copy,
  History, Undo2, Monitor, Tablet, Smartphone, Minus,
  HelpCircle, Calendar, X, MoreHorizontal, MessageSquare,
} from "lucide-react"

import { puckConfig } from "./puck-config"
import type { BuilderMetadata } from "./blocks"
import { PageDialog } from "./PageDialog"
import { ConfirmDialog } from "./ConfirmDialog"
import { SortablePageTabs } from "./SortablePageTabs"
import { RevisionHistoryPanel } from "./RevisionHistoryPanel"
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal"
import { SchedulePublishDialog } from "./SchedulePublishDialog"
import { ABTestCreateDialog } from "./ABTestCreateDialog"
import { AIWizardDialog } from "./AIWizardDialog"
import { UndoRedoButtons } from "./UndoRedoButtons"
import { PrimaryRail, type RailKey } from "./zoho/PrimaryRail"
import { SectionsPanel } from "./zoho/SectionsPanel"
import { PuckBridge, insertBlockAtEnd, insertBlockAtIndex } from "./zoho/PuckBridge"
import { ALLOWED_OPTIONAL_SECTIONS, isStandardPageKind } from "@/lib/standard-pages"
import { SectionActionBarOverflow } from "./zoho/SectionContextMenu"
import { InspectorTabs, ZohoFieldLabel } from "./zoho/InspectorTabs"
import { DevicePreviewModal } from "./zoho/DevicePreviewModal"
import { SpeakersManager } from "./zoho/SpeakersManager"
import { SessionsManager } from "./zoho/SessionsManager"
import { TicketsManager } from "./zoho/TicketsManager"
import { SponsorsManager } from "./zoho/SponsorsManager"
import { PagesPanel } from "./zoho/PagesPanel"
import { StandardPagesPanel } from "./zoho/StandardPagesPanel"
import { LanguagesPanel } from "./zoho/LanguagesPanel"
import { IntegrationsPanel } from "./zoho/IntegrationsPanel"
import { CommentsPanel } from "./zoho/CommentsPanel"
import { ThemePanel } from "./zoho/ThemePanel"
import { SettingsPanel } from "./zoho/SettingsPanel"
import {
  saveBuilderDraft,
  saveBuilderPageDraft,
  publishBuilderAtomic,
  revertBuilderDraft,
  addBuilderPage, renameBuilderPage, deleteBuilderPage,
  reorderBuilderPages, duplicateBuilderPage,
} from "@/app/actions/eventBuilderActions"
import type { BuilderPagesMap } from "@/lib/event-builder-pages"
import { sortPages } from "@/lib/event-builder-pages"

/** Active tab — "home" is a sentinel for the event's main page. Anything
 *  else is a sub-page slug from BuilderPagesMap. */
type ActivePage = "home" | string

export function PuckEventBuilder({
  eventId,
  eventTitle,
  eventSlug,
  eventStatus = "draft",
  eventStartDate = null,
  eventEndDate = null,
  eventLocales = ["en"],
  defaultLocale = "en",
  eventTimezone = "Asia/Kolkata",
  initialData,
  initialPages,
  metadata,
}: {
  eventId: string
  eventTitle: string
  eventSlug: string
  eventStatus?: string
  eventStartDate?: string | null
  eventEndDate?: string | null
  eventLocales?: string[]
  defaultLocale?: string
  eventTimezone?: string
  initialData: Data | null
  initialPages: BuilderPagesMap
  metadata: BuilderMetadata
}) {
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [publishState, setPublishState] = useState<"idle" | "publishing" | "published" | "error">("idle")
  const [publishMsg, setPublishMsg] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  /* Dirty tracking — flips true on first onChange after a publish. Used
   * by C9 to show "Publish N changes" / "Published" state. We don't
   * count individual changes (would require deep diff) — just whether
   * there's anything new to publish. */
  const [dirtyPages, setDirtyPages] = useState<Set<string>>(new Set())
  const [historyOpen, setHistoryOpen] = useState(false)
  const [reverting, setReverting] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [aiWizardOpen, setAiWizardOpen] = useState(false)
  // Section 6 — inspector overlay. By default the inspector is HIDDEN
  // (selection just shows the floating toolbar pill); it slides in from
  // the right ONLY when the gear icon in the toolbar is clicked. The
  // gear dispatches "builder:open-inspector"; Esc + close-X close it.
  const [inspectorOverlayOpen, setInspectorOverlayOpen] = useState(false)
  // Section 1 — when the user clicks "+ Add optional section" between
  // sections, we remember the insertion index so SectionsPanel can
  // place the new block there. -1 means "append at end" (default).
  const [sectionInsertIndex, setSectionInsertIndex] = useState<number>(-1)
  const [abDialog, setAbDialog] = useState<null | {
    blockId: string
    blockType: string
    blockProps: Record<string, unknown>
  }>(null)
  /** Zoho-style primary-rail state. Default to "sections" so the user
   *  always lands on the block catalog. Setting to null collapses the
   *  secondary panel entirely. */
  // Zoho lands on the Pages panel by default; admins explore from there.
  const [activeRail, setActiveRail] = useState<RailKey | null>("stdpages")
  /** B14 — at <lg the rail+panel collapse into a slide-over drawer
   *  toggled by a floating button on the canvas. Tracks whether the
   *  drawer is open. Has no effect at lg+. */
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  /* ── Viewport + zoom (visual chrome only — Puck owns its own iframe
   *    width; we apply a wrapper class so the canvas reflects the choice). */
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [zoom, setZoom] = useState(100)
  const zoomDown = useCallback(() => setZoom((z) => Math.max(50, z - 10)), [])
  const zoomUp   = useCallback(() => setZoom((z) => Math.min(150, z + 10)), [])
  const handleRevert = useCallback(async () => {
    setReverting(true)
    const res = await revertBuilderDraft(eventId)
    setReverting(false)
    if (res.success) {
      router.refresh()
    } else if (res.error) {
      setPublishState("error")
      setPublishMsg(res.error)
    }
  }, [eventId, router])
  const handleRefreshData = useCallback(() => {
    // The reference data (speakers/sessions/sponsors/tickets) is loaded
    // from the server page; router.refresh() re-fetches it without a full
    // navigation, then the editor remounts with fresh metadata.
    setRefreshing(true)
    router.refresh()
    // No reliable signal that refresh finished — clear after a short tick.
    window.setTimeout(() => setRefreshing(false), 1200)
  }, [router])

  /* ── Page state ────────────────────────────────────────────────────
   * Home draft + sub-page drafts live in local state so Puck can autosave
   * without round-tripping to the server for the whole tree. When the
   * active tab changes, we seed Puck's new data from this state map.    */
  const [pages, setPages] = useState<BuilderPagesMap>(initialPages ?? {})
  const [homeData, setHomeData] = useState<Data>(
    (initialData && typeof initialData === "object"
      ? (initialData as Data)
      : ({ content: [], root: { props: { title: eventTitle } } } as Data)),
  )
  const [activePage, setActivePage] = useState<ActivePage>("home")
  // Mirror the active page kind onto window so SectionContextMenu (which
  // mounts inside Puck overrides without React context) can read it
  // synchronously. Sub-page slugs fall back to "home" until the editor
  // data-plane refactor lands.
  useEffect(() => {
    if (typeof window === "undefined") return
    const w = window as unknown as { __lfActiveKind?: string }
    w.__lfActiveKind = isStandardPageKind(activePage) ? activePage : "home"
  }, [activePage])

  /* The `puckKey` forces Puck to remount when the active page changes —
   * otherwise undo history / selected block from the previous tab would
   * leak into the new one. */
  const puckKey = `puck-${activePage}`

  /** Data currently shown in the editor. Derived from activePage. */
  const currentData: Data = useMemo(() => {
    if (activePage === "home") return homeData
    const page = pages[activePage]
    return (page?.data ?? { content: [], root: { props: { title: page?.title ?? "Page" } } }) as Data
  }, [activePage, homeData, pages])

  /* ── Autosave (debounced 700ms) ─────────────────────────────────── */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scheduleSave = useCallback((data: Data) => {
    // Mark this page as dirty (C9 publish state).
    setDirtyPages((prev) => {
      if (prev.has(activePage)) return prev
      const next = new Set(prev)
      next.add(activePage)
      return next
    })
    // Update local cache immediately so switching tabs doesn't lose changes.
    if (activePage === "home") {
      setHomeData(data)
    } else {
      setPages((prev) => {
        const existing = prev[activePage]
        if (!existing) return prev
        return { ...prev, [activePage]: { ...existing, data: data as unknown as BuilderPagesMap[string]["data"] } }
      })
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus("saving")
    timerRef.current = setTimeout(async () => {
      const res = activePage === "home"
        ? await saveBuilderDraft(eventId, data as unknown as Parameters<typeof saveBuilderDraft>[1])
        : await saveBuilderPageDraft(
            eventId,
            activePage,
            data as unknown as Parameters<typeof saveBuilderPageDraft>[2],
          )
      setStatus(res.success ? "saved" : "error")
      if (res.success) setTimeout(() => setStatus("idle"), 1200)
    }, 700)
  }, [eventId, activePage])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  /* ── Keyboard shortcuts (C6) ──────────────────────────────────────
   * Cmd/Ctrl: +Z undo, +Shift+Z redo, +S save (force flush), +P preview,
   * +Shift+P publish, +D duplicate-active-page, Esc deselect (handled by
   * Puck), "/" focus block search (dispatched as event for the palette).
   * Undo/Redo ride on Puck's own history — we just re-dispatch via
   * `keydown` so Puck picks them up natively if the iframe was focused. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      // Don't hijack while typing in inputs / contenteditable.
      const t = e.target as HTMLElement | null
      const tag = t?.tagName?.toLowerCase()
      const inField = tag === "input" || tag === "textarea" || tag === "select" || (t?.isContentEditable ?? false)

      if (e.key === "?" && !inField && (e.shiftKey || true)) {
        // Open the cheatsheet on plain "?" too. Most users press Shift+/.
        if (!mod) {
          setShortcutsOpen(true)
          e.preventDefault()
          return
        }
      }
      if (e.key === "/" && !inField && !mod) {
        // Tell the block palette (when we add it in C2) to focus its search.
        window.dispatchEvent(new CustomEvent("builder:focus-search"))
        e.preventDefault()
        return
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault()
        // Flush any pending autosave immediately.
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        const payload = activePage === "home"
          ? saveBuilderDraft(eventId, homeData as unknown as Parameters<typeof saveBuilderDraft>[1])
          : saveBuilderPageDraft(eventId, activePage, (pages[activePage]?.data ?? { content: [], root: { props: {} } }) as unknown as Parameters<typeof saveBuilderPageDraft>[2])
        setStatus("saving")
        Promise.resolve(payload).then((r) => setStatus(r.success ? "saved" : "error"))
        return
      }
      if (mod && e.key.toLowerCase() === "p" && !e.shiftKey) {
        e.preventDefault()
        const baseHref = activePage === "home" ? `/events/${eventSlug}` : `/events/${eventSlug}/p/${activePage}`
        window.open(baseHref, "_blank", "noopener,noreferrer")
        return
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault()
        void handlePublish()
        return
      }
      if (mod && e.key.toLowerCase() === "d" && !inField) {
        if (activePage !== "home") {
          e.preventDefault()
          void handleDuplicatePage(activePage)
        }
        return
      }
    }
    window.addEventListener("keydown", onKey)
    const onAbDialog = (e: Event) => {
      const detail = (e as CustomEvent<{ blockId: string; blockType: string; blockProps: Record<string, unknown> }>).detail
      if (!detail?.blockId) return
      setAbDialog(detail)
    }
    const onOpenInspector = () => setInspectorOverlayOpen(true)
    const onCloseInspector = () => setInspectorOverlayOpen(false)
    const onEscClose = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setInspectorOverlayOpen(false)
        setActiveRail(null)
      }
    }
    const onOpenRail = (e: Event) => {
      const detail = (e as CustomEvent<{ rail: RailKey }>).detail
      if (detail?.rail) setActiveRail(detail.rail)
    }
    const onOpenSectionsAtIndex = (e: Event) => {
      const detail = (e as CustomEvent<{ index: number }>).detail
      if (typeof detail?.index === "number") {
        setSectionInsertIndex(detail.index)
        setActiveRail("sections")
      }
    }
    window.addEventListener("builder:open-ab-dialog", onAbDialog)
    window.addEventListener("builder:open-inspector", onOpenInspector)
    window.addEventListener("builder:close-inspector", onCloseInspector)
    window.addEventListener("builder:open-rail", onOpenRail)
    window.addEventListener("builder:open-sections-at-index", onOpenSectionsAtIndex)
    window.addEventListener("keydown", onEscClose)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("builder:open-ab-dialog", onAbDialog)
      window.removeEventListener("builder:open-inspector", onOpenInspector)
      window.removeEventListener("builder:close-inspector", onCloseInspector)
      window.removeEventListener("builder:open-rail", onOpenRail)
      window.removeEventListener("builder:open-sections-at-index", onOpenSectionsAtIndex)
      window.removeEventListener("keydown", onEscClose)
    }
  // We intentionally re-create the handler each render so it sees fresh
  // state — the deps are exhaustive.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, eventSlug, activePage, homeData, pages])

  /* ── Publish ──────────────────────────────────────────────────────
   * Flush pending autosave first (for whichever page is active), then
   * fire home + sub-pages publish in parallel. Either one failing flips
   * the state to "error" with the first error message.                  */
  const handlePublish = useCallback(async () => {
    setPublishState("publishing")
    setPublishMsg(null)

    // Flush any queued autosave for the currently-edited page.
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      const pending = activePage === "home"
        ? saveBuilderDraft(eventId, homeData as unknown as Parameters<typeof saveBuilderDraft>[1])
        : saveBuilderPageDraft(
            eventId,
            activePage,
            (pages[activePage]?.data ?? { content: [], root: { props: {} } }) as unknown as Parameters<typeof saveBuilderPageDraft>[2],
          )
      await pending
    }

    const res = await publishBuilderAtomic(
      eventId,
      homeData as unknown as Parameters<typeof publishBuilderAtomic>[1],
    )
    if (res.success) {
      setPublishState("published")
      setPublishMsg("Live on the public page.")
      setDirtyPages(new Set()) // clear dirty markers on successful publish
      setTimeout(() => setPublishState("idle"), 2000)
    } else {
      setPublishState("error")
      setPublishMsg(res.error || "Publish failed.")
    }
  }, [eventId, activePage, homeData, pages])

  /* ── Add / rename / delete sub-pages ─────────────────────────────── */
  /* Modal state — replaces window.prompt / window.confirm. */
  const [pageDialog, setPageDialog] = useState<
    | { open: false }
    | { open: true; mode: "create" }
    | { open: true; mode: "rename"; slug: string; initialTitle: string }
  >({ open: false })
  const [confirmDelete, setConfirmDelete] = useState<
    { open: false } | { open: true; slug: string; title: string }
  >({ open: false })
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  const handleAddPage = useCallback(() => {
    setPageDialog({ open: true, mode: "create" })
  }, [])

  const handleRenamePage = useCallback((slug: string) => {
    const existing = pages[slug]
    if (!existing) return
    setPageDialog({ open: true, mode: "rename", slug, initialTitle: existing.title })
  }, [pages])

  const handleDeletePage = useCallback((slug: string) => {
    const existing = pages[slug]
    if (!existing) return
    setConfirmDelete({ open: true, slug, title: existing.title })
  }, [pages])

  const submitPageDialog = useCallback(async (title: string) => {
    if (!pageDialog.open) return
    if (pageDialog.mode === "create") {
      setPageDialog({ open: false })
      const res = await addBuilderPage(eventId, title)
      if (res.success && res.slug) {
        setPages((prev) => ({
          ...prev,
          [res.slug!]: {
            title,
            data: { content: [], root: { props: { title } } },
            order: Math.max(0, ...Object.values(prev).map((p) => p.order ?? 0)) + 1,
          },
        }))
        setActivePage(res.slug)
      } else if (res.error) {
        setErrorBanner(res.error)
      }
    } else {
      const { slug } = pageDialog
      setPageDialog({ open: false })
      const existing = pages[slug]
      if (!existing || title === existing.title) return
      const res = await renameBuilderPage(eventId, slug, title)
      if (res.success && res.slug) {
        setPages((prev) => {
          const copy: BuilderPagesMap = { ...prev }
          const row = copy[slug]
          if (!row) return copy
          delete copy[slug]
          copy[res.slug!] = { ...row, title }
          return copy
        })
        if (activePage === slug) setActivePage(res.slug)
      } else if (res.error) {
        setErrorBanner(res.error)
      }
    }
  }, [pageDialog, eventId, pages, activePage])

  const handleDuplicatePage = useCallback(async (slug: string) => {
    const res = await duplicateBuilderPage(eventId, slug)
    if (res.success && res.slug) {
      const source = pages[slug]
      const newSlug = res.slug
      setPages((prev) => ({
        ...prev,
        [newSlug]: {
          title: source ? `${source.title} (copy)` : "Page (copy)",
          data: source?.data ?? { content: [], root: { props: {} } },
          order: Math.max(0, ...Object.values(prev).map((p) => p.order ?? 0)) + 1,
        },
      }))
      setActivePage(newSlug)
    } else if (res.error) {
      setErrorBanner(res.error)
    }
  }, [eventId, pages])

  const handleReorderPages = useCallback(async (slugs: string[]) => {
    // Optimistically update local order so the UI doesn't snap back.
    setPages((prev) => {
      const next: BuilderPagesMap = {}
      let i = 0
      for (const slug of slugs) {
        const existing = prev[slug]
        if (existing) next[slug] = { ...existing, order: i++ }
      }
      // Trailing entries keep their relative order pushed to the end.
      for (const [slug, page] of Object.entries(prev)) {
        if (!(slug in next)) next[slug] = { ...page, order: i++ }
      }
      return next
    })
    const res = await reorderBuilderPages(eventId, slugs)
    if (!res.success && res.error) setErrorBanner(res.error)
  }, [eventId])

  const submitConfirmDelete = useCallback(async () => {
    if (!confirmDelete.open) return
    const { slug } = confirmDelete
    setConfirmDelete({ open: false })
    const res = await deleteBuilderPage(eventId, slug)
    if (res.success) {
      setPages((prev) => {
        const copy: BuilderPagesMap = { ...prev }
        delete copy[slug]
        return copy
      })
      if (activePage === slug) setActivePage("home")
    } else if (res.error) {
      setErrorBanner(res.error)
    }
  }, [confirmDelete, eventId, activePage])

  /* ── Event-data dropdown (opens separate admin tabs) ─────────────── */
  const [dataMenuOpen, setDataMenuOpen] = useState(false)
  useEffect(() => {
    if (!dataMenuOpen) return
    const close = () => setDataMenuOpen(false)
    window.addEventListener("click", close)
    return () => window.removeEventListener("click", close)
  }, [dataMenuOpen])

  /* ── Tab strip overflow (chevrons + edge fades) ──────────────────── */
  const tabStripRef = useRef<HTMLDivElement | null>(null)
  const scrollTabs = useCallback((delta: number) => {
    tabStripRef.current?.scrollBy({ left: delta, behavior: "smooth" })
  }, [])

  /* ── Header override (replaces Puck's built-in header entirely) ──── */
  const Header = useCallback(() => {
    const pageList = sortPages(pages)
    return (
      <div className="flex flex-col shrink-0 bg-white border-b border-[var(--bs-border,#e5e7eb)]">
        {/* Row 1 — top bar lives INSIDE the canvas column (rail + panel
            steal ~344px on the left), so it must fit comfortably in
            ~900px. Layout: LEFT (flex-1 min-w-0) + RIGHT (shrink-0,
            icon-only on this width). Viewport + zoom moved to a
            floating pill at the bottom-right of the canvas (see
            ViewportPill render below) — Figma's pattern, never crowds
            the top bar. */}
        {/* Zoho-parity three-zone top bar.
            LEFT  (flex-1)  : event color dot + title + Microsite breadcrumb
                              + autosave dot + overflow menu (Refresh / Data /
                              History / Revert).
            CENTER (absolute): Undo + Redo (Puck history) — device viewport
                              pill stays floating bottom-right of the canvas
                              so it doesn't crowd the bar.
            RIGHT (shrink-0): Preview · View Website · Schedule · Help ·
                              Publish · Close X. */}
        <div className="relative h-14 w-full flex items-center gap-2 px-3">
          {/* LEFT zone — two-line Zoho layout. */}
          <div className="flex flex-col min-w-0 flex-1 justify-center gap-0.5">
            {/* Row A: dot + title + status pill */}
            <div className="flex items-center gap-2 min-w-0">
              <span
                aria-hidden
                className="w-2 h-2 rounded-full bg-[var(--lf-primary,#e7ab1c)] shrink-0"
                title="Event color"
              />
              <Link
                href={`/admin/events/${eventId}`}
                className="text-[14px] font-bold text-[var(--bs-text,#1f2937)] truncate max-w-[360px] hover:text-[var(--bs-text-muted,#6b7280)] transition-colors leading-[18px]"
                title={eventTitle}
              >
                {eventTitle}
              </Link>
              <StatusPill status={eventStatus} />
            </div>
            {/* Row B: date + locale + autosave */}
            <div className="flex items-center gap-3 text-[11px] text-[var(--bs-text-muted,#6b7280)] leading-[16px]">
              <span className="inline-flex items-center gap-1.5 shrink-0">
                <Calendar size={12} strokeWidth={1.5} />
                <span className="tabular-nums">
                  {formatEventDateTZ(eventStartDate, eventTimezone)}
                </span>
              </span>
              <span className="opacity-40 shrink-0">·</span>
              <LocaleSwitcher
                locales={eventLocales}
                defaultLocale={defaultLocale}
              />
              <span className="ml-auto pr-1">
                <AutosaveBadge status={status} />
              </span>
            </div>
          </div>

          {/* CENTER zone — absolutely centered so it stays put as
              LEFT/RIGHT widths fluctuate with breadcrumb labels. */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-0.5">
            <UndoRedoButtons />
          </div>

          {/* RIGHT zone \u2014 Zoho 1:1 order:
              Preview \u00b7 | \u00b7 View Website \u00b7 History \u00b7 Comments \u00b7 Help \u00b7
              Publish + chevron (combined) \u00b7 | \u00b7 Close X */}
          <div className="flex items-center gap-0.5 shrink-0">
            <PreviewMenu eventSlug={eventSlug} activePage={activePage} />
            <span className="w-px h-5 bg-[var(--bs-border,#e5e7eb)] mx-1" />
            {(() => {
              const isPublished = ["published", "live", "completed"].includes((eventStatus ?? "").toLowerCase())
              const cls = isPublished
                ? "text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
                : "text-[var(--bs-text-subtle,#9ca3af)] cursor-not-allowed opacity-50"
              return (
                <a
                  href={isPublished ? `/events/${eventSlug}` : undefined}
                  target={isPublished ? "_blank" : undefined}
                  rel={isPublished ? "noopener noreferrer" : undefined}
                  aria-label="View website"
                  aria-disabled={!isPublished}
                  title={isPublished ? "Open published microsite in a new tab" : "Publish first to view the live site"}
                  onClick={(e) => { if (!isPublished) e.preventDefault() }}
                  className={`inline-flex items-center gap-1.5 h-8 px-2 rounded-md text-[12px] font-medium ${cls}`}
                >
                  <Globe size={14} strokeWidth={1.5} />
                  <span className="hidden lg:inline">View Website</span>
                </a>
              )
            })()}
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              aria-label="Publish history"
              title="Publish history"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
            >
              <History size={14} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => setActiveRail("comments")}
              aria-label="Comments"
              title="Comments"
              className="relative inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
            >
              <MessageSquare size={14} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => setShortcutsOpen(true)}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
            >
              <HelpCircle size={16} strokeWidth={1.5} />
            </button>
            <PublishCombo
              publishState={publishState}
              dirtyCount={dirtyPages.size}
              onPublish={handlePublish}
              onSchedule={() => setScheduleOpen(true)}
              onRevert={handleRevert}
            />
            <span className="w-px h-5 bg-[var(--bs-border,#e5e7eb)] mx-1" />
            <Link
              href="/admin/builder"
              aria-label="Close builder"
              title="Close \u2014 back to Builder hub"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
            >
              <X size={15} strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        {/* Row 2 — page tab strip. "Home" is always first and can't be moved. */}
        <div className="relative h-11 w-full border-t border-[#1a1a2e]/5 bg-[#fafafa]">
          {/* Left chevron */}
          <button
            type="button"
            onClick={() => scrollTabs(-220)}
            aria-label="Scroll tabs left"
            className="absolute left-0 top-0 h-full w-8 flex items-center justify-center bg-gradient-to-r from-[#fafafa] via-[#fafafa] to-transparent z-10 text-[#1a1a2e]/60 hover:text-[#1a1a2e]"
          >
            <ChevronLeft size={14} />
          </button>
          {/* Right chevron */}
          <button
            type="button"
            onClick={() => scrollTabs(220)}
            aria-label="Scroll tabs right"
            className="absolute right-0 top-0 h-full w-8 flex items-center justify-center bg-gradient-to-l from-[#fafafa] via-[#fafafa] to-transparent z-10 text-[#1a1a2e]/60 hover:text-[#1a1a2e]"
          >
            <ChevronRight size={14} />
          </button>
          <div
            ref={tabStripRef}
            className="h-full flex items-center gap-1 px-9 overflow-x-auto scrollbar-none scroll-smooth"
            style={{ scrollbarWidth: "none" }}
          >
            <PageTab
              active={activePage === "home"}
              onClick={() => setActivePage("home")}
              icon={<Home size={12} />}
              label="Home"
            />
            <SortablePageTabs
              tabs={pageList.map(([slug, p]) => ({ slug, title: p.title }))}
              onReorder={handleReorderPages}
              renderTab={(tab) => (
                <PageTab
                  active={activePage === tab.slug}
                  onClick={() => setActivePage(tab.slug)}
                  icon={<FileText size={12} />}
                  label={tab.title}
                  onRename={() => handleRenamePage(tab.slug)}
                  onDelete={() => handleDeletePage(tab.slug)}
                  onDuplicate={() => handleDuplicatePage(tab.slug)}
                />
              )}
            />
            <button
              type="button"
              onClick={handleAddPage}
              className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-[#1a1a2e]/70 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/5 border border-dashed border-[#1a1a2e]/20 whitespace-nowrap shrink-0"
              title="Add a new page"
            >
              <Plus size={11} /> Add page
            </button>
          </div>
        </div>
      </div>
    )
  }, [eventId, eventSlug, eventTitle, status, publishState, handlePublish, dataMenuOpen, activePage, pages, handleAddPage, handleRenamePage, handleDeletePage, handleDuplicatePage, handleReorderPages, handleRefreshData, refreshing, scrollTabs, handleRevert, reverting])

  /* Puck overrides:
   * - `header`: render NOTHING. Our Zoho top bar + page-tab strip live
   *   OUTSIDE Puck (above the rail/panel/canvas row) so they span the
   *   full viewport width — never cramped by Puck's right inspector
   *   eating column width.
   * - `components`: replace Puck's left block-palette with the PuckBridge
   *   (renders nothing; just registers Puck's `dispatch` so SectionsPanel
   *   can call `insertBlockAtEnd()` from outside Puck's tree). Our own
   *   Zoho SectionsPanel is what the admin sees.
   */
  const overrides = useMemo(() => ({
    header: () => <></>,
    /* Puck's left "components" sidebar — empty fragment + PuckBridge.
     * The bridge renders nothing visible but registers Puck's dispatch
     * so our own SectionsPanel can call insertBlockAtEnd() / etc. */
    components: () => <PuckBridge />,
    /* Puck's left "outline / layer tree" — render nothing.
     * Our Pages rail panel covers this need at a higher abstraction. */
    outline: () => <></>,
    /* Per-section action bar — restyled into Zoho's pill (eye + gear +
     * chevron overflow). See SectionContextMenu. */
    actionBar: SectionActionBarOverflow,
    /* Right-inspector field list wrapped with Settings/Style/Visibility/
     * Advanced tabs. The whole inspector is hidden until the user clicks
     * the gear icon on a section toolbar (see CSS .lf-inspector-closed). */
    fields: InspectorTabs,
    /* fieldLabel override stamps a data-z-cat attribute on each field
     * so InspectorTabs's CSS rule can filter by category. */
    fieldLabel: ZohoFieldLabel,
  }), [Header])

  return (
    <div className={`lf-builder-shell fixed inset-0 flex flex-col bg-white text-[var(--bs-text,#1f2937)] ${inspectorOverlayOpen ? "lf-inspector-open" : "lf-inspector-closed"}`}>
      {publishMsg && (
        <div className={`shrink-0 px-4 py-1.5 text-[11px] font-medium text-center ${
          publishState === "error" ? "bg-red-900/10 text-red-700" : "bg-emerald-900/10 text-emerald-700"
        }`}>
          {publishMsg}
        </div>
      )}
      {errorBanner && (
        <div className="shrink-0 px-4 py-1.5 text-[11px] font-medium text-center bg-red-900/10 text-red-700 flex items-center justify-center gap-2">
          {errorBanner}
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="ml-2 underline-offset-2 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top bar + page-tab strip — rendered OUTSIDE Puck so they span
          the full viewport width (rail + panel + canvas + Puck right
          inspector). Previously this was inside Puck via overrides.header
          and only spanned the canvas column, which crammed all buttons
          into ~900px and visually overlapped Puck's right-inspector
          breadcrumb. */}
      <Header />

      {/* C11 — first-time onboarding card. Shown when the home page is
          empty AND the editor hasn't been used yet (no sub-pages). */}
      {activePage === "home"
        && (!homeData?.content || homeData.content.length === 0)
        && Object.keys(pages).length === 0
        && <BuilderOnboarding onAiGenerate={() => setAiWizardOpen(true)} onDismiss={() => {
          // Add a placeholder block via setHomeData to dismiss; cheaper
          // than persisting a flag. The user can immediately delete it.
          setHomeData((prev) => ({
            ...prev,
            content: [{ type: "Hero", props: { id: `Hero-${Date.now()}`, title: "", subtitle: "", ctaLabel: "Register", ctaUrl: "internal:tickets", backgroundImage: "", alignment: "left", minHeight: "tall" } } as unknown as Data["content"][number]],
          }))
        }} />}

      {/* ── Zoho Backstage chrome: rail | secondary panel | Puck canvas ──
          At lg+ the rail + active panel render inline. At <lg they
          collapse into a slide-over drawer toggled by a floating button
          (B14 responsive behaviour). Puck's own left sidebar is hidden
          via overrides.components in either case. */}
      <div className="lf-admin-shell flex-1 min-h-0 flex relative">
        {/* Desktop rail (≥ lg) */}
        <div className="hidden lg:flex">
          <PrimaryRail
            active={(activeRail ?? "stdpages") as RailKey}
            onChange={(key) => setActiveRail((cur) => (cur === key ? null : key))}
            topSlot={
              <button
                type="button"
                onClick={() => setActiveRail("sections")}
                aria-label="Add section"
                title="Add section"
                className={`z-rail-item ${activeRail === "sections" ? "is-active" : ""}`}
              >
                <Plus size={18} strokeWidth={1.5} />
              </button>
            }
          />
        </div>
        {/* Mobile slide-over (< lg) */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-[60] flex">
            <div
              className="absolute inset-0 bg-[#1a1a2e]/40 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative flex h-full max-w-[calc(100vw-3rem)] shadow-2xl bg-white animate-in fade-in">
              <PrimaryRail
                active={(activeRail ?? "sections") as RailKey}
                onChange={(key) => setActiveRail((cur) => (cur === key ? null : key))}
              />
              {activeRail && (
                <div className="border-r border-[var(--bs-border,#e5e7eb)]">
                  <ActiveRailPanel
                    railKey={activeRail}
                    eventId={eventId}
                    metadata={metadata}
                    pages={pages}
                    activePage={activePage}
                    insertIndex={sectionInsertIndex}
                    onAfterInsert={() => { setSectionInsertIndex(-1); setMobileNavOpen(false); setActiveRail(null) }}
                    onClose={() => setMobileNavOpen(false)}
                    onJumpPage={(target) => { setActivePage(target); setMobileNavOpen(false) }}
                    onAddPage={() => { setPageDialog({ open: true, mode: "create" }); setMobileNavOpen(false) }}
                    onRenamePage={(slug, nextTitle) => handleRenamePage(slug)}
                    onDuplicatePage={handleDuplicatePage}
                    onDeletePage={handleDeletePage}
                    onReorderPages={handleReorderPages}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {/* Floating secondary panel — anchored to the rail's right edge,
            absolute-positioned so the canvas underneath stays full-width.
            Click-outside (on the canvas) closes via the backdrop layer. */}
        {activeRail && (
          <>
            {/* Invisible click-outside catcher, BEHIND the panel + ABOVE
                the canvas, so the user can dismiss by clicking the canvas
                without triggering a Puck selection on accident. */}
            <div
              className="hidden lg:block fixed left-14 top-[100px] right-0 bottom-0 z-20"
              onClick={() => setActiveRail(null)}
              aria-hidden
            />
            <div
              className="hidden lg:block absolute left-14 top-0 bottom-0 z-30 shadow-[0_8px_24px_rgba(15,23,42,0.10)]"
            >
          <ActiveRailPanel
            railKey={activeRail}
            eventId={eventId}
            metadata={metadata}
            pages={pages}
            activePage={activePage}
            insertIndex={sectionInsertIndex}
            onAfterInsert={() => { setSectionInsertIndex(-1); setActiveRail(null) }}
            onClose={() => setActiveRail(null)}
            onJumpPage={(target) => setActivePage(target)}
            onAddPage={() => setPageDialog({ open: true, mode: "create" })}
            onRenamePage={(slug, nextTitle) => {
              const existing = pages[slug]
              if (!existing) return
              setPageDialog({ open: false })
              // Reuse the existing rename action via the handler we already have.
              void renameBuilderPage(eventId, slug, nextTitle).then((res) => {
                if (res.success && res.slug) {
                  setPages((prev) => {
                    const copy: BuilderPagesMap = { ...prev }
                    const row = copy[slug]
                    if (!row) return copy
                    delete copy[slug]
                    copy[res.slug!] = { ...row, title: nextTitle }
                    return copy
                  })
                  if (activePage === slug) setActivePage(res.slug)
                } else if (res.error) {
                  setErrorBanner(res.error)
                }
              })
            }}
            onDuplicatePage={handleDuplicatePage}
            onDeletePage={handleDeletePage}
            onReorderPages={handleReorderPages}
          />
            </div>
          </>
        )}
        <div className="flex-1 min-w-0 min-h-0 relative">
          {/* Mobile open-panels button — shown only < lg */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open builder navigation"
            className="lg:hidden fixed bottom-4 left-4 z-40 inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bs-accent,#f0483e)] text-white shadow-[var(--z-shadow-lg,0_8px_24px_rgba(15,23,42,0.10))] hover:brightness-110"
          >
            <Plus size={20} strokeWidth={2} />
          </button>

          {/* Floating viewport + zoom pill (Figma-style). Sits at the
              bottom-right of the canvas, never crowds the top bar. */}
          <ViewportPill
            viewport={viewport}
            onViewport={setViewport}
            zoom={zoom}
            onZoomDown={zoomDown}
            onZoomUp={zoomUp}
          />

          <Puck
            key={puckKey}
            config={puckConfig}
            data={currentData}
            metadata={metadata as unknown as Record<string, unknown>}
            onChange={(d) => scheduleSave(d as Data)}
            onPublish={handlePublish}
            overrides={overrides}
            iframe={{ enabled: true }}
            /* viewports removed: passing it makes Puck render its own
               viewport+zoom bar inside the canvas, which sat on top of
               our floating ViewportPill and on top of the page-tab strip.
               Our floating pill at bottom-right of the canvas owns
               viewport switching now. */
          />
        </div>
      </div>

      {/* Modals (replace window.prompt / confirm) */}
      <PageDialog
        open={pageDialog.open}
        mode={pageDialog.open ? pageDialog.mode : "create"}
        initialTitle={pageDialog.open && pageDialog.mode === "rename" ? pageDialog.initialTitle : ""}
        onCancel={() => setPageDialog({ open: false })}
        onConfirm={submitPageDialog}
      />
      <ConfirmDialog
        open={confirmDelete.open}
        title={confirmDelete.open ? `Delete "${confirmDelete.title}"?` : "Delete page?"}
        message="This page and its content will be removed. The page won't appear on the public site after the next publish."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setConfirmDelete({ open: false })}
        onConfirm={submitConfirmDelete}
      />
      <RevisionHistoryPanel
        open={historyOpen}
        eventId={eventId}
        onClose={() => setHistoryOpen(false)}
        onRestored={() => router.refresh()}
      />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <SchedulePublishDialog eventId={eventId} open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
      {abDialog && (
        <ABTestCreateDialog
          open={true}
          onClose={() => setAbDialog(null)}
          eventId={eventId}
          pageKind={activePage === "home" ? "home" : activePage}
          blockId={abDialog.blockId}
          blockType={abDialog.blockType}
          blockProps={abDialog.blockProps}
        />
      )}
      <AIWizardDialog
        eventId={eventId}
        open={aiWizardOpen}
        onClose={() => setAiWizardOpen(false)}
      />
    </div>
  )
}

/**
 * Zoho-style page tab. Action icons (rename/duplicate/delete) appear on
 * tab HOVER, not just on the active tab — matches Backstage. Active tab
 * has white bg + 1px border + subtle bottom shadow; inactive is
 * transparent and lifts on hover.
 */
function PageTab({
  active, onClick, icon, label, onRename, onDelete, onDuplicate,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  onRename?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
}) {
  return (
    <div className="relative group inline-flex items-center gap-0 shrink-0 h-8">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap ${
          active
            ? "bg-white text-[var(--bs-text,#1f2937)] border border-[var(--bs-border,#e5e7eb)] shadow-[0_2px_4px_rgba(0,0,0,0.04)]"
            : "text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)] border border-transparent"
        }`}
        title={label}
      >
        {icon}
        <span className="max-w-[160px] truncate">{label}</span>
      </button>
      {(onRename || onDelete || onDuplicate) && (
        <span className={`ml-0.5 inline-flex items-center transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          {onRename && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRename() }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
              title="Rename page"
              aria-label="Rename page"
            >
              <Pencil size={11} strokeWidth={1.5} />
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDuplicate() }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
              title="Duplicate page"
              aria-label="Duplicate page"
            >
              <Copy size={11} strokeWidth={1.5} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 rounded-md text-red-600/70 hover:text-red-700 hover:bg-red-50"
              title="Delete page"
              aria-label="Delete page"
            >
              <Trash2 size={11} strokeWidth={1.5} />
            </button>
          )}
        </span>
      )}
    </div>
  )
}

function DataLink({
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
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 px-3 py-2 text-[12px] text-[#1a1a2e]/80 hover:bg-gray-50 hover:text-[#1a1a2e] transition-colors"
    >
      <Icon size={13} className="text-gray-400" />
      <span className="flex-1">{label}</span>
      <ExternalLink size={10} className="text-gray-300" />
    </Link>
  )
}

/**
 * ActiveRailPanel — dispatches to the right Zoho-style panel based on
 * which rail key is active. Each panel is self-contained (manages its
 * own search/edit state).
 */
function ActiveRailPanel({
  railKey, eventId, metadata, pages, activePage,
  insertIndex, onAfterInsert,
  onClose, onJumpPage, onAddPage, onRenamePage, onDuplicatePage, onDeletePage, onReorderPages,
}: {
  railKey: RailKey
  eventId: string
  metadata: BuilderMetadata
  pages: BuilderPagesMap
  activePage: string
  insertIndex: number
  onAfterInsert: () => void
  onClose: () => void
  onJumpPage: (target: string) => void
  onAddPage: () => void
  onRenamePage?: (slug: string, newTitle: string) => void
  onDuplicatePage?: (slug: string) => void
  onDeletePage?: (slug: string) => void
  onReorderPages?: (slugs: string[]) => void
}) {
  // For Section 1's filtered palette: detect the active standard-page
  // kind. Falls back to "home" — most events live on the home page.
  const activeKind = isStandardPageKind(activePage) ? activePage : "home"
  const allowedTypes = ALLOWED_OPTIONAL_SECTIONS[activeKind] ?? []

  switch (railKey) {
    case "sections":
      return (
        <SectionsPanel
          onClose={onClose}
          allowedTypes={allowedTypes.length > 0 ? allowedTypes : undefined}
          onAddBlock={(blockType) => {
            // If the user launched the panel via "+ Add optional section",
            // insertIndex points at the slot the new block should occupy.
            // Otherwise we append.
            const ok = insertIndex >= 0
              ? insertBlockAtIndex(blockType, insertIndex)
              : insertBlockAtEnd(blockType)
            if (!ok) {
              window.dispatchEvent(new CustomEvent("builder:tile-clicked"))
            }
            onAfterInsert()
          }}
        />
      )
    case "pages":
      return (
        <PagesPanel
          pages={pages}
          activePage={activePage}
          onJump={onJumpPage}
          onAdd={onAddPage}
          onClose={onClose}
          onRename={onRenamePage}
          onDuplicate={onDuplicatePage}
          onDelete={onDeletePage}
          onReorder={onReorderPages}
        />
      )
    case "theme":
      return <ThemePanel onClose={onClose} />
      // ThemePanel reads/writes Root.props directly via PuckBridge, so we
      // don't need to thread an onPick handler here.
    case "speakers":
      return (
        <SpeakersManager
          eventId={eventId}
          speakers={metadata.speakers}
          onClose={onClose}
        />
      )
    case "sessions":
      return (
        <SessionsManager
          eventId={eventId}
          sessions={metadata.sessions}
          onClose={onClose}
        />
      )
    case "tickets":
      return (
        <TicketsManager
          eventId={eventId}
          tickets={metadata.tickets}
          onClose={onClose}
        />
      )
    case "sponsors":
      return (
        <SponsorsManager
          eventId={eventId}
          sponsors={metadata.sponsors}
          onClose={onClose}
        />
      )
    case "stdpages":
      return (
        <StandardPagesPanel
          eventId={eventId}
          activeKind="home"
          onJump={() => { /* editor switching for std pages is Part 2 */ }}
          onClose={onClose}
        />
      )
    case "languages":
      return <LanguagesPanel eventId={eventId} onClose={onClose} />
    case "integrations":
      return <IntegrationsPanel eventId={eventId} onClose={onClose} />
    case "comments":
      return <CommentsPanel eventId={eventId} onClose={onClose} />
    case "settings":
      return <SettingsPanel eventId={eventId} onClose={onClose} />
    default:
      return null
  }
}

/**
 * First-time onboarding card. Floats over the canvas (pointer-events:auto
 * on the card, none on the backdrop wrapper) so the admin can still
 * interact with the palette to drop a block.
 */
function BuilderOnboarding({ onDismiss, onAiGenerate }: { onDismiss: () => void; onAiGenerate?: () => void }) {
  const [importOpen, setImportOpen] = useState(false)
  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
      <div className="pointer-events-auto max-w-md w-[calc(100%-2rem)] bg-white border border-[var(--bs-border,#e5e7eb)] rounded-2xl shadow-xl p-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--bs-text-muted,#6b7280)] mb-2">Get started</p>
        <h2 className="text-xl font-bold text-[var(--bs-text,#1f2937)] mb-2">Choose how to start</h2>
        <p className="text-[13px] text-[var(--bs-text-muted,#6b7280)] mb-5">
          Your event already has 12 standard pages. Edit them in place, generate copy with AI, or import from a Backstage URL.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-3 rounded-lg border border-[var(--bs-border,#e5e7eb)] hover:border-[var(--bs-info,#3e7af7)] hover:bg-[var(--bs-bg-alt,#f7f8fa)] text-left"
          >
            <p className="text-[13px] font-semibold text-[var(--bs-text,#1f2937)]">Edit blank</p>
            <p className="text-[11px] text-[var(--bs-text-muted,#6b7280)] mt-0.5">Start from the canonical defaults</p>
          </button>
          <button
            type="button"
            onClick={() => { onDismiss(); onAiGenerate?.() }}
            className="px-3 py-3 rounded-lg border border-[var(--lf-primary,#e7ab1c)]/40 bg-[var(--lf-primary,#e7ab1c)]/[0.06] hover:bg-[var(--lf-primary,#e7ab1c)]/[0.10] text-left"
          >
            <p className="text-[13px] font-semibold text-[var(--bs-text,#1f2937)]">Generate with AI</p>
            <p className="text-[11px] text-[var(--bs-text-muted,#6b7280)] mt-0.5">Describe → drafts the whole site</p>
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="px-3 py-3 rounded-lg border border-[var(--bs-border,#e5e7eb)] hover:border-[var(--bs-info,#3e7af7)] hover:bg-[var(--bs-bg-alt,#f7f8fa)] text-left"
          >
            <p className="text-[13px] font-semibold text-[var(--bs-text,#1f2937)]">Import from Backstage</p>
            <p className="text-[11px] text-[var(--bs-text-muted,#6b7280)] mt-0.5">Paste a public URL</p>
          </button>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-5 text-[12px] text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)]"
        >
          Skip for now
        </button>
      </div>
      <ConfirmDialog
        open={importOpen}
        title="Import from Zoho Backstage"
        message="Coming soon — you'll be able to paste a Backstage event URL and we'll migrate the page structure."
        confirmLabel="Got it"
        cancelLabel="Close"
        tone="default"
        onCancel={() => setImportOpen(false)}
        onConfirm={() => setImportOpen(false)}
      />
    </div>
  )
}

/**
 * Top-bar LEFT-zone overflow kebab. Hosts the legacy actions that the
 * Zoho-style 3-zone layout doesn't have direct slots for: Refresh data,
 * Event data submenu (Speakers / Sessions / Tickets / Sponsors / Event
 * settings), Publish history, Revert draft.
 */
function TopBarOverflowMenu({
  eventId,
  refreshing,
  dataMenuOpen,
  setDataMenuOpen,
  onRefreshData,
  onOpenHistory,
  onRevert,
  reverting,
}: {
  eventId: string
  refreshing: boolean
  dataMenuOpen: boolean
  setDataMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  onRefreshData: () => void
  onOpenHistory: () => void
  onRevert: () => void
  reverting: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setDataMenuOpen(false)
      }
    }
    window.addEventListener("mousedown", close)
    return () => window.removeEventListener("mousedown", close)
  }, [open, setDataMenuOpen])
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
        title="More actions"
        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
      >
        <MoreHorizontal size={14} strokeWidth={1.5} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 w-56 rounded-md bg-white shadow-lg border border-[var(--bs-border,#e5e7eb)] py-1 z-50"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onRefreshData() }}
            disabled={refreshing}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)] disabled:opacity-50"
          >
            <RefreshCw size={13} strokeWidth={1.5} className={refreshing ? "animate-spin" : ""} />
            Refresh event data
          </button>
          <div className="relative">
            <button
              type="button"
              role="menuitem"
              onClick={() => setDataMenuOpen((v) => !v)}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
              aria-expanded={dataMenuOpen}
              aria-haspopup="menu"
            >
              <Database size={13} strokeWidth={1.5} />
              <span className="flex-1 text-left">Event data</span>
              <ChevronRight size={12} className="opacity-50" />
            </button>
            {dataMenuOpen && (
              <div className="absolute left-full top-0 ml-1 w-56 rounded-md bg-white shadow-lg border border-[var(--bs-border,#e5e7eb)] py-1">
                <DataLink href={`/admin/events/${eventId}?tab=speakers`}     icon={Users}         label="Speakers" />
                <DataLink href={`/admin/events/${eventId}?tab=agenda`}       icon={ClipboardList} label="Sessions & Agenda" />
                <DataLink href={`/admin/events/${eventId}?tab=tickets`}      icon={Ticket}        label="Tickets" />
                <DataLink href={`/admin/events/${eventId}?tab=sponsors`}     icon={Building2}     label="Sponsors" />
                <div className="h-px bg-[var(--bs-border,#e5e7eb)] my-1" />
                <DataLink href={`/admin/events/${eventId}?tab=settings`}     icon={Settings}      label="Event settings" />
              </div>
            )}
          </div>
          <div className="h-px bg-[var(--bs-border,#e5e7eb)] my-1" />
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onOpenHistory() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
          >
            <History size={13} strokeWidth={1.5} />
            Publish history
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onRevert() }}
            disabled={reverting}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)] disabled:opacity-50"
          >
            {reverting
              ? <Loader2 size={13} className="animate-spin" />
              : <Undo2 size={13} strokeWidth={1.5} />}
            Revert to last published
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Publish + chevron combined unit. The button publishes immediately;
 * the attached chevron opens a small menu with: Publish now / Schedule
 * publish / Revert to last published.
 */
function PublishCombo({
  publishState,
  dirtyCount,
  onPublish,
  onSchedule,
  onRevert,
}: {
  publishState: "idle" | "publishing" | "published" | "error"
  dirtyCount: number
  onPublish: () => void
  onSchedule: () => void
  onRevert: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener("mousedown", close)
    return () => window.removeEventListener("mousedown", close)
  }, [open])

  const isPublishing = publishState === "publishing"
  const justPublished = publishState === "published"
  const isDirty = dirtyCount > 0 && !isPublishing
  const isClean = !isDirty && !isPublishing && !justPublished

  const baseCls = isClean
    ? "border border-[var(--bs-border,#e5e7eb)] bg-white text-[var(--bs-text,#1f2937)]"
    : "bg-[var(--bs-accent,#f0483e)] text-white hover:bg-[var(--bs-accent-hover,#d63d33)]"

  const labelShort = isPublishing
    ? "Publishing…"
    : justPublished
      ? "Published"
      : isDirty
        ? `Publish ${dirtyCount}`
        : "Published"
  const labelFull = isDirty
    ? `Publish ${dirtyCount} change${dirtyCount === 1 ? "" : "s"}`
    : labelShort

  return (
    <div className="relative inline-flex items-stretch shrink-0" ref={ref}>
      <button
        type="button"
        onClick={onPublish}
        disabled={isPublishing || isClean}
        className={`inline-flex items-center gap-1.5 px-2.5 h-8 rounded-l-md text-[12px] font-semibold transition-colors disabled:opacity-80 whitespace-nowrap ${baseCls}`}
        title={isClean ? "No unpublished changes" : "Publish all dirty pages"}
      >
        {isPublishing
          ? <Loader2 size={14} className="animate-spin" />
          : justPublished
            ? <Check size={14} strokeWidth={1.5} />
            : <Globe size={14} strokeWidth={1.5} />}
        <span className="2xl:hidden">{labelShort}</span>
        <span className="hidden 2xl:inline">{labelFull}</span>
      </button>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Publish options"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center justify-center w-7 h-8 rounded-r-md text-[12px] font-semibold transition-colors ${baseCls} ${
          isClean ? "border-l border-[var(--bs-border,#e5e7eb)]" : "border-l border-white/30"
        }`}
        title="Publish options"
      >
        <ChevronDown size={12} strokeWidth={1.5} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-52 rounded-md bg-white shadow-lg border border-[var(--bs-border,#e5e7eb)] py-1 z-50"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onPublish() }}
            disabled={isPublishing || isClean}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)] disabled:opacity-50"
          >
            <Globe size={13} strokeWidth={1.5} />
            Publish now
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onSchedule() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
          >
            <Calendar size={13} strokeWidth={1.5} />
            Schedule publish…
          </button>
          <div className="h-px bg-[var(--bs-border,#e5e7eb)] my-1" />
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onRevert() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
          >
            <Undo2 size={13} strokeWidth={1.5} />
            Revert to last published
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Status pill — shown next to the event title in the top bar.
 *  Live      → green   (event is currently in progress)
 *  Published → green-light (status === "published" but not live yet)
 *  Draft     → gray
 *  Completed → blue
 */
function StatusPill({ status }: { status: string }) {
  const s = (status ?? "draft").toLowerCase()
  let label = "Draft"
  let cls = "bg-gray-500 text-white"
  if (s === "published" || s === "live") { label = "LIVE"; cls = "bg-emerald-500 text-white" }
  else if (s === "completed") { label = "COMPLETED"; cls = "bg-blue-500 text-white" }
  else { label = "DRAFT"; cls = "bg-gray-500 text-white" }
  return (
    <span className={`inline-flex items-center px-2 h-[18px] rounded-full text-[10px] font-bold uppercase tracking-[0.08em] ${cls}`}>
      {label}
    </span>
  )
}

/**
 * Format a datetime for the event-timezone display in the top bar.
 * "Thu May 21, 2026 — 08:00 AM (IST)"
 */
function formatEventDateTZ(iso: string | null | undefined, tz: string): string {
  if (!iso) return "Date not set"
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return "Date not set"
    const date = new Intl.DateTimeFormat("en-US", {
      weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: tz,
    }).format(d)
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz, timeZoneName: "short",
    }).format(d)
    return `${date} — ${time}`
  } catch {
    return new Date(iso).toLocaleString()
  }
}

/**
 * Locale switcher popover for the top bar's row B. Clicking the chip
 * toggles a small dropdown of every locale on the event.
 */
function LocaleSwitcher({ locales, defaultLocale }: { locales: string[]; defaultLocale: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState<string>(defaultLocale)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener("mousedown", close)
    return () => window.removeEventListener("mousedown", close)
  }, [open])
  const list = locales.length > 0 ? locales : [defaultLocale]
  const labelFor = (lc: string) =>
    new Intl.DisplayNames(["en"], { type: "language" }).of(lc) ?? lc.toUpperCase()
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded px-1.5 hover:bg-[var(--bs-bg-alt,#f7f8fa)] text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)]"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={`Editing in ${labelFor(active)}`}
      >
        <Globe size={12} strokeWidth={1.5} />
        <span>{labelFor(active)}</span>
        <ChevronDown size={10} className="opacity-60" />
      </button>
      {open && (
        <div role="listbox" className="absolute top-full mt-1 left-0 z-50 min-w-[160px] rounded-md bg-white shadow-lg border border-[var(--bs-border,#e5e7eb)] py-1">
          {list.map((lc) => (
            <button
              key={lc}
              type="button"
              role="option"
              aria-selected={lc === active}
              onClick={() => { setActive(lc); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-[var(--bs-bg-alt,#f7f8fa)] ${
                lc === active ? "font-semibold text-[var(--bs-text,#1f2937)]" : "text-[var(--bs-text-muted,#6b7280)]"
              }`}
            >
              {labelFor(lc)} · <span className="font-mono text-[10px] uppercase">{lc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Zoho-style autosave indicator: small dot + text.
 *  - idle / saved → gray dot, "All changes saved"
 *  - saving       → blue spinning dot, "Saving…"
 *  - error        → red dot, "Save failed - retry" with a retry button
 */
function AutosaveBadge({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  const dotCls =
    status === "saving" ? "bg-[var(--bs-info,#3e7af7)] animate-pulse"
      : status === "error" ? "bg-red-500"
        : "bg-[var(--bs-text-muted,#9ca3af)]"
  const label =
    status === "saving" ? "Saving…"
      : status === "error" ? "Save failed"
        : "All changes saved"
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--bs-text-muted,#6b7280)] shrink-0">
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotCls}`} aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </span>
  )
}

/**
 * Three-state viewport icon button used inside ViewportPill below.
 * Active state mimics Zoho Backstage's lozenge — bg-white inside an
 * otherwise muted strip.
 */
function ViewportButton({
  active, onClick, icon, label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
        active
          ? "bg-white text-[var(--bs-text,#1f2937)] shadow-sm"
          : "text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-white"
      }`}
    >
      {icon}
    </button>
  )
}

/**
 * Floating viewport + zoom pill — Figma-style. Bottom-right of the
 * canvas column, absolute-positioned. Stays out of the top bar so the
 * top bar never cramps when rail+panel eat width.
 */
function ViewportPill({
  viewport, onViewport, zoom, onZoomDown, onZoomUp,
}: {
  viewport: "desktop" | "tablet" | "mobile"
  onViewport: (v: "desktop" | "tablet" | "mobile") => void
  zoom: number
  onZoomDown: () => void
  onZoomUp: () => void
}) {
  return (
    <div className="absolute bottom-4 right-4 z-30 pointer-events-none">
      <div className="pointer-events-auto inline-flex items-center gap-1 bg-white border border-[var(--bs-border,#e5e7eb)] shadow-[var(--z-shadow-lg,0_8px_24px_rgba(15,23,42,0.10))] rounded-full px-1.5 py-1">
        <ViewportButton
          active={viewport === "desktop"}
          onClick={() => onViewport("desktop")}
          icon={<Monitor size={14} strokeWidth={1.5} />}
          label="Desktop"
        />
        <ViewportButton
          active={viewport === "tablet"}
          onClick={() => onViewport("tablet")}
          icon={<Tablet size={14} strokeWidth={1.5} />}
          label="Tablet"
        />
        <ViewportButton
          active={viewport === "mobile"}
          onClick={() => onViewport("mobile")}
          icon={<Smartphone size={14} strokeWidth={1.5} />}
          label="Mobile"
        />
        <span className="w-px h-5 bg-[var(--bs-border,#e5e7eb)] mx-1" />
        <button
          type="button"
          onClick={onZoomDown}
          aria-label="Zoom out"
          disabled={zoom <= 50}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)] disabled:opacity-40"
        >
          <Minus size={12} strokeWidth={1.5} />
        </button>
        <span className="w-9 text-center text-[11px] font-medium text-[var(--bs-text-muted,#6b7280)] tabular-nums">
          {zoom}%
        </span>
        <button
          type="button"
          onClick={onZoomUp}
          aria-label="Zoom in"
          disabled={zoom >= 150}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)] disabled:opacity-40"
        >
          <Plus size={12} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

/**
 * Preview button + dropdown — Zoho Backstage's preview menu.
 *
 *   • Preview (default) opens the public page in a new window
 *   • As Visitor / As Logged-in Attendee / Mobile / Copy preview link
 *
 * The "as" mode is passed via ?preview-mode= so the public page can
 * adjust gated content if needed; mobile mode uses ?preview-device=mobile.
 */
function PreviewMenu({
  eventSlug, activePage,
}: {
  eventSlug: string
  activePage: string
}) {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState<{ device: "desktop" | "tablet" | "mobile"; mode: "visitor" | "attendee" } | null>(null)
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener("click", close)
    return () => window.removeEventListener("click", close)
  }, [open])

  const baseHref = activePage === "home"
    ? `/events/${eventSlug}`
    : `/events/${eventSlug}/p/${activePage}`

  function openModal(device: "desktop" | "tablet" | "mobile", mode: "visitor" | "attendee" = "visitor") {
    setOpen(false)
    setModal({ device, mode })
  }

  function copyLink() {
    setOpen(false)
    if (typeof navigator === "undefined") return
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    void navigator.clipboard?.writeText(`${origin}${baseHref}`)
  }

  return (
    <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => openModal("desktop", "visitor")}
        className="inline-flex items-center justify-center w-8 h-8 rounded-l-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
        aria-label="Preview public page"
        title="Preview public page (inline)"
      >
        <ExternalLink size={14} strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Preview options"
        title="More preview options"
        className="inline-flex items-center justify-center w-6 h-8 rounded-r-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
      >
        <ChevronDown size={12} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-60 rounded-lg border border-[var(--bs-border,#e5e7eb)] bg-white shadow-lg py-1 z-50 text-[12px]">
          <button onClick={() => openModal("desktop",  "visitor")}  className="w-full text-left px-3 py-2 hover:bg-[var(--bs-bg-alt,#f7f8fa)]">Preview Desktop</button>
          <button onClick={() => openModal("tablet",   "visitor")}  className="w-full text-left px-3 py-2 hover:bg-[var(--bs-bg-alt,#f7f8fa)]">Preview Tablet</button>
          <button onClick={() => openModal("mobile",   "visitor")}  className="w-full text-left px-3 py-2 hover:bg-[var(--bs-bg-alt,#f7f8fa)]">Preview Mobile</button>
          <div className="h-px bg-[var(--bs-border,#e5e7eb)] my-1" />
          <button onClick={() => openModal("desktop",  "visitor")}  className="w-full text-left px-3 py-2 hover:bg-[var(--bs-bg-alt,#f7f8fa)]">As Visitor</button>
          <button onClick={() => openModal("desktop",  "attendee")} className="w-full text-left px-3 py-2 hover:bg-[var(--bs-bg-alt,#f7f8fa)]">As Logged-in Attendee</button>
          <div className="h-px bg-[var(--bs-border,#e5e7eb)] my-1" />
          <a
            href={baseHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-3 py-2 hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
          >
            Open in new tab
          </a>
          <button onClick={copyLink} className="w-full text-left px-3 py-2 hover:bg-[var(--bs-bg-alt,#f7f8fa)]">Copy preview link</button>
        </div>
      )}
      <DevicePreviewModal
        open={modal !== null}
        onClose={() => setModal(null)}
        baseUrl={baseHref}
        initialDevice={modal?.device ?? "desktop"}
        initialMode={modal?.mode ?? "visitor"}
      />
    </div>
  )
}
