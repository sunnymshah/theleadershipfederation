/**
 * Topography pattern in LF gold (#e7ab1c).
 *
 * The 17 KB SVG tile lives in /public/gold-pattern.svg so the browser can
 * cache it across pages and it never bloats the JS bundle.
 */

export const PATTERN_SVG = `url('/gold-pattern.svg')`

/** Main pattern — light sections (Hero, Ecosystem, CTA, Archive) */
export function GoldChevrons({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      aria-hidden
      style={{ backgroundImage: PATTERN_SVG }}
    />
  )
}

/** Section pattern — Archive, EcosystemGrid */
export function GoldStarburst({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      aria-hidden
      style={{ backgroundImage: PATTERN_SVG }}
    />
  )
}
