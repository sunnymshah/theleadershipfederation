"use client"

/**
 * ── Public renderer for Puck event-page data ──────────────────────────
 *
 * Mounted from `app/(site)/events/[slug]/page.tsx` when the event has
 * `builder_data`. Uses Puck's `<Render>`, which walks the config +
 * data tree and renders each block component.
 *
 * "use client" is required because our block components themselves use
 * "use client" (Image, Link, interactive details). Puck doesn't need
 * a React-server-component-specific entry for this use case.
 */

import { Render, type Data } from "@measured/puck"
import { puckConfig } from "./puck-config"
import type { BuilderMetadata } from "./blocks"

export function PuckPublicRenderer({
  data,
  metadata,
}: {
  data: Data
  metadata: BuilderMetadata
}) {
  // Filter blocks marked as hidden via the Eye-toggle in the section
  // context menu. Each block's __hidden prop is set by the editor's
  // SectionContextMenu / per-instance hide control.
  const visibleContent = Array.isArray(data?.content)
    ? data.content.filter(
        (b) => !((b as { props?: { __hidden?: boolean } }).props?.__hidden === true)
      )
    : data?.content
  const visibleData = { ...data, content: visibleContent } as Data

  const firstContent = Array.isArray(visibleData?.content) ? visibleData.content[0] : null
  const firstBlockId =
    firstContent && typeof firstContent === "object" && "props" in firstContent
      ? ((firstContent as unknown as { props?: { id?: string } }).props?.id ?? null)
      : null

  return (
    <main className="min-h-screen bg-white text-[#1a1a2e]">
      <Render
        config={puckConfig}
        data={visibleData}
        metadata={{
          ...(metadata as unknown as Record<string, unknown>),
          firstBlockId,
        } as unknown as Record<string, unknown>}
      />
    </main>
  )
}
