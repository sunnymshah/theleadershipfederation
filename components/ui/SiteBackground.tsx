/**
 * ── SITE BACKGROUND ───────────────────────────────────────────────────
 * Fixed-position topography pattern. The actual SVG lives at
 * /public/gold-pattern.svg so the browser can cache it cross-page and the
 * 17 KB tile never lands in the JS bundle.
 *
 * Pure server component — no client JS needed.
 */

export function SiteBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none -z-10"
      style={{
        backgroundImage: "url('/gold-pattern.svg')",
        backgroundRepeat: "repeat",
        backgroundSize: "600px 600px",
      }}
    />
  )
}
