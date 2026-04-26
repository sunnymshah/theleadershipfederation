"use client"

/**
 * Site-wide animated TOPOLOGY background (vanta.js + p5.js).
 *
 * Lives once in the root layout. Pinned to the viewport via position:fixed
 * and z-index:-1 so it sits underneath all in-flow content. body/main
 * backgrounds are transparent (see globals.css) so this canvas is visible
 * through unbranded marketing sections; opaque sections (dark CTA bands,
 * white cards, the admin shell) cover it where contrast would otherwise
 * fail.
 *
 * TOPOLOGY uses p5.js (CPU canvas rendering), not three.js, so it's
 * heavier than the WebGL-based effects. Acceptable for the marketing
 * surface; admin chrome is still opaque so it remains snappy.
 */

import { useEffect, useRef } from "react"

type VantaInstance = { destroy: () => void; resize?: () => void }

export function SiteBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const effectRef = useRef<VantaInstance | null>(null)

  useEffect(() => {
    if (effectRef.current) return
    if (!containerRef.current) return

    let cancelled = false

    ;(async () => {
      const p5Module = await import("p5")
      const p5 = p5Module.default
      const { default: TOPOLOGY } = await import("vanta/dist/vanta.topology.min")

      if (cancelled || !containerRef.current) return

      effectRef.current = TOPOLOGY({
        el: containerRef.current,
        p5,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x2,
        backgroundColor: 0xf2e8bf,
      }) as VantaInstance
    })()

    return () => {
      cancelled = true
      if (effectRef.current) {
        try { effectRef.current.destroy() } catch {}
        effectRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  )
}
