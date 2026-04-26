/**
 * Twitter card — same image as opengraph-image, just a separate
 * route conventionally so Next.js wires it into the metadata.
 * The runtime config can't be re-exported (Next.js statically parses
 * it), so we duplicate the literals.
 */

import { ImageResponse } from "next/og"
import { getEvent } from "@/lib/get-event"

export const runtime = "nodejs"
export const alt = "Event card"
export const contentType = "image/png"
export const size = { width: 1200, height: 630 }

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  })
}

export default async function TwitterImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEvent(slug)
  const title = event?.title ?? "The Leadership Federation"
  const venue = event?.venue ?? ""
  const dateStr = event?.start_date
    ? event.end_date && event.end_date !== event.start_date
      ? `${fmtDate(event.start_date)} — ${fmtDate(event.end_date)}`
      : fmtDate(event.start_date)
    : ""

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #0a0a14 0%, #1a1a2e 60%, #2a2a4e 100%)",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#e7ab1c" }} />
          <span style={{ fontSize: 18, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.65)", fontWeight: 700 }}>
            The Leadership Federation
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, maxWidth: 1000, color: "#fff" }}>
            {title}
          </div>
          {dateStr ? <div style={{ fontSize: 24, color: "#e7ab1c", fontWeight: 600 }}>{dateStr}</div> : null}
          {venue ? <div style={{ fontSize: 22, color: "rgba(255,255,255,0.7)" }}>{venue}</div> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 16, color: "rgba(255,255,255,0.55)", letterSpacing: 1 }}>
          <span>leadershipfederation.com</span>
          <span style={{ textTransform: "uppercase", letterSpacing: 4 }}>Premium events</span>
        </div>
      </div>
    ),
    size,
  )
}
