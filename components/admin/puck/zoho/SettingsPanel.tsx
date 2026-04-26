"use client"

/**
 * Microsite settings panel — Zoho-style nine-group editor.
 *
 * Top level shows the nine group cards (General / SEO / Domain /
 * Privacy / Cookies / Code / Analytics / Webhooks / Languages).
 * Click a card → drills into a form that reads/writes the matching
 * key on events.builder_settings (JSONB).
 *
 * Saves are atomic per-group via saveBuilderSettingsGroup.
 */

import { useEffect, useState } from "react"
import {
  ArrowLeft, ChevronRight, Globe, Search, Lock, Cookie,
  Code2, BarChart3, Webhook, Languages, Loader2, Check, Plus, Trash2,
} from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import {
  getBuilderSettings, saveBuilderSettingsGroup,
  type BuilderSettingsGroup,
} from "@/app/actions/eventBuilderActions"

type GroupDef = { key: BuilderSettingsGroup; label: string; desc: string; Icon: typeof Globe }

const GROUPS: GroupDef[] = [
  { key: "general",   label: "General",       desc: "Microsite name, tagline, time zone",       Icon: Globe },
  { key: "seo",       label: "SEO",           desc: "Title, description, OG card",              Icon: Search },
  { key: "domain",    label: "Custom domain", desc: "events.yourdomain.com",                    Icon: Globe },
  { key: "privacy",   label: "Privacy",       desc: "GDPR notices, data-retention",             Icon: Lock },
  { key: "cookies",   label: "Cookie banner", desc: "Show / hide, copy, link to policy",        Icon: Cookie },
  { key: "code",      label: "Custom code",   desc: "Inject head + body scripts",               Icon: Code2 },
  { key: "analytics", label: "Analytics",     desc: "GA4 / Plausible / GTM IDs",                Icon: BarChart3 },
  { key: "webhooks",  label: "Webhooks",      desc: "POST notifications on key events",         Icon: Webhook },
  { key: "languages", label: "Languages",     desc: "Multi-language sub-pages",                 Icon: Languages },
]

