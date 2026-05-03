"use client"

/**
 * Featured-toggle switch used inside ManagerTable rows. Optimistic —
 * flips immediately on click, reverts on save error.
 */

import { useState } from "react"
import { Star } from "lucide-react"

export function FeatureSwitch({
  value,
  onChange,
  size = "sm",
  ariaLabel = "Featured",
}: {
  value: boolean
  onChange: (next: boolean) => Promise<{ success: boolean; error?: string } | unknown> | unknown
  size?: "xs" | "sm" | "md"
  ariaLabel?: string
}) {
  const [optimistic, setOptimistic] = useState(value)
  const [busy, setBusy] = useState(false)
  const dim = size === "xs" ? 11 : size === "md" ? 14 : 12
  const cur = optimistic
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={cur}
      disabled={busy}
      onClick={async (e) => {
        e.stopPropagation()
        const next = !cur
        setOptimistic(next)
        setBusy(true)
        try {
          const res = await onChange(next)
          if (res && typeof res === "object" && (res as { success?: boolean }).success === false) {
            setOptimistic(cur)
          }
        } catch {
          setOptimistic(cur)
        } finally {
          setBusy(false)
        }
      }}
      className={`inline-flex items-center justify-center w-6 h-6 rounded ${cur ? "text-amber-400" : "text-[var(--z-text-subtle,#9ca3af)] hover:text-[var(--z-text,#1f2937)]"}`}
      title={cur ? "Featured" : "Click to feature"}
    >
      <Star size={dim} fill={cur ? "currentColor" : "none"} strokeWidth={1.5} />
    </button>
  )
}
