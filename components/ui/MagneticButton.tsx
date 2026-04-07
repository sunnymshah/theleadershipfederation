"use client"

import { useRef, useState, useCallback } from "react"

interface MagneticButtonProps {
  children: React.ReactNode
  className?: string
  magnetStrength?: number
}

export function MagneticButton({
  children,
  className = "",
  magnetStrength = 0.3,
}: MagneticButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = containerRef.current
      if (!el) return

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const distX = e.clientX - centerX
        const distY = e.clientY - centerY
        const distance = Math.sqrt(distX * distX + distY * distY)

        const radius = 100
        if (distance < radius) {
          const strength = (1 - distance / radius) * magnetStrength
          const maxOffset = 8
          setOffset({
            x: distX * strength * (maxOffset / radius),
            y: distY * strength * (maxOffset / radius),
          })
        } else {
          setOffset({ x: 0, y: 0 })
        }

        rafRef.current = null
      })
    },
    [magnetStrength]
  )

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setOffset({ x: 0, y: 0 })
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        display: "inline-block",
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition:
          offset.x === 0 && offset.y === 0
            ? "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)"
            : "transform 0.12s ease-out",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  )
}
