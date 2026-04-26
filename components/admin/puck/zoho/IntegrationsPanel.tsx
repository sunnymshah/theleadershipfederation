"use client"

/**
 * Integrations panel — quick-link cards that drill into the relevant
 * settings group. Reads/writes the same builder_settings JSONB as the
 * main Settings panel.
 */

import { useEffect, useState } from "react"
import { BarChart3, Webhook, Loader2, ChevronRight, Globe } from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import { getBuilderSettings } from "@/app/actions/eventBuilderActions"

const CARDS = [
  { key: "ga4",       label: "Google Analytics 4", desc: "Track visitors with a G-XXXX measurement ID.",          group: "analytics", path: "ga4",       Icon: BarChart3 },
  { key: "gtm",       label: "Google Tag Manager", desc: "Inject GTM-XXXX so you can ship anything from GTM.",     group: "analytics", path: "gtm",       Icon: BarChart3 },
  { key: "plausible", label: "Plausible",          desc: "Privacy-respecting analytics; just paste your domain.",  group: "analytics", path: "plausible", Icon: BarChart3 },
  { key: "metaPixel", label: "Meta Pixel",         desc: "Facebook / Instagram conversion tracking.",              group: "analytics", path: "metaPixel", Icon: BarChart3 },
  { key: "linkedin",  label: "LinkedIn Insight",   desc: "B2B retargeting + conversion tracking.",                 group: "analytics", path: "linkedin",  Icon: BarChart3 },
  { key: "hotjar",    label: "Hotjar",             desc: "Heatmaps + recordings (DNT-respecting).",                group: "analytics", path: "hotjar",    Icon: BarChart3 },
  { key: "webhooks",  label: "Webhooks",           desc: "POST signed JSON on publish, form, registration.",       group: "webhooks",  path: "endpoints", Icon: Webhook },
  { key: "domain",    label: "Custom domain",      desc: "Map events.yourdomain.com via the Vercel Domains API.",  group: "domain",    path: "domain",    Icon: Globe },
]

export function IntegrationsPanel({ eventId, onOpenSettings, onClose }: {
  eventId: string
  /** Optional — fired with (group) when a card is clicked, so the parent
   *  can switch the active rail to "settings" and pre-select the group. */
  onOpenSettings?: (group: string) => void
  onClose?: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Record<string, unknown>>({})

  useEffect(() => {
    let cancelled = false
    void getBuilderSettings(eventId).then((res) => {
      if (cancelled) return
      setSettings(res.settings)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [eventId])

  function isConfigured(group: string, path: string): boolean {
    const g = (settings[group] ?? {}) as Record<string, unknown>
    if (group === "webhooks") return Array.isArray(g.endpoints) && (g.endpoints as unknown[]).length > 0
    if (group === "domain")   return typeof g.domain === "string" && (g.domain as string).length > 0
    const v = g[path]
    return typeof v === "string" && v.length > 0
  }

  return (
    <SecondaryPanel title="Integrations" onClose={onClose}>
      {loading ? (
        <div className="z-empty mt-12">
          <Loader2 size={20} className="animate-spin z-empty-icon" />
        </div>
      ) : (
        <ul className="px-2 py-2 space-y-1">
          {CARDS.map((c) => {
            const configured = isConfigured(c.group, c.path)
            return (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => onOpenSettings?.(c.group)}
                  className="z-panel-item w-full"
                >
                  <c.Icon size={14} strokeWidth={1.5} className="text-[var(--z-text-muted,#6b7280)]" />
                  <span className="flex-1 text-left">
                    <span className="block text-[13px] font-semibold text-[var(--z-text,#1f2937)]">{c.label}</span>
                    <span className="block text-[11px] text-[var(--z-text-muted,#6b7280)]">{c.desc}</span>
                  </span>
                  {configured && (
                    <span className="inline-flex items-center px-1.5 h-4 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                      On
                    </span>
                  )}
                  <ChevronRight size={14} strokeWidth={1.5} className="text-[var(--z-text-subtle,#9ca3af)]" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </SecondaryPanel>
  )
}
