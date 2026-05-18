/**
 * SectionAmbient — a colour wash that sits behind the liquid-glass cards
 * of a section so the `backdrop-filter` blur has real colour to refract
 * (the "Apple effect").
 *
 * It is an `absolute inset-0` layer: `inset-0` is whitelisted by the
 * `.lf-clean` cleanup in `globals.css`, so its gradient survives the
 * `background-image: none` strip and the decorative `aria-hidden` killer.
 *
 * Drop it as the FIRST child of a `relative overflow-hidden` section, and
 * keep the real content in a sibling `relative z-10` wrapper.
 *
 *  • tone="light" — barely-there wash for white glass sections.
 *  • tone="dark"  — a saturated aurora mesh for dark glass sections, so
 *    the section reads as layered liquid glass instead of a flat slab.
 *
 * Variants shift the colour blobs so stacked sections don't look alike.
 */

type Variant = "a" | "b" | "c"
type Tone = "light" | "dark"

const LIGHT: Record<Variant, string> = {
  a:
    "radial-gradient(46% 52% at 14% 16%, rgba(231,171,28,0.13) 0%, transparent 62%), " +
    "radial-gradient(44% 48% at 88% 30%, rgba(120,144,222,0.11) 0%, transparent 64%), " +
    "radial-gradient(52% 50% at 78% 94%, rgba(231,171,28,0.10) 0%, transparent 66%)",
  b:
    "radial-gradient(46% 50% at 86% 14%, rgba(120,144,222,0.12) 0%, transparent 62%), " +
    "radial-gradient(48% 52% at 10% 44%, rgba(231,171,28,0.12) 0%, transparent 64%), " +
    "radial-gradient(54% 52% at 52% 100%, rgba(231,171,28,0.08) 0%, transparent 68%)",
  c:
    "radial-gradient(44% 46% at 50% 8%, rgba(231,171,28,0.11) 0%, transparent 60%), " +
    "radial-gradient(46% 50% at 8% 90%, rgba(120,144,222,0.10) 0%, transparent 64%), " +
    "radial-gradient(48% 50% at 92% 84%, rgba(231,171,28,0.11) 0%, transparent 66%)",
}

/** Saturated aurora mesh for dark sections — gold + indigo + steel-blue
 *  blobs over a deep near-black base, so dark glass has depth to refract. */
const DARK: Record<Variant, string> = {
  a:
    "radial-gradient(50% 56% at 14% 10%, rgba(231,171,28,0.30) 0%, transparent 58%), " +
    "radial-gradient(48% 54% at 90% 22%, rgba(116,108,255,0.26) 0%, transparent 60%), " +
    "radial-gradient(56% 56% at 80% 98%, rgba(231,171,28,0.22) 0%, transparent 62%), " +
    "radial-gradient(52% 52% at 6% 94%, rgba(70,128,210,0.22) 0%, transparent 64%)",
  b:
    "radial-gradient(50% 56% at 88% 8%, rgba(116,108,255,0.28) 0%, transparent 58%), " +
    "radial-gradient(50% 54% at 8% 36%, rgba(231,171,28,0.28) 0%, transparent 60%), " +
    "radial-gradient(58% 56% at 54% 104%, rgba(231,171,28,0.20) 0%, transparent 64%), " +
    "radial-gradient(50% 52% at 96% 80%, rgba(70,128,210,0.22) 0%, transparent 64%)",
  c:
    "radial-gradient(46% 50% at 50% 4%, rgba(231,171,28,0.26) 0%, transparent 56%), " +
    "radial-gradient(50% 54% at 6% 88%, rgba(116,108,255,0.24) 0%, transparent 60%), " +
    "radial-gradient(50% 52% at 96% 88%, rgba(231,171,28,0.24) 0%, transparent 62%)",
}

export function SectionAmbient({
  variant = "a",
  tone = "light",
}: {
  variant?: Variant
  tone?: Tone
}) {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ background: tone === "dark" ? DARK[variant] : LIGHT[variant] }}
    />
  )
}
