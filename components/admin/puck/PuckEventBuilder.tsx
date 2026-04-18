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
import { ArrowLeft, ExternalLink, Loader2, Check, Globe } from "lucide-react"

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

  /* ── Header override (replaces Puck's built-in header entirely) ──── *
   * We drop `actions` and `children` on purpose — the custom bar below
   * already carries Back, title, autosave, Preview, and a single Publish
   * button. Keeping Puck's default actions would re-introduce the
   * duplicate-Publish bug.                                              */
  const Header = useCallback(() => (
    <div className="h-14 shrink-0 flex items-center justify-between gap-4 px-4 bg-white border-b border-[#1a1a2e]/10">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href={`/admin/events/${eventId}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#1a1a2e]/70 hover:text-[#1a1a2e] transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <div className="w-px h-5 bg-[#1a1a2e]/15" />
        <div className="min-w-0">
          <p className="text-[10px] text-[#1a1a2e]/50 leading-none uppercase tracking-[0.12em] font-semibold">Page Builder</p>
          <p className="text-sm font-semibold leading-tight truncate max-w-[340px] text-[#1a1a2e]">
            {eventTitle}
          </p>
        </div>
        <AutosaveBadge status={status} />
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/events/${eventSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#1a1a2e]/75 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/5 transition-colors border border-[#1a1a2e]/10"
        >
          <ExternalLink size={13} /> Preview
        </Link>
        <button
          type="button"
          onClick={handlePublish}
          disabled={publishState === "publishing"}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold bg-[#e7ab1c] text-[#1a1a2e] hover:bg-[#d49c10] transition-colors disabled:opacity-60"
        >
          {publishState === "publishing"
            ? <Loader2 size={13} className="animate-spin" />
            : publishState === "published"
              ? <Check size={13} />
              : <Globe size={13} />}
          {publishState === "publishing"
            ? "Publishing…"
            : publishState === "published"
              ? "Published"
              : "Publish"}
        </button>
      </div>
    </div>
  ), [eventId, eventTitle, eventSlug, status, publishState, handlePublish])

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
