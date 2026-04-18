"use client"

/**
 * ── PuckEventBuilder ──────────────────────────────────────────────────
 *
 * Fullscreen wrapper around Puck's `<Puck>` editor. Uses the `overrides`
 * API to REPLACE Puck's default header actions with our own so there's
 * exactly ONE Publish button (the screenshot-reported duplicate bug).
 *
 *   overrides.headerActions → our [Autosave-badge | Preview | Publish]
 *   overrides.headerTitle   → our Back-arrow + event-title group
 *
 * Mounted from `app/admin/builder/[id]/page.tsx`, which lives OUTSIDE
 * the `(console)` route group so the editor owns the entire viewport —
 * no admin sidebar, no top bar, just `h-screen w-screen`.
 *
 * Autosave is debounced 700ms (fires `saveBuilderDraft`); publish flushes
 * any pending save first so it can't race a stale draft.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Puck, type Data } from "@measured/puck"
import "@measured/puck/puck.css"
import { ArrowLeft, ExternalLink, Loader2, Check, Globe, ChevronDown, Users, Ticket, ClipboardList, Building2, Settings, Database } from "lucide-react"

import { puckConfig } from "./puck-config"
import type { BuilderMetadata } from "./blocks"
import {
  saveBuilderDraft, publishBuilder,
} from "@/app/actions/eventBuilderActions"

export function PuckEventBuilder({
  eventId,
  eventTitle,
  eventSlug,
  initialData,
  metadata,
}: {
  eventId: string
  eventTitle: string
  eventSlug: string
  initialData: Data | null
  metadata: BuilderMetadata
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [publishState, setPublishState] = useState<"idle" | "publishing" | "published" | "error">("idle")
  const [publishMsg, setPublishMsg] = useState<string | null>(null)

  // Seed Puck with at least an empty structure so it never mounts undefined.
  const seededInitial: Data = useMemo(
    () =>
      initialData && typeof initialData === "object"
        ? (initialData as Data)
        : { content: [], root: { props: { title: eventTitle } } },
    [initialData, eventTitle],
  )

  /* ── Autosave (debounced 700ms) ─────────────────────────────────── */
  const lastDataRef = useRef<Data>(seededInitial)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleSave = useCallback((data: Data) => {
    lastDataRef.current = data
    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus("saving")
    timerRef.current = setTimeout(async () => {
      const res = await saveBuilderDraft(eventId, data as unknown as Parameters<typeof saveBuilderDraft>[1])
      setStatus(res.success ? "saved" : "error")
      if (res.success) {
        // Flip back to idle after a beat so the green pulse fades.
        setTimeout(() => setStatus("idle"), 1200)
      }
    }, 700)
  }, [eventId])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  /* ── Publish ────────────────────────────────────────────────────── */
  const handlePublish = useCallback(async () => {
    setPublishState("publishing")
    setPublishMsg(null)
    // Flush pending autosave first so publish can't race a stale draft.
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      await saveBuilderDraft(eventId, lastDataRef.current as unknown as Parameters<typeof saveBuilderDraft>[1])
    }
    const res = await publishBuilder(
      eventId,
      lastDataRef.current as unknown as Parameters<typeof publishBuilder>[1],
    )
    if (res.success) {
      setPublishState("published")
      setPublishMsg("Live on the public page.")
      setTimeout(() => setPublishState("idle"), 2000)
    } else {
      setPublishState("error")
      setPublishMsg(res.error || "Publish failed.")
    }
  }, [eventId])

  /* ── Event-data menu ───────────────────────────────────────────────── *
   * Quick access to the event's Sessions / Speakers / Tickets / Sponsors
   * from inside the builder. Every link opens in a NEW TAB so the user's
   * current Puck editing state (undo history, selection) isn't lost.     */
  const [dataMenuOpen, setDataMenuOpen] = useState(false)
  useEffect(() => {
    if (!dataMenuOpen) return
    const close = () => setDataMenuOpen(false)
    window.addEventListener("click", close)
    return () => window.removeEventListener("click", close)
  }, [dataMenuOpen])

  /* ── Header override (replaces Puck's built-in header entirely) ──── *
   * We drop `actions` and `children` on purpose — the custom bar below
   * already carries Back, title, autosave, Preview, and a single Publish
   * button. Keeping Puck's default actions would re-introduce the
   * duplicate-Publish bug.                                              */
  const Header = useCallback(() => (
    <div className="h-14 w-full shrink-0 flex items-center justify-between gap-3 px-4 bg-white border-b border-[#1a1a2e]/10">
      {/* LEFT: back + title + autosave — all in one tight horizontal row */}
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

      {/* RIGHT: actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Event data dropdown — same controls as the event detail page */}
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
          href={`/events/${eventSlug}`}
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
  ), [eventId, eventTitle, eventSlug, status, publishState, handlePublish, dataMenuOpen])

  const overrides = useMemo(() => ({
    header: Header,
  }), [Header])

  return (
    // Fullscreen — we're outside the (console) shell so we can fill the
    // whole viewport. The Puck chrome supplies its own header strip.
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
          config={puckConfig}
          data={seededInitial}
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
