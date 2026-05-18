/**
 * SectionAmbient — a barely-there ambient colour wash that sits behind the
 * liquid-glass cards of a section so the `backdrop-filter` blur has real
 * colour to refract (the "Apple effect").
 *
 * It is an `absolute inset-0` layer: `inset-0` is whitelisted by the
 * `.lf-clean` cleanup in `globals.css`, so its gradient survives the
 * `background-image: none` strip and the decorative `aria-hidden` killer.
 *
 * Drop it as the FIRST child of a `relative overflow-hidden` section, and
 * keep the real content in a sibling `relative z-10` wrapper.
 *
 * Variants shift the colour blobs around so stacked sections don't all
 * look identical as you scroll.
 */

type Variant = "a" | "b" | "c"

const WASHES: Record<Variant, string> = {
  // gold top-left, cool-blue mid-right, gold low-right
  a:
    "radial-gradient(46% 52% at 14% 16%, rgba(231,171,28,0.13) 0%, transparent 62%), " +
    "radial-gradient(44% 48% at 88% 30%, rgba(120,144,222,0.11) 0%, transparent 64%), " +
    "radial-gradient(52% 50% at 78% 94%, rgba(231,171,28,0.10) 0%, transparent 66%)",
  // cool-blue top-right, gold mid-left, soft warm low-centre
  b:
    "radial-gradient(46% 50% at 86% 14%, rgba(120,144,222,0.12) 0%, transparent 62%), " +
    "radial-gradient(48% 52% at 10% 44%, rgba(231,171,28,0.12) 0%, transparent 64%), " +
    "radial-gradient(54% 52% at 52% 100%, rgba(231,171,28,0.08) 0%, transparent 68%)",
  // gold centre-top, cool-blue low-left, warm low-right
  c:
    "radial-gradient(44% 46% at 50% 8%, rgba(231,171,28,0.11) 0%, transparent 60%), " +
    "radial-gradient(46% 50% at 8% 90%, rgba(120,144,222,0.10) 0%, transparent 64%), " +
    "radial-gradient(48% 50% at 92% 84%, rgba(231,171,28,0.11) 0%, transparent 66%)",
}

export function SectionAmbient({ variant = "a" }: { variant?: Variant }) {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ background: WASHES[variant] }}
    />
  )
}
