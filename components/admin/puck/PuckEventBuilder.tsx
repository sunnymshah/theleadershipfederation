"use client"

/**
 * ── PuckEventBuilder ──────────────────────────────────────────────────
 *
 * Wraps Puck's `<Puck>` editor with the admin chrome the rest of the
 * console uses: back button, event title, Preview (opens the public page
 * in a new tab), and Publish. Autosave is debounced and fires
 * `saveBuilderDraft` on every change.
 *
 * Gets mounted from `app/admin/(console)/events/[id]/builder/page.tsx`.
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

  return (
    // Escape the admin shell's padding so the builder can fill edge-to-edge.
    // The admin <main> is the scroll container (overflow-y-auto) with ~p-4
    // padding and the top chrome is ~52px tall — so the builder gets the
    // remaining viewport height minus that bar.
    <div className="-m-3 sm:-m-4 md:-m-6 flex flex-col h-[calc(100vh-52px)] bg-[#0a0a14] text-white">
      {/* ── Chrome top bar ────────────────────────────────────────── */}
      <header className="shrink-0 h-14 flex items-center justify-between px-4 gap-4 bg-[#0a0a14] border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-1.5 text-sm text-white/65 hover:text-white transition-colors"
          >
            <ArrowLeft size={15} /> Events
          </Link>
          <div className="w-px h-5 bg-white/10" />
          <div className="min-w-0">
            <p className="text-xs text-white/45 leading-none">Builder</p>
            <p className="text-sm font-semibold leading-tight truncate max-w-[340px]">
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
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
      </header>

      {publishMsg && (
        <div className={`px-4 py-1.5 text-[11px] font-medium ${
          publishState === "error" ? "bg-red-900/30 text-red-300" : "bg-emerald-900/30 text-emerald-300"
        }`}>
          {publishMsg}
        </div>
      )}

      {/* ── Puck editor fills the rest ────────────────────────────── */}
      <div className="flex-1 min-h-0 bg-white text-[#1a1a2e]">
        <Puck
          config={puckConfig}
          data={seededInitial}
          metadata={metadata as unknown as Record<string, unknown>}
          onChange={(d) => scheduleSave(d as Data)}
          onPublish={handlePublish}
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
    status === "saving" ? "text-white/55"
      : status === "saved" ? "text-emerald-400"
        : "text-red-400"
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] ${tone}`}>
      {status === "saving"
        ? <Loader2 size={10} className="animate-spin" />
        : status === "saved"
          ? <Check size={10} />
          : null}
      {label}
    </span>
  )
}
