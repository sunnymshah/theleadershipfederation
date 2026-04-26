"use client"

/**
 * Microsite Settings panel scaffold — placeholder cards for each Zoho-
 * style settings group. The forms inside are filed for Phase 4; this
 * surfaces the IA so the admin sees the affordance and where it'll live.
 */

import { ChevronRight, Globe, Search, Lock, Cookie, Code2, BarChart3, Webhook, Languages } from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"

const GROUPS = [
  { key: "general",   label: "General",       desc: "Microsite name, domain alias, time zone", Icon: Globe },
  { key: "seo",       label: "SEO",           desc: "Title, meta description, OG card",        Icon: Search },
  { key: "domain",    label: "Custom domain", desc: "events.yourdomain.com",                   Icon: Globe },
  { key: "privacy",   label: "Privacy",       desc: "GDPR notices, data-retention policy",     Icon: Lock },
  { key: "cookies",   label: "Cookie banner", desc: "Show / hide, copy, link to policy",       Icon: Cookie },
  { key: "code",      label: "Custom code",   desc: "Inject head + body scripts",              Icon: Code2 },
  { key: "analytics", label: "Analytics",     desc: "GA4 / Plausible / GTM IDs",               Icon: BarChart3 },
  { key: "webhooks",  label: "Webhooks",      desc: "POST notifications on key events",        Icon: Webhook },
  { key: "languages", label: "Languages",     desc: "Multi-language sub-pages",                Icon: Languages },
] as const

export function SettingsPanel({ onClose }: { onClose?: () => void }) {
  return (
    <SecondaryPanel title="Microsite settings" onClose={onClose}>
      <ul className="px-2 py-2 space-y-1">
        {GROUPS.map((g) => (
          <li key={g.key}>
            <button
              type="button"
              className="z-panel-item w-full"
              title={`${g.label} — coming soon`}
            >
              <g.Icon size={14} strokeWidth={1.5} className="text-[var(--z-text-muted,#6b7280)]" />
              <span className="flex-1 text-left">
                <span className="block text-[13px] font-semibold text-[var(--z-text,#1f2937)]">{g.label}</span>
                <span className="block text-[11px] text-[var(--z-text-muted,#6b7280)]">{g.desc}</span>
              </span>
              <ChevronRight size={14} strokeWidth={1.5} className="text-[var(--z-text-subtle,#9ca3af)]" />
            </button>
          </li>
        ))}
      </ul>
      <p className="px-4 py-3 text-[11px] text-[var(--z-text-muted,#6b7280)] border-t border-[var(--z-border,#e5e7eb)]">
        Each section opens a sub-panel. Coming in the next release.
      </p>
    </SecondaryPanel>
  )
}
