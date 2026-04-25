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
import {
  ArrowLeft, ExternalLink, Loader2, Check, Globe, ChevronDown,
  Users, Ticket, ClipboardList, Building2, Settings, Database,
  Plus, Pencil, Trash2, Home, FileText, RefreshCw, ChevronLeft, ChevronRight, Copy,
} from "lucide-react"

import { puckConfig } from "./puck-config"
import type { BuilderMetadata } from "./blocks"
import { PageDialog } from "./PageDialog"
import { ConfirmDialog } from "./ConfirmDialog"
import { SortablePageTabs } from "./SortablePageTabs"
import {
  saveBuilderDraft, publishBuilder,
  saveBuilderPageDraft, publishBuilderPages,
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

    const [homeRes, pagesRes] = await Promise.all([
      publishBuilder(eventId, homeData as unknown as Parameters<typeof publishBuilder>[1]),
      publishBuilderPages(eventId),
    ])
    if (homeRes.success && pagesRes.success) {
      setPublishState("published")
      setPublishMsg("Live on the public page.")
      setTimeout(() => setPublishState("idle"), 2000)
    } else {
      setPublishState("error")
      setPublishMsg(homeRes.error || pagesRes.error || "Publish failed.")
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
      <div className="flex flex-col shrink-0 bg-white border-b border-[#1a1a2e]/10">
        {/* Row 1 — back + title + actions */}
        <div className="h-14 w-full flex items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/admin/builder"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1a1a2e]/70 hover:text-[#1a1a2e] transition-colors whitespace-nowrap shrink-0"
              title="Back to Page Builder hub"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <span className="hidden md:block w-px h-5 bg-[#1a1a2e]/10 shrink-0" />
            <span className="text-sm font-semibold truncate text-[#1a1a2e] min-w-0">
              {eventTitle}
            </span>
            <span className="shrink-0"><AutosaveBadge status={status} /></span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex items-center" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setDataMenuOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#1a1a2e]/75 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/5 transition-colors border border-[#1a1a2e]/10 whitespace-nowrap"
                aria-expanded={dataMenuOpen}
                aria-haspopup="menu"
                title="Manage speakers, sessions, tickets, sponsors"
              >
                <Database size={13} />
                <span className="hidden lg:inline">Event data</span>
                <ChevronDown size={11} className={`transition-transform ${dataMenuOpen ? "rotate-180" : ""}`} />
              </button>
              <button
                type="button"
                onClick={handleRefreshData}
                disabled={refreshing}
                title="Re-fetch speakers, sessions, sponsors, tickets"
                aria-label="Refresh event data"
                className="ml-1 inline-flex items-center justify-center w-8 h-8 rounded-md text-xs font-medium text-[#1a1a2e]/75 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/5 transition-colors border border-[#1a1a2e]/10 disabled:opacity-60"
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              </button>
              {dataMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg py-1 z-50">
                  <DataLink href={`/admin/events/${eventId}?tab=speakers`}     icon={Users}         label="Speakers" />
                  <DataLink href={`/admin/events/${eventId}?tab=agenda`}       icon={ClipboardList} label="Sessions & Agenda" />
                  <DataLink href={`/admin/events/${eventId}?tab=tickets`}      icon={Ticket}        label="Tickets" />
                  <DataLink href={`/admin/events/${eventId}?tab=sponsors`}     icon={Building2}     label="Sponsors" />
                  <div className="h-px bg-gray-100 my-1" />
                  <DataLink href={`/admin/events/${eventId}?tab=settings`}     icon={Settings}      label="Event settings" />
                </div>
              )}
            </div>

            <Link
              href={activePage === "home" ? `/events/${eventSlug}` : `/events/${eventSlug}/p/${activePage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#1a1a2e]/75 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/5 transition-colors border border-[#1a1a2e]/10 whitespace-nowrap"
            >
              <ExternalLink size={13} />
              <span className="hidden lg:inline">Preview</span>
            </Link>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishState === "publishing"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-[#e7ab1c] text-[#1a1a2e] hover:bg-[#d49c10] transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {publishState === "publishing"
                ? <Loader2 size={13} className="animate-spin" />
                : publishState === "published"
                  ? <Check size={13} />
                  : <Globe size={13} />}
              {publishState === "publishing"
                ? "Publishing\u2026"
                : publishState === "published"
                  ? "Published"
                  : "Publish"}
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
  }, [eventId, eventSlug, eventTitle, status, publishState, handlePublish, dataMenuOpen, activePage, pages, handleAddPage, handleRenamePage, handleDeletePage, handleDuplicatePage, handleReorderPages, handleRefreshData, refreshing, scrollTabs])

  const overrides = useMemo(() => ({
    header: Header,
  }), [Header])

  return (
    <div className="fixed inset-0 flex flex-col bg-white text-[#1a1a2e]">
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

      <div className="flex-1 min-h-0">
        <Puck
          key={puckKey}
          config={puckConfig}
          data={currentData}
          metadata={metadata as unknown as Record<string, unknown>}
          onChange={(d) => scheduleSave(d as Data)}
          onPublish={handlePublish}
          overrides={overrides}
          iframe={{ enabled: true }}
          viewports={[
            { label: "Desktop", width: 1280, height: "auto" },
            { label: "Tablet",  width: 768,  height: "auto" },
            { label: "Mobile",  width: 390,  height: "auto" },
          ]}
        />
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
    </div>
  )
}

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
    <div className="relative group inline-flex items-center gap-0 shrink-0">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap ${
          active
            ? "bg-white text-[#1a1a2e] border border-[#1a1a2e]/15 shadow-sm"
            : "text-[#1a1a2e]/65 hover:text-[#1a1a2e] hover:bg-white/60 border border-transparent"
        }`}
        title={label}
      >
        {icon}
        <span className="max-w-[160px] truncate">{label}</span>
      </button>
      {(onRename || onDelete || onDuplicate) && active && (
        <>
          {onRename && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRename() }}
              onPointerDown={(e) => e.stopPropagation()}
              className="ml-1 p-1 rounded-md text-[#1a1a2e]/60 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/5"
              title="Rename page"
            >
              <Pencil size={11} />
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDuplicate() }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 rounded-md text-[#1a1a2e]/60 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/5"
              title="Duplicate page"
            >
              <Copy size={11} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 rounded-md text-red-600/70 hover:text-red-700 hover:bg-red-50"
              title="Delete page"
            >
              <Trash2 size={11} />
            </button>
          )}
        </>
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

function AutosaveBadge({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "idle") return null
  const label =
    status === "saving" ? "Saving…"
      : status === "saved" ? "Saved"
        : "Save failed"
  const tone =
    status === "saving" ? "text-[#1a1a2e]/55"
      : status === "saved" ? "text-emerald-600"
        : "text-red-600"
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${tone}`}>
      {status === "saving"
        ? <Loader2 size={10} className="animate-spin" />
        : status === "saved"
          ? <Check size={10} />
          : null}
      {label}
    </span>
  )
}
