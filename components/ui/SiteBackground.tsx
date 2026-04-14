"use client"

/**
 * ── SITE BACKGROUND ───────────────────────────────────────────────────
 * Fixed-position topography pattern — the SAME `PATTERN_SVG` the
 * launch-page Hero uses via <GoldChevrons />. Rendered once at the body
 * root so it covers site pages, admin console, and the login screen.
 *
 * Pages/sections with solid section backgrounds will naturally cover
 * parts of it — the pattern shows through wherever the section canvas
 * is transparent or uses the base `#F4F8FF`.
 */

import { PATTERN_SVG } from "./GoldPattern"

export function SiteBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none -z-10"
      style={{
        backgroundImage: PATTERN_SVG,
        backgroundRepeat: "repeat",
        backgroundSize: "600px 600px",
      }}
    />
  )
}
