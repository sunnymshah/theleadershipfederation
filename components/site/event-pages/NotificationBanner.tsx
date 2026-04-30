"use client"

/**
 * Sticky notification banner above EventTopNav (ITEM 10.1).
 *
 * Reads enabled / message / link / linkLabel / dismissable / displayUntil
 * from builder_settings.notification and renders a yellow-tinted strip.
 * When dismissable is on, an X persists the dismissal in localStorage
 * keyed per (eventId, message) so editing the message resets the chip.
 */

import { useEffect, useState } from "react"
import { X } from "lucide-react"

export function NotificationBanner({
  eventId,
  message,
  link,
  linkLabel,
  dismissable,
  displayUntil,
}: {
  eventId: string
  message: string
  link?: string
  linkLabel?: string
  dismissable?: boolean
  displayUntil?: string
}) {
  const [hidden, setHidden] = useState<boolean | null>(null)
  const [expired, setExpired] = useState(false)
  const storageKey = `lf-notif:${eventId}:${message.slice(0, 40)}`

  useEffect(() => {
    if (!dismissable) { setHidden(false); return }
    try {
      const v = localStorage.getItem(storageKey)
      setHidden(v === "1")
    } catch {
      setHidden(false)
    }
  }, [storageKey, dismissable])

  // Display-until cutoff (if set, hide once the date passes). Reading
  // Date.now() in render is impure; do it inside an effect.
  useEffect(() => {
    if (!displayUntil) { setExpired(false); return }
    const t = new Date(displayUntil).getTime()
    if (!Number.isFinite(t)) { setExpired(false); return }
    setExpired(Date.now() > t + 24 * 3600_000)
  }, [displayUntil])

  if (expired || hidden === null || hidden) return null

  function dismiss() {
    try { localStorage.setItem(storageKey, "1") } catch {}
    setHidden(true)
  }

  return (
    <div
      role="status"
      className="w-full bg-[var(--lf-primary,#e7ab1c)]/15 border-b border-[var(--lf-primary,#e7ab1c)]/40 text-[#1a1a2e]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
        <p className="flex-1 text-[12px] sm:text-[13px] font-semibold">
          {message}
          {link && linkLabel && (
            <a href={link} className="ml-2 underline hover:no-underline">
              {linkLabel}
            </a>
          )}
        </p>
        {dismissable && (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="p-1 rounded hover:bg-[#1a1a2e]/10 text-[#1a1a2e]/65 hover:text-[#1a1a2e]"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
