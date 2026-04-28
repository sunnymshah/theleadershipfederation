/**
 * Site-wide soft-blue gradient background.
 *
 * Pure server component — no client JS, no canvas, no animation. Pinned
 * to the viewport via position:fixed and z-index:-1 so it sits underneath
 * all in-flow content. body / main / .lf-clean are transparent (see
 * globals.css) so this gradient shows through on every page; opaque
 * sections (white cards, dark CTA bands, the admin shell) cover it
 * where contrast would otherwise fail.
 */

export function SiteBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -1,
        backgroundImage: "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)",
      }}
    />
  )
}
