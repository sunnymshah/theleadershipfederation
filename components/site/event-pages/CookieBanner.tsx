"use client"

/**
 * Soft white cookie consent card (ITEM 2 — Zoho parity).
 *
 * Position: fixed bottom-right (centered-bottom on mobile). Rounded
 * card, subtle shadow, slide-in animation. Persists dismissal in
 * localStorage with a 365-day expiry: `lf-cookies-{eventId}` →
 * JSON `{ accepted: true, expires: <ms-since-epoch> }`. On load the
 * banner first checks the expiry; lapsed entries are treated as
 * never-shown so the user is re-asked annually.
 */

import { useSyncExternalStore, useState } from "react"
import { X } from "lucide-react"

const ONE_YEAR_MS = 365 * 24 * 60 * 60_000

function subscribe() { return () => {} }

function readDismissed(storageKey: string): boolean {
  try {
    if (typeof window === "undefined") return false
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return false
    // Backwards compat — older entries were just "1".
    if (raw === "1") return true
    try {
      const parsed = JSON.parse(raw) as { accepted?: boolean; expires?: number }
      if (parsed?.accepted && (parsed.expires ?? 0) > Date.now()) return true
      // Expired — clear so the user is re-asked.
      window.localStorage.removeItem(storageKey)
      return false
    } catch {
      // Malformed entry; treat as never-dismissed and clean up.
      window.localStorage.removeItem(storageKey)
      return false
    }
  } catch {
    return false
  }
}

export function CookieBanner({
  eventId,
  copy,
  policyUrl,
  acceptLabel,
  manageLabel = "Manage",
}: {
  eventId: string
  copy: string
  policyUrl?: string
  acceptLabel: string
  manageLabel?: string
}) {
  const storageKey = `lf-cookies-${eventId}`
  const dismissed = useSyncExternalStore(
    subscribe,
    () => readDismissed(storageKey) ? "1" : null,
    () => null,
  )
  const [hidden, setHidden] = useState(false)
  if (dismissed === "1" || hidden) return null

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({
        accepted: true,
        expires: Date.now() + ONE_YEAR_MS,
      }))
    } catch {}
    setHidden(true)
  }

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="lf-cookie-banner fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 sm:w-96 sm:max-w-[calc(100vw-2rem)] z-[60] rounded-xl bg-white shadow-2xl border border-[#1a1a2e]/[0.08] p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] leading-relaxed text-gray-700">
            {copy}
            {policyUrl ? (
              <>
                {" "}
                <a
                  href={policyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[var(--lf-primary,#e7ab1c)] hover:text-[#1a1a2e]"
                >
                  Learn more
                </a>
              </>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-[#1a1a2e]/60 hover:bg-[#1a1a2e]/[0.06]"
        >
          <X size={14} />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        {policyUrl && (
          <a
            href={policyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-medium text-[#1a1a2e]/70 hover:text-[#1a1a2e] underline-offset-4 hover:underline"
          >
            {manageLabel}
          </a>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex items-center px-4 h-9 rounded-md text-[12px] font-bold uppercase tracking-wider bg-[var(--lf-primary,#e7ab1c)] text-white hover:bg-[#d49c10] transition-colors"
        >
          {acceptLabel}
        </button>
      </div>
    </div>
  )
}
