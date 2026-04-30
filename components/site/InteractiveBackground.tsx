"use client"

/**
 * InteractiveBackground
 * ─────────────────────
 * A "Spline-style" interactive backdrop, hand-tuned to LF brand:
 *   - Warm cream base (#fef9ed → #fdf6e3 → #f8f0da) — same gradient
 *     used by NewsletterSection, so the canvas tonally belongs
 *   - Big, visible gold orbs (#e7ab1c / #c9a84c / #d49c10) drifting
 *     and BREATHING (subtle pulse on radius + alpha) so the scene
 *     never reads as "static"
 *   - Cursor parallax with per-orb depth — far orbs barely move,
 *     near orbs lean noticeably toward the pointer
 *   - Soft vignette at the corners adds depth-of-field
 *   - Default `source-over` compositing — DO NOT switch back to
 *     `lighter`. On a cream base, `lighter` adds RGB values and
 *     bleaches gold orbs into pure white. Source-over paints gold
 *     OVER cream, which is what makes the orbs visibly gold.
 *   - Respects prefers-reduced-motion (one static frame, no RAF)
 *   - Pauses when the tab is hidden (visibilitychange)
 *   - DPR-aware so it looks crisp on retina without burning GPU
 *
 * Why Canvas2D instead of Spline / vanta / tsparticles:
 *   - Ships <4 KB gzipped vs Spline's ~700 KB runtime
 *   - No SSR pain, no Three.js dep, no WebGL context limits
 *
 * Mounted from app/layout.tsx (root) at z-index:-1, so it sits
 * behind every public page — body / main / .lf-clean are all
 * transparent (see globals.css), letting the canvas show through
 * everywhere except inside opaque cards and dark CTA bands.
 */

import { useEffect, useRef } from "react"

// ─── Brand-tuned palette ──────────────────────────────────────────
// Yellow-shifted from the previous orange-leaning set per user feedback —
// every R/G/B has a touch more G and a touch less R, pushing the hue
// from "orange" to "honey-yellow" without going full sunshine. Still
// light enough to keep the surface on the "lighter side".
type OrbColor = readonly [number, number, number]
const HONEY_LIGHT:   OrbColor = [248, 211, 130]  // #f8d382 — pale honey-yellow
const APRICOT_GLOW:  OrbColor = [245, 195, 102]  // #f5c366 — soft golden honey (was apricot)
const WARM_AMBER:    OrbColor = [237, 181, 87]   // #edb557 — warm honey-gold (was orange-amber)
const PEACH_SOFT:    OrbColor = [248, 220, 168]  // #f8dca8 — palest cream-yellow highlight
const GOLD_TOAST:    OrbColor = [231, 184, 94]   // #e7b85e — toasted honey-gold (was orange-toast)
const SUNRISE_PALE:  OrbColor = [251, 229, 184]  // #fbe5b8 — palest yellow-cream