export function SettingsPanel({
  eventId,
  onClose,
}: {
  eventId: string
  onClose?: () => void
}) {
  const [active, setActive] = useState<BuilderSettingsGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Record<string, unknown>>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void getBuilderSettings(eventId).then((res) => {
      if (cancelled) return
      setSettings(res.settings)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [eventId])

  if (active) {
    return (
      <SettingsForm
        eventId={eventId}
        groupKey={active}
        groupDef={GROUPS.find((g) => g.key === active)!}
        initial={(settings[active] as Record<string, unknown>) ?? {}}
        onBack={() => setActive(null)}
        onSaved={(next) => {
          setSettings((s) => ({ ...s, [active]: next }))
        }}
      />
    )
  }

  return (
    <SecondaryPanel title="Microsite settings" onClose={onClose}>
      {loading ? (
        <div className="z-empty mt-12">
          <Loader2 size={20} className="animate-spin z-empty-icon" />
          <p className="z-empty-desc mt-2">Loading…</p>
        </div>
      ) : (
        <ul className="px-2 py-2 space-y-1">
          {GROUPS.map((g) => {
            const cfg = settings[g.key]
            const has = !!cfg && typeof cfg === "object" && Object.keys(cfg as Record<string, unknown>).length > 0
            return (
              <li key={g.key}>
                <button
                  type="button"
                  onClick={() => setActive(g.key)}
                  className="z-panel-item w-full"
                >
                  <g.Icon size={14} strokeWidth={1.5} className="text-[var(--z-text-muted,#6b7280)]" />
                  <span className="flex-1 text-left">
                    <span className="block text-[13px] font-semibold text-[var(--z-text,#1f2937)]">{g.label}</span>
                    <span className="block text-[11px] text-[var(--z-text-muted,#6b7280)]">{g.desc}</span>
                  </span>
                  {has && <Check size={12} strokeWidth={1.5} className="text-[var(--z-success,#10b981)]" />}
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

function SettingsForm({
  eventId, groupKey, groupDef, initial, onBack, onSaved,
}: {
  eventId: string
  groupKey: BuilderSettingsGroup
  groupDef: GroupDef
  initial: Record<string, unknown>
  onBack: () => void
  onSaved: (next: Record<string, unknown>) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const next = collectFormValues(e.currentTarget, groupKey)
    const res = await saveBuilderSettingsGroup(eventId, groupKey, next)
    setSubmitting(false)
    if (!res.success) {
      setError(res.error ?? "Save failed")
      return
    }
    onSaved(next)
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1500)
  }

  return (
    <aside className="w-72 shrink-0 h-full bg-[var(--z-bg-alt,#f7f8fa)] border-r border-[var(--z-border,#e5e7eb)] flex flex-col">
      <div className="shrink-0 h-12 px-4 flex items-center gap-2 border-b border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg,#fff)]">
        <button type="button" onClick={onBack} aria-label="Back" className="z-btn z-btn-icon">
          <ArrowLeft size={14} strokeWidth={1.5} />
        </button>
        <groupDef.Icon size={14} strokeWidth={1.5} className="text-[var(--z-text-muted,#6b7280)]" />
        <h2 className="text-[13px] font-bold text-[var(--z-text,#1f2937)]">{groupDef.label}</h2>
      </div>
      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <p className="text-[11px] text-[var(--z-text-muted,#6b7280)]">{groupDef.desc}</p>
        {renderGroupFields(groupKey, initial)}
        {error && (
          <p className="text-[12px] text-[var(--z-danger,#dc2626)] bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}
        <div className="pt-1 flex items-center gap-2">
          <button type="submit" disabled={submitting} className="z-btn-primary flex-1">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
            Save changes
          </button>
          <button type="button" onClick={onBack} className="z-btn">Cancel</button>
        </div>
        {savedFlash && (
          <p className="text-[12px] text-[var(--z-success,#10b981)] flex items-center gap-1.5">
            <Check size={12} strokeWidth={2} /> Saved.
          </p>
        )}
      </form>
    </aside>
  )
}

/* ────────────────────────────────────────────────────────────────────
 * Per-group field rendering. Each helper renders the inputs and the
 * collector below pulls values out of the form via FormData by `name`.
 *
 * Names are flat (no nesting) for simplicity — the action stores the
 * whole object under `builder_settings.<groupKey>`.
 * ──────────────────────────────────────────────────────────────────── */

function renderGroupFields(group: BuilderSettingsGroup, init: Record<string, unknown>) {
  switch (group) {
    case "general": return (
      <>
        <Field label="Microsite name"           name="name"          defaultValue={s(init.name)} />
        <Field label="Tagline"                  name="tagline"       defaultValue={s(init.tagline)} />
        <SelectField label="Time zone"          name="timezone"      defaultValue={s(init.timezone) || "Asia/Kolkata"} options={TZ_OPTIONS} />
      </>
    )
    case "seo": return (
      <>
        <Field label="Page title"               name="title"         defaultValue={s(init.title)} />
        <FieldArea label="Meta description"     name="description"   defaultValue={s(init.description)} maxLength={160} />
        <Field label="Open Graph image URL"     name="ogImage"       type="url" defaultValue={s(init.ogImage)} placeholder="https://…" />
        <Field label="Canonical URL"            name="canonical"     type="url" defaultValue={s(init.canonical)} placeholder="https://…" />
        <BoolField label="Allow search engines" name="allowIndex"    defaultChecked={b(init.allowIndex, true)} />
      </>
    )
    case "domain": return (
      <>
        <Field label="Custom domain"            name="domain"        defaultValue={s(init.domain)} placeholder="events.yourdomain.com" />
        <p className="text-[11px] text-[var(--z-text-muted,#6b7280)] -mt-1">
          DNS records you'll need to add: a CNAME pointing your custom domain at <code className="font-mono">cname.vercel-dns.com</code>. Verification UI ships in a follow-up.
        </p>
        <BoolField label="Force HTTPS redirect" name="forceHttps"    defaultChecked={b(init.forceHttps, true)} />
      </>
    )
    case "privacy": return (
      <>
        <FieldArea label="Privacy notice"       name="notice"        defaultValue={s(init.notice)}
          placeholder="Shown in the page footer. Markdown OK." />
        <Field label="Data retention (days)"    name="retentionDays" type="number" defaultValue={n(init.retentionDays)} placeholder="0 for indefinite" />
        <BoolField label="Honour Do Not Track"  name="honourDNT"     defaultChecked={b(init.honourDNT, true)} />
      </>
    )
    case "cookies": return (
      <>
        <BoolField label="Show cookie banner"   name="show"          defaultChecked={b(init.show, true)} />
        <FieldArea label="Banner copy"          name="copy"          defaultValue={s(init.copy) || "We use cookies to improve your experience."} />
        <Field label="Policy link URL"          name="policyUrl"     type="url" defaultValue={s(init.policyUrl)} placeholder="https://…" />
        <Field label="Accept button label"      name="acceptLabel"   defaultValue={s(init.acceptLabel) || "Accept"} />
      </>
    )
    case "code": return (
      <>
        <FieldArea label="<head> code"          name="headCode"      defaultValue={s(init.headCode)} rows={5} mono />
        <FieldArea label="<body> end code"      name="bodyCode"      defaultValue={s(init.bodyCode)} rows={5} mono />
        <p className="text-[11px] text-[var(--z-text-muted,#6b7280)]">
          Code snippets are injected on every public page of this microsite. Be careful — invalid HTML breaks the site.
        </p>
      </>
    )
    case "analytics": return (
      <>
        <Field label="GA4 Measurement ID"       name="ga4"           defaultValue={s(init.ga4)} placeholder="G-XXXXXXXXXX" />
        <Field label="GTM container ID"         name="gtm"           defaultValue={s(init.gtm)} placeholder="GTM-XXXXXX" />
        <Field label="Plausible domain"         name="plausible"     defaultValue={s(init.plausible)} placeholder="events.example.com" />
        <Field label="Meta (FB) Pixel ID"       name="metaPixel"     defaultValue={s(init.metaPixel)} placeholder="000000000000000" />
        <Field label="LinkedIn Insight ID"      name="linkedin"      defaultValue={s(init.linkedin)} placeholder="0000000" />
      </>
    )
    case "webhooks": {
      const hooks = Array.isArray(init.endpoints)
        ? (init.endpoints as Array<Record<string, unknown>>)
        : []
      return (
        <>
          <p className="text-[11px] text-[var(--z-text-muted,#6b7280)]">
            POST a JSON payload to each endpoint when a registration / form submission / publish happens.
          </p>
          <div data-name="endpoints" className="space-y-2">
            {hooks.length === 0 ? (
              <p className="text-[12px] text-[var(--z-text-subtle,#9ca3af)] italic">No webhooks yet.</p>
            ) : null}
            {hooks.map((w, i) => (
              <WebhookRow key={i} index={i} initial={w} />
            ))}
          </div>
          <button
            type="button"
            onClick={(e) => addWebhookRow(e.currentTarget)}
            className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-md border border-dashed border-[var(--z-border-strong,#d1d5db)] text-[12px] font-medium text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-info,#3e7af7)] hover:border-[var(--z-info,#3e7af7)]"
          >
            <Plus size={14} strokeWidth={1.5} />
            Add webhook
          </button>
        </>
      )
    }
    case "languages": {
      const langs = Array.isArray(init.locales) ? (init.locales as string[]) : ["en"]
      return (
        <>
          <p className="text-[11px] text-[var(--z-text-muted,#6b7280)]">
            Pick the languages this microsite supports. Each becomes a /<code className="font-mono">[locale]</code> sub-tree (Phase 5 ships the renderer).
          </p>
          <BoolField label="Enable multi-language" name="enabled" defaultChecked={b(init.enabled, false)} />
          <Field label="Default locale" name="default" defaultValue={s(init.default) || "en"} placeholder="en" />
          <Field label="Locale list (comma-separated)" name="locales" defaultValue={langs.join(", ")} placeholder="en, hi, ta" />
        </>
      )
    }
  }
}

const TZ_OPTIONS = [
  "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London",
  "Europe/Berlin", "America/New_York", "America/Los_Angeles", "UTC",
]

function WebhookRow({ index, initial }: { index: number; initial: Record<string, unknown> }) {
  return (
    <div className="rounded-md border border-[var(--z-border,#e5e7eb)] bg-white p-2.5 space-y-2 relative" data-webhook-row>
      <button
        type="button"
        onClick={(e) => removeWebhookRow(e.currentTarget)}
        aria-label="Remove webhook"
        className="absolute top-1.5 right-1.5 z-btn z-btn-icon !w-6 !h-6 hover:!bg-red-50 hover:!text-red-700"
      >
        <Trash2 size={11} strokeWidth={1.5} />
      </button>
      <Field label="URL" name={`endpoint_url_${index}`} type="url" defaultValue={s(initial.url)} placeholder="https://…" />
      <SelectField
        label="Event"
        name={`endpoint_event_${index}`}
        defaultValue={s(initial.event) || "publish"}
        options={["publish", "registration", "form-submission"]}
      />
      <Field label="Header (Authorization)" name={`endpoint_auth_${index}`} defaultValue={s(initial.auth)} placeholder="Bearer …" />
    </div>
  )
}

function addWebhookRow(btn: HTMLButtonElement) {
  // Append a fresh empty row by mutating the data-name="endpoints" container.
  const container = btn.closest("form")?.querySelector('[data-name="endpoints"]')
  if (!container) return
  const i = container.querySelectorAll("[data-webhook-row]").length
  const wrap = document.createElement("div")
  wrap.dataset.webhookRow = "true"
  wrap.className = "rounded-md border border-gray-200 bg-white p-2.5 space-y-2 relative"
  wrap.innerHTML = `
    <button type="button" data-remove aria-label="Remove webhook" class="absolute top-1.5 right-1.5 z-btn z-btn-icon !w-6 !h-6 hover:!bg-red-50 hover:!text-red-700">×</button>
    <label class="block"><span class="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">URL</span>
      <input class="z-input" type="url" name="endpoint_url_${i}" placeholder="https://…" /></label>
    <label class="block"><span class="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">Event</span>
      <select class="z-input" name="endpoint_event_${i}">
        <option value="publish">publish</option>
        <option value="registration">registration</option>
        <option value="form-submission">form-submission</option>
      </select></label>
    <label class="block"><span class="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1">Header (Authorization)</span>
      <input class="z-input" name="endpoint_auth_${i}" placeholder="Bearer …" /></label>`
  wrap.querySelector("[data-remove]")?.addEventListener("click", () => wrap.remove())
  container.appendChild(wrap)
}

function removeWebhookRow(btn: HTMLButtonElement) {
  btn.closest("[data-webhook-row]")?.remove()
}

function collectFormValues(form: HTMLFormElement, group: BuilderSettingsGroup): Record<string, unknown> {
  const fd = new FormData(form)
  const out: Record<string, unknown> = {}
  if (group === "webhooks") {
    const endpoints: Array<Record<string, unknown>> = []
    // Walk dynamic numbered fields.
    for (let i = 0; i < 200; i++) {
      const url = fd.get(`endpoint_url_${i}`)
      if (url === null) continue
      const ev   = fd.get(`endpoint_event_${i}`)
      const auth = fd.get(`endpoint_auth_${i}`)
      if (typeof url === "string" && url.trim().length > 0) {
        endpoints.push({
          url:   url.trim(),
          event: typeof ev   === "string" ? ev   : "publish",
          auth:  typeof auth === "string" ? auth : "",
        })
      }
    }
    out.endpoints = endpoints
    return out
  }
  if (group === "languages") {
    out.enabled = fd.get("enabled") === "on"
    const def = fd.get("default")
    out.default = typeof def === "string" ? def : "en"
    const list = fd.get("locales")
    out.locales = typeof list === "string"
      ? list.split(",").map((s) => s.trim()).filter(Boolean)
      : ["en"]
    return out
  }
  // Generic: copy every form field as string OR boolean for checkboxes.
  for (const [name, value] of fd.entries()) {
    if (typeof value === "string") {
      out[name] = value
    }
  }
  // Also capture unchecked checkboxes (which don't appear in FormData).
  for (const el of Array.from(form.elements)) {
    if (el instanceof HTMLInputElement && el.type === "checkbox" && el.name) {
      out[el.name] = el.checked
    }
  }
  return out
}

/* ── Field primitives ──────────────────────────────────────────────── */

function Field({
  label, name, defaultValue, type = "text", placeholder,
}: {
  label: string
  name: string
  defaultValue?: string
  type?: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">{label}</span>
      <input type={type} name={name} defaultValue={defaultValue} placeholder={placeholder} className="z-input" />
    </label>
  )
}

function FieldArea({
  label, name, defaultValue, rows = 3, placeholder, maxLength, mono,
}: {
  label: string
  name: string
  defaultValue?: string
  rows?: number
  placeholder?: string
  maxLength?: number
  mono?: boolean
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`z-input z-textarea ${mono ? "font-mono text-[11px]" : ""}`}
      />
    </label>
  )
}

function SelectField({
  label, name, defaultValue, options,
}: {
  label: string
  name: string
  defaultValue: string
  options: ReadonlyArray<string>
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">{label}</span>
      <select name={name} defaultValue={defaultValue} className="z-input">
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}

function BoolField({
  label, name, defaultChecked,
}: {
  label: string
  name: string
  defaultChecked: boolean
}) {
  return (
    <label className="flex items-center gap-2 text-[12px] py-1.5">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  )
}

/* ── Tiny coercion helpers ─────────────────────────────────────────── */
function s(v: unknown): string { return typeof v === "string" ? v : "" }
function n(v: unknown): string { return typeof v === "number" ? String(v) : (typeof v === "string" ? v : "") }
function b(v: unknown, fallback: boolean): boolean { return typeof v === "boolean" ? v : fallback }
