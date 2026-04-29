"use client"

/**
 * InteractiveBackground
 * ─────────────────────
 * A "Spline-style" interactive backdrop, hand-tuned to LF brand:
 *   - Cream base (#F4F8FF) — the lighter side, as requested
 *   - Soft gold orbs (#e7ab1c / #c9a84c / #d49c10) drifting slowly
 *   - Faint navy accent orb (#1a1a2e at very low alpha) for depth
 *   - Cursor parallax — orbs gently lean toward the pointer
 *   - Idle drift physics so it never feels static even without input
 *   - Respects prefers-reduced-motion (renders one static frame)
 *   - Pauses when the tab is hidden (visibilitychange)
 *   - DPR-aware so it looks crisp on retina without burning GPU
 *
 * Why Canvas2D instead of Spline / vanta / tsparticles:
 *   - Ships <3 KB gzipped vs Spline's ~700 KB runtime
 *   - No SSR pain, no Three.js dep, no WebGL context limits
 *   - Looks identical to a hand-crafted Spline scene at this fidelity
 *     (soft gaussian-ish blobs are visually the same in 2D + radial
 *     gradients; the "3D-ness" of Spline only matters with hard
 *     edges and reflective materials we aren't using)
 *
 * Mounted as `fixed inset-0 -z-10` from the site layout — it lives
 * behind every page including the frosted-glass navbar, which makes
 * the Apple-style backdrop-blur in <Navbar/> read as premium glass
 * instead of flat white.
 */

import { useEffect, useRef } from "react"

// ─── Brand-tuned palette ──────────────────────────────────────────
// Gold hex values mirror Navbar.tsx + tailwind.config; cream base tones
// mirror NewsletterSection's `linear-gradient(135deg, #fdf6e3, #fef9ed,
// #f8f0da)` so the canvas tonally matches the rest of the marketing
// surface — warm ivory with gold accents, not cold blue-white.
type OrbColor = readonly [number, number, number]
const GOLD_BRIGHT: OrbColor = [231, 171, 28]   // #e7ab1c — primary gold
const GOLD_WARM:   OrbColor = [201, 168, 76]   // #c9a84c — muted brass
const GOLD_DEEP:   OrbColor = [212, 156, 16]   // #d49c10 — saturated gold
const GOLD_PALE:   OrbColor = [243, 220, 130]  // #f3dc82 — soft champagne, replaces the cool navy depth orb

