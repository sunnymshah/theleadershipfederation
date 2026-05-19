"use client"

/**
 * ── BuilderMain ──────────────────────────────────────────────────────
 *
 * Clean rebuild of the event page builder.
 *
 * It uses Puck's STOCK editor UI — left component list · centre canvas ·
 * right field panel · top header — instead of the ~1,700-line custom
 * chrome in PuckEventBuilder. That custom chrome was the source of the
 * collisions, clutter and flaky behaviour; Puck's own editor is a clean,
 * well-tested 3-panel layout (the same shape as GrapesJS / Webflow).
 *
 * It reuses the exact same block library (`puckConfig`) and the same
 * data model (`events.builder_draft` / `builder_data`), so it is fully
 * compatible: the old PuckEventBuilder remains available as a fallback
 * and both edit the same content.
 */

import { useCallback, useRef, useState } from "react"
import Link from "next/link"
import { Puck, type Data } from "@measured/puck"
import "@measured/puck/puck.css"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { puckConfig } from "../puck-config"
import type { BuilderMetadata } from "../blocks"
import { saveBuilderDraft, publishBuilderAtomic } from "@/app/actions/eventBuilderActions"

type SaveState = "idle" | "saving" | "saved" | "error"

interface BuilderMainProps {
  eventId: string
  eventTitle: string
  eventSlug: string
  initialData: Data
  metadata: BuilderMetadata
}

export function BuilderMain({
  eventId,
  eventTitle,
  eventSlug,
  initialData,
  metadata,
}: BuilderMainProps) {
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced draft autosave — fires 700ms after the last edit.
  const scheduleSave = useCallback(
    (data: Data) => {
      setSaveState("saving")
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        const res = await saveBuilderDraft(
          eventId,
          data as unknown as Parameters<typeof saveBuilderDraft>[1],
        )
        setSaveState(res.success ? "saved" : "error")
      }, 700)
    },
    [eventId],
  )

  // Publish — writes builder_data (the snapshot the public page renders).
  const handlePublish = useCallback(
    async (data: Data) => {
      setSaveState("saving")
      const res = await publishBuilderAtomic(
        eventId,
        data as unknown as Parameters<typeof publishBuilderAtomic>[1],
      )
      setSaveState(res.success ? "saved" : "error")
    },
    [eventId],
  )

  const statusLabel =
    saveState === "saving" ? "Saving…"
    : saveState === "saved" ? "All changes saved"
    : saveState === "error" ? "Save failed — retry"
    : ""

  // Inject Back / View-live / status next to Puck's stock Publish button.
  // This is the only override — everything else is Puck's default UI.
  const overrides = {
    headerActions: ({ children }: { children: React.ReactNode }) => (
      <div className="flex items-center gap-1.5">
        <Link
          href="/admin/builder"
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-[13px] font-medium text-[#1d1d1f]/65 hover:text-[#1d1d1f] hover:bg-black/[0.05] transition-colors"
        >
          <ArrowLeft size={15} /> Builders
        </Link>
        <a
          href={`/events/${eventSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-[13px] font-medium text-[#1d1d1f]/65 hover:text-[#1d1d1f] hover:bg-black/[0.05] transition-colors"
        >
          View live <ExternalLink size={13} />
        </a>
        {statusLabel && (
          <span
            className={
              "text-[12px] tabular-nums px-1.5 " +
              (saveState === "error" ? "text-red-500" : "text-[#1d1d1f]/45")
            }
          >
            {statusLabel}
          </span>
        )}
        {children}
      </div>
    ),
  }

  return (
    <div
      className="builder-main h-screen"
      style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif" }}
    >
      <Puck
        config={puckConfig}
        data={initialData}
        metadata={{
          ...(metadata as unknown as Record<string, unknown>),
          editor: true,
        }}
        headerTitle={eventTitle}
        headerPath="Page Builder"
        onChange={(d) => scheduleSave(d as Data)}
        onPublish={(d) => handlePublish(d as Data)}
        overrides={overrides}
        iframe={{ enabled: true }}
      />
    </div>
  )
}