interface Orb {
  // Position in normalised viewport coords (0..1) so we can resize
  // the canvas without recomputing positions.
  x: number
  y: number
  // Drift velocity in normalised coords/frame.
  vx: number
  vy: number
  // Current radius in px (recomputed on resize + on each frame for pulse).
  radius: number
  // Base radius factor (0..1.5) so we can recompute on resize.
  radiusFactor: number
  // Per-orb parallax sensitivity to the cursor (0..1).
  parallax: number
  color: OrbColor
  // Base alpha at the centre of the radial gradient.
  alpha: number
  // Independent breathing — each orb pulses on its own phase so the
  // scene never beats in unison (which would feel mechanical).
  pulsePhase: number
  pulseSpeed: number     // radians per ms
  pulseAmount: number    // 0..0.5 — how much the radius/alpha breathes
}

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // Default cursor to centre so the first frame doesn't snap when the
  // user moves the mouse for the first time.
  const cursorRef = useRef({ x: 0.5, y: 0.5 })
  const targetCursorRef = useRef({ x: 0.5, y: 0.5 })
  const rafRef = useRef<number | null>(null)
  const orbsRef = useRef<Orb[]>([])
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    startTimeRef.current = performance.now()

    // ── Initial orb seed ──────────────────────────────────────────
    // Six big orbs spread across the viewport. Each gets a slightly
    // different pulse speed/phase so the scene feels organic.
    // Alphas dropped to 0.11-0.15 per "lighter" feedback. Orbs are
    // still perceptible drifting circles (faster drift makes the motion
    // read), but the saturation is dialled back so the page surface
    // stays clearly white at a glance instead of warm-tinted.
    orbsRef.current = [
      { x: 0.15, y: 0.20, vx: 0.00024, vy: 0.00016, radiusFactor: 1.05, radius: 0, parallax: 0.045, color: APRICOT_GLOW, alpha: 0.13, pulsePhase: 0,    pulseSpeed: 0.00045, pulseAmount: 0.18 },
      { x: 0.85, y: 0.28, vx: -0.00019, vy: 0.00021, radiusFactor: 0.95, radius: 0, parallax: 0.034, color: WARM_AMBER,   alpha: 0.12, pulsePhase: 1.7,  pulseSpeed: 0.00038, pulseAmount: 0.22 },
      { x: 0.50, y: 0.78, vx: 0.00016, vy: -0.00020, radiusFactor: 1.15, radius: 0, parallax: 0.055, color: GOLD_TOAST,   alpha: 0.11, pulsePhase: 3.1,  pulseSpeed: 0.00052, pulseAmount: 0.16 },
      { x: 0.10, y: 0.88, vx: 0.00020, vy: -0.00013, radiusFactor: 0.85, radius: 0, parallax: 0.032, color: HONEY_LIGHT,  alpha: 0.13, pulsePhase: 4.5,  pulseSpeed: 0.00041, pulseAmount: 0.20 },
      { x: 0.92, y: 0.10, vx: -0.00014, vy: 0.00017, radiusFactor: 0.75, radius: 0, parallax: 0.026, color: PEACH_SOFT,   alpha: 0.15, pulsePhase: 5.8,  pulseSpeed: 0.00048, pulseAmount: 0.15 },
      { x: 0.30, y: 0.55, vx: 0.00012, vy: 0.00011, radiusFactor: 0.70, radius: 0, parallax: 0.040, color: SUNRISE_PALE,  alpha: 0.13, pulsePhase: 2.2,  pulseSpeed: 0.00050, pulseAmount: 0.19 },
    ]

    // ── Sizing ────────────────────────────────────────────────────
    function resize() {
      if (!canvas || !ctx) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const diag = Math.hypot(w, h)
      for (const orb of orbsRef.current) {
        // 0.55 multiplier keeps orbs sized so their soft edges touch
        // ~60% across the viewport at the median radiusFactor — big
        // enough to feel cinematic, small enough that the gold isn't
        // a flat tint everywhere.
        orb.radius = orb.radiusFactor * diag * 0.55
      }
    }
    resize()
    window.addEventListener("resize", resize, { passive: true })

    // ── Cursor tracking ───────────────────────────────────────────
    function onPointer(e: PointerEvent) {
      targetCursorRef.current.x = e.clientX / window.innerWidth
      targetCursorRef.current.y = e.clientY / window.innerHeight
    }
    window.addEventListener("pointermove", onPointer, { passive: true })

    function onTouch(e: TouchEvent) {
      const t = e.touches[0]
      if (!t) return
      targetCursorRef.current.x = t.clientX / window.innerWidth
      targetCursorRef.current.y = t.clientY / window.innerHeight
    }
    window.addEventListener("touchmove", onTouch, { passive: true })

    // ── Tab visibility ────────────────────────────────────────────
    let paused = false
    function onVisibility() {
      paused = document.hidden
      if (!paused && !reducedMotion) loop()
    }
    document.addEventListener("visibilitychange", onVisibility)

    // ── Render loop ───────────────────────────────────────────────
    function draw() {
      if (!ctx || !canvas) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.width / dpr
      const h = canvas.height / dpr
      const elapsed = performance.now() - startTimeRef.current

      // ── Cream base wash ─────────────────────────────────────────
      // Three-stop diagonal gradient mirrors NewsletterSection's
      // `linear-gradient(135deg, #fdf6e3, #fef9ed, #f8f0da)` so the
      // canvas tonally belongs to the rest of the brand.
      const base = ctx.createLinearGradient(0, 0, w, h)
      // Pure white at the top-left fading to a barely-perceptible warm
      // tint at the bottom-right. The previous version (#fffefb →
      // #fcfaf3) still had measurable warmth across the whole canvas,
      // which competed with the orbs and made it hard to see them
      // drifting. Pure-white-with-hint gives the orbs a clean canvas
      // to register against.
      base.addColorStop(0,    "#ffffff")
      base.addColorStop(0.6,  "#fffefc")
      base.addColorStop(1,    "#fefcf6")
      ctx.fillStyle = base
      ctx.fillRect(0, 0, w, h)

      // ── Cursor lerp ─────────────────────────────────────────────
      // 0.06 = ~10-frame ease, weighted enough to feel cinematic but
      // not laggy.
      cursorRef.current.x += (targetCursorRef.current.x - cursorRef.current.x) * 0.06
      cursorRef.current.y += (targetCursorRef.current.y - cursorRef.current.y) * 0.06
      const dx = (cursorRef.current.x - 0.5)
      const dy = (cursorRef.current.y - 0.5)

      // ── Orbs ────────────────────────────────────────────────────
      // IMPORTANT: leave compositing on default `source-over`. On a
      // cream base, `lighter` mode adds RGB and bleaches gold into
      // pure white. We learned this the hard way.
      for (const orb of orbsRef.current) {
        if (!reducedMotion) {
          orb.x += orb.vx
          orb.y += orb.vy
          if (orb.x < -0.05 || orb.x > 1.05) orb.vx *= -1
          if (orb.y < -0.05 || orb.y > 1.05) orb.vy *= -1
        }

        // Breathing — sin wave on radius and alpha. Keeps the scene
        // feeling alive even when the user hasn't moved the mouse.
        const pulse = reducedMotion
          ? 0
          : Math.sin(orb.pulsePhase + elapsed * orb.pulseSpeed)
        const radius = orb.radius * (1 + pulse * orb.pulseAmount)
        const alpha = orb.alpha * (1 + pulse * orb.pulseAmount * 0.4)

        // Parallax-shifted draw position
        const px = (orb.x + dx * orb.parallax) * w
        const py = (orb.y + dy * orb.parallax) * h

        const grad = ctx.createRadialGradient(px, py, 0, px, py, radius)
        const [r, g, b] = orb.color
        // Steeper falloff (0 → 0.5 → 1) than before (0 → 0.4 → 1) so
        // the orb has a defined "core" instead of bleeding everywhere.
        grad.addColorStop(0,    `rgba(${r}, ${g}, ${b}, ${alpha})`)
        grad.addColorStop(0.5,  `rgba(${r}, ${g}, ${b}, ${alpha * 0.25})`)
        grad.addColorStop(1,    `rgba(${r}, ${g}, ${b}, 0)`)
        ctx.fillStyle = grad
        ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2)
      }

      // Vignette removed — it was adding subtle navy darkening at the
      // corners that, combined with the warm orbs, made the surface
      // feel busier than the user wanted. The clean cream wash + barely
      // there orbs read more confidently without it.
    }

    function loop() {
      if (paused) return
      draw()
      rafRef.current = window.requestAnimationFrame(loop)
    }

    if (reducedMotion) {
      draw()
    } else {
      loop()
    }

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", onPointer)
      window.removeEventListener("touchmove", onTouch)
      document.removeEventListener("visibilitychange", onVisibility)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      // Inline zIndex:-1 mirrors the old SiteBackground component this
      // replaces — the public-site CSS architecture (transparent body /
      // .lf-clean) was hand-tuned for a fixed -1 backdrop.
      // pointer-events-none = never steals clicks. aria-hidden = silent
      // for screen readers.
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    />
  )
}