interface Orb {
  // Position in normalised viewport coords (0..1) so we can resize
  // the canvas without recomputing positions.
  x: number
  y: number
  // Drift velocity, also normalised — added to x/y each frame.
  vx: number
  vy: number
  // Radius in px. Re-derived from canvas dims so it scales with viewport.
  radius: number
  // Base radius factor (0..1) so we can recompute on resize.
  radiusFactor: number
  // Per-orb parallax sensitivity to the cursor (0..1).
  parallax: number
  color: OrbColor
  // Alpha at the centre of the radial gradient.
  alpha: number
}

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // Cursor position in normalised coords, default to centre so first
  // frame doesn't snap when the user moves the mouse for the first time.
  const cursorRef = useRef({ x: 0.5, y: 0.5 })
  const targetCursorRef = useRef({ x: 0.5, y: 0.5 })
  const rafRef = useRef<number | null>(null)
  const orbsRef = useRef<Orb[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    // ── Reduced-motion guard ──────────────────────────────────────
    // Render one static composition and bail out of the RAF loop.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // ── Initial orb seed ──────────────────────────────────────────
    // Spread positions evenly-ish using deterministic angles so the
    // composition feels balanced on first paint instead of clumpy.
    // Five orbs is the sweet spot — fewer feels empty, more starts
    // looking busy and tanks fill rate on low-end GPUs.
    // Alphas roughly doubled vs first cut. The previous values (0.28–0.42)
    // looked great on a pure white test, but vanished on the live cream
    // base because cream + low-alpha-gold reads as "barely warm cream"
    // instead of a visible orb. These need to actually be gold.
    orbsRef.current = [
      // Top-left bright gold — anchors the navbar area
      { x: 0.18, y: 0.22, vx: 0.00012, vy: 0.00009, radiusFactor: 0.55, radius: 0, parallax: 0.025, color: GOLD_BRIGHT, alpha: 0.78 },
      // Right side warm brass — balances the hero CTA
      { x: 0.82, y: 0.35, vx: -0.00009, vy: 0.00011, radiusFactor: 0.50, radius: 0, parallax: 0.020, color: GOLD_WARM, alpha: 0.68 },
      // Centre-low deep gold — pulls the eye into the page
      { x: 0.50, y: 0.78, vx: 0.00008, vy: -0.00010, radiusFactor: 0.60, radius: 0, parallax: 0.030, color: GOLD_DEEP, alpha: 0.62 },
      // Bottom-left soft warm — fills the lower-left corner
      { x: 0.12, y: 0.85, vx: 0.00010, vy: -0.00007, radiusFactor: 0.45, radius: 0, parallax: 0.018, color: GOLD_WARM, alpha: 0.55 },
      // Top-right pale champagne — adds depth without going blue/cold
      { x: 0.92, y: 0.08, vx: -0.00007, vy: 0.00008, radiusFactor: 0.40, radius: 0, parallax: 0.015, color: GOLD_PALE, alpha: 0.45 },
    ]

    // ── Sizing ────────────────────────────────────────────────────
    // Use device pixel ratio for crispness, but cap at 2 — going
    // beyond 2x on phones doubles GPU cost for no perceptible gain.
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
      // Scale orb radii to viewport diagonal so the composition
      // stays proportional across phone, tablet, desktop.
      const diag = Math.hypot(w, h)
      for (const orb of orbsRef.current) {
        orb.radius = orb.radiusFactor * diag * 0.55
      }
    }
    resize()
    window.addEventListener("resize", resize, { passive: true })

    // ── Cursor tracking ───────────────────────────────────────────
    // We track a TARGET position from raw mouse events and lerp the
    // displayed cursorRef toward it each frame. This produces the
    // smooth "weighted" feel — an instant orb-snap to the cursor
    // would feel cheap and twitchy.
    function onPointer(e: PointerEvent) {
      targetCursorRef.current.x = e.clientX / window.innerWidth
      targetCursorRef.current.y = e.clientY / window.innerHeight
    }
    window.addEventListener("pointermove", onPointer, { passive: true })

    // ── Touch fallback ────────────────────────────────────────────
    // pointermove works on most modern mobile browsers, but iOS
    // Safari sometimes coalesces them weirdly — listen to touchmove
    // too as a belt-and-braces.
    function onTouch(e: TouchEvent) {
      const t = e.touches[0]
      if (!t) return
      targetCursorRef.current.x = t.clientX / window.innerWidth
      targetCursorRef.current.y = t.clientY / window.innerHeight
    }
    window.addEventListener("touchmove", onTouch, { passive: true })

    // ── Tab visibility ────────────────────────────────────────────
    // Stop the loop when tab is hidden — saves battery and avoids
    // background-tab throttling jank when the user returns.
    let paused = false
    function onVisibility() {
      paused = document.hidden
      if (!paused && !reducedMotion) loop()
    }
    document.addEventListener("visibilitychange", onVisibility)

    // ── Render loop ───────────────────────────────────────────────
    function draw() {
      if (!ctx || !canvas) return
      const w = canvas.width / (Math.min(window.devicePixelRatio || 1, 2))
      const h = canvas.height / (Math.min(window.devicePixelRatio || 1, 2))

      // Warm cream base wash — colours mirror the LF cream gradient used
      // on NewsletterSection so the canvas tonally belongs to the rest of
      // the brand. Diagonal 135° feel: light comes from upper-left.
      // Earlier draft used #FBFCFF → #F0F4FB which technically ARE
      // "light" but have more blue than red/green, so they rendered as
      // cool blue-white — visually indistinguishable from the previous
      // soft-blue gradient that the canvas was supposed to replace.
      const base = ctx.createLinearGradient(0, 0, w, h)
      base.addColorStop(0,    "#fef9ed")  // softest cream
      base.addColorStop(0.5,  "#fdf6e3")  // warm ivory mid-stop
      base.addColorStop(1,    "#f8f0da")  // toasted cream
      ctx.fillStyle = base
      ctx.fillRect(0, 0, w, h)

      // Composite the orbs additively-ish via 'lighter' so overlapping
      // golds brighten rather than muddy — same trick used by Apple's
      // marketing pages and Stripe's hero gradients.
      ctx.globalCompositeOperation = "lighter"

      // Lerp displayed cursor toward target — 0.05 = ~12-frame ease.
      cursorRef.current.x += (targetCursorRef.current.x - cursorRef.current.x) * 0.05
      cursorRef.current.y += (targetCursorRef.current.y - cursorRef.current.y) * 0.05

      // Cursor offset from centre, used to nudge each orb. Multiplied
      // by per-orb parallax sensitivity for non-uniform parallax —
      // closer orbs (bigger parallax value) move more, distant orbs
      // barely shift, which sells the depth illusion.
      const dx = (cursorRef.current.x - 0.5)
      const dy = (cursorRef.current.y - 0.5)

      for (const orb of orbsRef.current) {
        if (!reducedMotion) {
          // Idle drift
          orb.x += orb.vx
          orb.y += orb.vy
          // Soft bounce off the edges — keeps orbs in viewport without
          // a hard wall feeling. We bounce a touch INSIDE 0..1 so a
          // partial orb is always visible at every edge.
          if (orb.x < -0.05 || orb.x > 1.05) orb.vx *= -1
          if (orb.y < -0.05 || orb.y > 1.05) orb.vy *= -1
        }

        // Parallax-shifted draw position
        const px = (orb.x + dx * orb.parallax) * w
        const py = (orb.y + dy * orb.parallax) * h

        const grad = ctx.createRadialGradient(px, py, 0, px, py, orb.radius)
        const [r, g, b] = orb.color
        grad.addColorStop(0,    `rgba(${r}, ${g}, ${b}, ${orb.alpha})`)
        grad.addColorStop(0.4,  `rgba(${r}, ${g}, ${b}, ${orb.alpha * 0.35})`)
        grad.addColorStop(1,    `rgba(${r}, ${g}, ${b}, 0)`)
        ctx.fillStyle = grad
        ctx.fillRect(px - orb.radius, py - orb.radius, orb.radius * 2, orb.radius * 2)
      }

      // Reset composite mode so subsequent frames start clean.
      ctx.globalCompositeOperation = "source-over"

      // Whisper-thin warm-toned haze — disguises gradient banding on
      // some monitors and adds depth-of-field. Tinted with the brand
      // navy at near-zero alpha for a hint of cool contrast against
      // the cream wash without ever turning the surface blue.
      ctx.fillStyle = "rgba(26, 26, 46, 0.008)"
      ctx.fillRect(0, 0, w, h)
    }

    function loop() {
      if (paused) return
      draw()
      rafRef.current = window.requestAnimationFrame(loop)
    }

    if (reducedMotion) {
      // One static frame; honour the user's preference and skip RAF.
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
      // .lf-clean) was hand-tuned for a fixed -1 backdrop and switching
      // to a Tailwind -z-10 created a stacking-context fight with
      // sibling elements at root layout. Stay on the proven layer.
      // pointer-events-none = never steals clicks. aria-hidden = silent
      // for screen readers.
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    />
  )
}
