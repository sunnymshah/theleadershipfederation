"use client"

import { useSyncExternalStore, useState } from "react"
import { X } from "lucide-react"

function subscribe() { return () => {} }

export function CookieBanner({
  eventId,
  copy,
  policyUrl,
  acceptLabel,
}: {
  eventId: string
  copy: string
  policyUrl?: string
  acceptLabel: string
}) {
  const storageKey = `lf-cookies-${eventId}`
  // Read localStorage via useSyncExternalStore so React doesn't fight us
  // and we don't trigger setState-in-effect lint warnings. The snapshot
  // returns "1" (dismissed) or null. SSR snapshot is null (banner shows
  // briefly until hydration) — matches Zoho Backstage's behaviour.
  const dismissed = useSyncExternalStore(
    subscribe,
    () => {
      try { return typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null }
      catch { return null }
    },
    () => null,
  )
  const [hidden, setHidden] = useState(false)
  if (dismissed === "1" || hidden) return null

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, "1")
    } catch {}
    setHidden(true)
  }

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 sm:max-w-md z-[60] rounded-xl bg-white shadow-2xl border border-[#1a1a2e]/[0.08] p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] leading-relaxed text-[#1a1a2e]">
            {copy}{" "}
            {policyUrl ? (
              <a
                href={policyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[var(--lf-primary,#e7ab1c)] hover:text-[#1a1a2e]"
              >
                Learn more
              </a>
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
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex items-center px-4 h-9 rounded-md text-[12px] font-bold uppercase tracking-wider bg-[var(--lf-primary,#e7ab1c)] text-white hover:bg-[#d49c10]"
        >
          {acceptLabel}
        </button>
      </div>
    </div>
  )
}
