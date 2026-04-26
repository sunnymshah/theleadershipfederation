"use client"

/**
 * Records exposures for any A/B-tested blocks on the current page.
 * Server-side variant resolver tags blocks with __ab metadata; here we
 * collect them and POST to /api/ab/expose once on mount.
 *
 * Visitor ID is a long-lived random string in localStorage. Persists
 * across visits so the deterministic-hash variant pick stays stable.
 */

import { useEffect } from "react"

type Exposure = { test_id: string; variant: string }

function getOrCreateVisitorId(): string {
  try {
    const KEY = "lf-visitor-id"
    let v = localStorage.getItem(KEY)
    if (!v) {
      v = "v_" + crypto.randomUUID().replace(/-/g, "")
      localStorage.setItem(KEY, v)
    }
    return v
  } catch {
    return "v_anon_" + Math.random().toString(36).slice(2)
  }
}

export function ABExposureRecorder({ exposures }: { exposures: Exposure[] }) {
  useEffect(() => {
    if (!exposures || exposures.length === 0) return
    const visitorId = getOrCreateVisitorId()
    for (const e of exposures) {
      void fetch("/api/ab/expose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ testId: e.test_id, visitorId, variant: e.variant }),
        keepalive: true,
      }).catch(() => {})
    }
    // Wire conversion clicks: any element with [data-ab-convert] fires
    // /api/ab/convert when clicked. Targets all live tests for this visitor.
    const handler = (ev: Event) => {
      const target = (ev.target as Element).closest("[data-ab-convert]")
      if (!target) return
      for (const e of exposures) {
        void fetch("/api/ab/convert", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ testId: e.test_id, visitorId }),
          keepalive: true,
        }).catch(() => {})
      }
    }
    document.addEventListener("click", handler, { passive: true })
    return () => document.removeEventListener("click", handler)
  }, [exposures])
  return null
}
