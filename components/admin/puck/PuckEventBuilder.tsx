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
import { Puck, type Data } from "@measured/puck"
import "@measured/puck/puck.css"
import {
  ArrowLeft, ExternalLink, Loader2, Check, Globe, ChevronDown,
  Users, Ticket, ClipboardList, Building2, Settings, Database,
  Plus, Pencil, Trash2, Home, FileText,
} from "lucide-react"

import { puckConfig } from "./puck-config"
import type { BuilderMetadata } from "./blocks"
import {
  saveBuilderDraft, publishBuilder,
  saveBuilderPageDraft, publishBuilderPages,
  addBuilderPage, renameBuilderPage, deleteBuilderPage,
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
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [publishState, setPublishState] = useState<"idle" | "publishing" | "published" | "error">("idle")
  const [publishMsg, setPublishMsg] = useState<string | null>(null)

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
  const handleAddPage = useCallback(async () => {
    const title = typeof window !== "undefined"
      ? window.prompt("New page title (e.g. Venue, Agenda, Travel)") ?? ""
      : ""
    if (!title.trim()) return
    const res = await addBuilderPage(eventId, title.trim())
    if (res.success && res.slug) {
      setPages((prev) => ({
        ...prev,
        [res.slug!]: {
          title: title.trim(),
          data: { content: [], root: { props: { title: title.trim() } } },
          order: Object.keys(prev).length,
        },
      }))
      setActivePage(res.slug)
    } else if (res.error) {
      window.alert(res.error)
    }
  }, [eventId])

  const handleRenamePage = useCallback(async (slug: string) => {
    const existing = pages[slug]
    if (!existing) return
    const nextTitle = window.prompt("Rename page", existing.title) ?? ""
    if (!nextTitle.trim() || nextTitle.trim() === existing.title) return
    const res = await renameBuilderPage(eventId, slug, nextTitle.trim())
    if (res.success && res.slug) {
      setPages((prev) => {
        const copy: BuilderPagesMap = { ...prev }
        const row = copy[slug]
        if (!row) return copy
        delete copy[slug]
        copy[res.slug!] = { ...row, title: nextTitle.trim() }
        return copy
      })
      if (activePage === slug) setActivePage(res.slug)
    } else if (res.error) {
      window.alert(res.error)
    }
  }, [eventId, pages, activePage])

  const handleDeletePage = useCallback(async (slug: string) => {
    const existing = pages[slug]
    if (!existing) return
    const ok = window.confirm(`Delete page "${existing.title}"? This can't be undone.`)
    if (!ok) return
    const res = await deleteBuilderPage(eventId, slug)
    if (res.success) {
      setPages((prev) => {
        const copy: BuilderPagesMap = { ...prev }
        delete copy[slug]
        return copy
      })
      if (activePage === slug) setActivePage("home")
    } else if (res.error) {
      window.alert(res.error)
    }
  }, [eventId, pages, activePage])

  /* ── Event-data dropdown (opens separate admin tabs) ─────────────── */
  const [dataMenuOpen, setDataMenuOpen] = useState(false)
  useEffect(() => {
    if (!dataMenuOpen) return
    const close = () => setDataMenuOpen(false)
    window.addEventListener("click", close)
    return () => window.removeEventListener("click", close)
  }, [dataMenuOpen])

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
            <div className="relative" onClick={(e) => e.stopPropagation()}>
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

        {/* Row 2 — page tab strip. "Home" is always first and can't be removed. */}
        <div className="h-11 w-full flex items-center gap-1 px-2 border-t border-[#1a1a2e]/5 bg-[#fafafa] overflow-x-auto">
          <PageTab
            active={activePage === "home"}
            onClick={() => setActivePage("home")}
            icon={<Home size={12} />}
            label="Home"
          />
          {pageList.map(([slug, p]) => (
            <PageTab
              key={slug}
              active={activePage === slug}
              onClick={() => setActivePage(slug)}
              icon={<FileText size={12} />}
              label={p.title}
              onRename={() => handleRenamePage(slug)}
              onDelete={() => handleDeletePage(slug)}
            />
          ))}
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
    )
  }, [eventId, eventSlug, eventTitle, status, publishState, handlePublish, dataMenuOpen, activePage, pages, handleAddPage, handleRenamePage, handleDeletePage])

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
        />
      </div>
    </div>
  )
}

function PageTab({
  active, onClick, icon, label, onRename, onDelete,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  onRename?: () => void
  onDelete?: () => void
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
      {(onRename || onDelete) && active && (
        <>
          {onRename && (
            <button
              type="button"
              onClick={onRename}
              className="ml-1 p-1 rounded-md text-[#1a1a2e]/60 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/5"
              title="Rename page"
            >
              <Pencil size={11} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
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
