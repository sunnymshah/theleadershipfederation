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
  // Identify the first content block — used by Hero to decide whether
  // to mark its background image priority/fetchPriority. Only the very
  // first LCP-eligible block should be marked.
  const firstContent = Array.isArray(data?.content) ? data.content[0] : null
  const firstBlockId =
    firstContent && typeof firstContent === "object" && "props" in firstContent
      ? ((firstContent as unknown as { props?: { id?: string } }).props?.id ?? null)
      : null

  return (
    <main className="min-h-screen bg-white text-[#1a1a2e]">
      <Render
        config={puckConfig}
        data={data}
        metadata={{
          ...(metadata as unknown as Record<string, unknown>),
          firstBlockId,
        } as unknown as Record<string, unknown>}
      />
    </main>
  )
}
