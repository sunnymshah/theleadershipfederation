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
  HelpCircle,
} from "lucide-react"

import { puckConfig } from "./puck-config"
import type { BuilderMetadata } from "./blocks"
import { PageDialog } from "./PageDialog"
import { ConfirmDialog } from "./ConfirmDialog"
import { SortablePageTabs } from "./SortablePageTabs"
import { RevisionHistoryPanel } from "./RevisionHistoryPanel"
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal"
import { PrimaryRail, type RailKey } from "./zoho/PrimaryRail"
import { SectionsPanel } from "./zoho/SectionsPanel"
import { PuckBridge, insertBlockAtEnd } from "./zoho/PuckBridge"
import { SectionActionBarOverflow } from "./zoho/SectionContextMenu"
import { InspectorTabs, ZohoFieldLabel } from "./zoho/InspectorTabs"
import { DevicePreviewModal } from "./zoho/DevicePreviewModal"
import { SpeakersManager } from "./zoho/SpeakersManager"
import { SessionsManager } from "./zoho/SessionsManager"
import { TicketsManager } from "./zoho/TicketsManager"
import { SponsorsManager } from "./zoho/SponsorsManager"
import { PagesPanel } from "./zoho/PagesPanel"
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
  initialData,
  initialPages,
  metadata,
}: {
  eventId: string
  eventTitle: string
  eventSlug: string
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
  /** Zoho-style primary-rail state. Default to "sections" so the user
   *  always lands on the block catalog. Setting to null collapses the
   *  secondary panel entirely. */
  const [activeRail, setActiveRail] = useState<RailKey | null>("sections")
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
    return () => window.removeEventListener("keydown", onKey)
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
        <div className="h-12 w-full flex items-center gap-2 px-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link
              href="/admin/builder"
              aria-label="Back to Page Builder hub"
              title="Back to Page Builder hub"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)] shrink-0"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
            </Link>
            <span className="w-px h-5 bg-[var(--bs-border,#e5e7eb)] shrink-0" />
            {/* Breadcrumbs (B13). Tightened for the constrained column:
                  - 2xl+ : "Events / Event title / Microsite"
                  - lg-xl: "Event title / Microsite" (Events link dropped)
                  - md   : just "Microsite" (event title in the back
                            button's tooltip)
                  - < md : nothing (just the autosave dot) */}
            <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-[12px] min-w-0">
              <Link
                href="/admin/events"
                className="hidden 2xl:inline text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] shrink-0"
              >
                Events
              </Link>
              <span className="hidden 2xl:inline text-[var(--bs-text-subtle,#9ca3af)]">/</span>
              <Link
                href={`/admin/events/${eventId}`}
                className="hidden lg:inline text-[var(--bs-text,#1f2937)] font-semibold truncate max-w-[160px]"
                title={eventTitle}
              >
                {eventTitle}
              </Link>
              <span className="hidden lg:inline text-[var(--bs-text-subtle,#9ca3af)]">/</span>
              <span className="text-[var(--bs-text-muted,#6b7280)] shrink-0">Microsite</span>
            </nav>
            <AutosaveBadge status={status} />
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={handleRefreshData}
              disabled={refreshing}
              title="Re-fetch speakers, sessions, sponsors, tickets"
              aria-label="Refresh event data"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)] disabled:opacity-60"
            >
              <RefreshCw size={14} strokeWidth={1.5} className={refreshing ? "animate-spin" : ""} />
            </button>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setDataMenuOpen((v) => !v)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
                aria-expanded={dataMenuOpen}
                aria-haspopup="menu"
                aria-label="Event data"
                title="Manage speakers, sessions, tickets, sponsors"
              >
                <Database size={14} strokeWidth={1.5} />
              </button>
              {dataMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-[var(--bs-border,#e5e7eb)] bg-white shadow-lg py-1 z-50">
                  <DataLink href={`/admin/events/${eventId}?tab=speakers`}     icon={Users}         label="Speakers" />
                  <DataLink href={`/admin/events/${eventId}?tab=agenda`}       icon={ClipboardList} label="Sessions & Agenda" />
                  <DataLink href={`/admin/events/${eventId}?tab=tickets`}      icon={Ticket}        label="Tickets" />
                  <DataLink href={`/admin/events/${eventId}?tab=sponsors`}     icon={Building2}     label="Sponsors" />
                  <div className="h-px bg-[var(--bs-border,#e5e7eb)] my-1" />
                  <DataLink href={`/admin/events/${eventId}?tab=settings`}     icon={Settings}      label="Event settings" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
              aria-label="Publish history"
              title="Publish history"
            >
              <History size={14} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={handleRevert}
              disabled={reverting}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)] disabled:opacity-50"
              aria-label="Revert"
              title="Discard unpublished changes — revert draft to last published"
            >
              {reverting ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} strokeWidth={1.5} />}
            </button>
            <span className="w-px h-5 bg-[var(--bs-border,#e5e7eb)] mx-0.5" />
            <PreviewMenu eventSlug={eventSlug} activePage={activePage} />
            {(() => {
              const isPublishing = publishState === "publishing"
              const justPublished = publishState === "published"
              const dirtyCount = dirtyPages.size
              const isDirty = dirtyCount > 0 && !isPublishing
              const isClean = !isDirty && !isPublishing && !justPublished

              const cls = isClean
                ? "border border-[var(--bs-border,#e5e7eb)] bg-white text-[var(--bs-text,#1f2937)] cursor-default"
                : "bg-[var(--bs-accent,#f0483e)] text-white hover:bg-[var(--bs-accent-hover,#d63d33)]"

              const labelShort = isPublishing
                ? "Publishing\u2026"
                : justPublished
                  ? "Published"
                  : isDirty
                    ? `Publish ${dirtyCount}`
                    : "Published"
              const labelFull = isDirty
                ? `Publish ${dirtyCount} change${dirtyCount === 1 ? "" : "s"}`
                : labelShort
              return (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing || isClean}
                  className={`relative inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[12px] font-semibold transition-colors disabled:opacity-80 whitespace-nowrap ${cls}`}
                  title={isClean ? "No unpublished changes" : "Publish all dirty pages"}
                >
                  {isPublishing
                    ? <Loader2 size={14} className="animate-spin" />
                    : justPublished
                      ? <Check size={14} strokeWidth={1.5} />
                      : <Globe size={14} strokeWidth={1.5} />}
                  <span className="2xl:hidden">{labelShort}</span>
                  <span className="hidden 2xl:inline">{labelFull}</span>
                  {isDirty && (
                    <span
                      aria-hidden
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white ring-2 ring-[var(--bs-accent,#f0483e)]"
                    />
                  )}
                </button>
              )
            })()}
            <button
              type="button"
              onClick={() => setShortcutsOpen(true)}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts"
              className="ml-1 inline-flex items-center justify-center w-8 h-8 rounded-md text-[var(--bs-text-muted,#6b7280)] hover:text-[var(--bs-text,#1f2937)] hover:bg-[var(--bs-bg-alt,#f7f8fa)]"
            >
              <HelpCircle size={16} strokeWidth={1.5} />
            </button>
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
    components: () => <PuckBridge />,
    /* C12 — per-section overflow menu (Duplicate / Move / Hide / Lock /
     * Save as template / Delete) appended to Puck's existing action bar. */
    actionBar: SectionActionBarOverflow,
    /* B3 — wrap the right-inspector field list with Settings/Style/
     * Visibility/Advanced tabs. CSS scoped via [data-z-tab] toggles
     * which fields are visible. Visibility + Advanced are stubbed until
     * Phase 5 extends each block's field schema. */
    fields: InspectorTabs,
    /* B3 — fieldLabel override stamps a data-z-cat attribute on each
     * field wrapper so InspectorTabs's CSS can filter by category. */
    fieldLabel: ZohoFieldLabel,
  }), [Header])

  return (
    <div className="lf-builder-shell fixed inset-0 flex flex-col bg-white text-[var(--bs-text,#1f2937)]">
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
        && <BuilderOnboarding onDismiss={() => {
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
            active={(activeRail ?? "sections") as RailKey}
            onChange={(key) => setActiveRail((cur) => (cur === key ? null : key))}
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
        {activeRail && (
          <div className="hidden lg:block">
          <ActiveRailPanel
            railKey={activeRail}
            eventId={eventId}
            metadata={metadata}
            pages={pages}
            activePage={activePage}
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
  onClose, onJumpPage, onAddPage, onRenamePage, onDuplicatePage, onDeletePage, onReorderPages,
}: {
  railKey: RailKey
  eventId: string
  metadata: BuilderMetadata
  pages: BuilderPagesMap
  activePage: string
  onClose: () => void
  onJumpPage: (target: string) => void
  onAddPage: () => void
  onRenamePage?: (slug: string, newTitle: string) => void
  onDuplicatePage?: (slug: string) => void
  onDeletePage?: (slug: string) => void
  onReorderPages?: (slugs: string[]) => void
}) {
  switch (railKey) {
    case "sections":
      return (
        <SectionsPanel
          onClose={onClose}
          onAddBlock={(blockType) => {
            // Routes click → Puck's dispatch via the PuckBridge. Inserts
            // the block at the end of the current page; admin can drag
            // to reorder afterwards.
            const ok = insertBlockAtEnd(blockType)
            if (!ok) {
              // Fallback when Puck hasn't mounted yet — extremely rare.
              window.dispatchEvent(new CustomEvent("builder:tile-clicked"))
            }
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
function BuilderOnboarding({ onDismiss }: { onDismiss: () => void }) {
  const [importOpen, setImportOpen] = useState(false)
  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
      <div className="pointer-events-auto max-w-md w-[calc(100%-2rem)] bg-white border border-[var(--bs-border,#e5e7eb)] rounded-2xl shadow-xl p-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--bs-text-muted,#6b7280)] mb-2">Get started</p>
        <h2 className="text-xl font-bold text-[var(--bs-text,#1f2937)] mb-2">Choose how to start</h2>
        <p className="text-[13px] text-[var(--bs-text-muted,#6b7280)] mb-5">
          Drop sections from the left palette, pick a template, or migrate from your existing Backstage event.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-3 rounded-lg border border-[var(--bs-border,#e5e7eb)] hover:border-[var(--bs-info,#3e7af7)] hover:bg-[var(--bs-bg-alt,#f7f8fa)] text-left"
          >
            <p className="text-[13px] font-semibold text-[var(--bs-text,#1f2937)]">Start blank</p>
            <p className="text-[11px] text-[var(--bs-text-muted,#6b7280)] mt-0.5">An empty Hero, ready to edit</p>
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-3 rounded-lg border border-[var(--bs-border,#e5e7eb)] hover:border-[var(--bs-info,#3e7af7)] hover:bg-[var(--bs-bg-alt,#f7f8fa)] text-left"
          >
            <p className="text-[13px] font-semibold text-[var(--bs-text,#1f2937)]">Use a template</p>
            <p className="text-[11px] text-[var(--bs-text-muted,#6b7280)] mt-0.5">Coming soon</p>
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
