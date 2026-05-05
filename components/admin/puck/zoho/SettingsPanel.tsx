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
  ArrowLeft, Globe, Search, Lock, Cookie,
  Code2, Loader2, Check, Plus, Trash2,
  Navigation as NavIcon, Bell, Clock as ClockIcon, Map as MapIcon, Image as ImageIco, Smile,
  Type as TypeIcon, ChevronDown, ChevronRight,
} from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import {
  getBuilderSettings, saveBuilderSettingsGroup,
  getEventLogoUrl, saveEventLogoUrl,
  getNavExtraLinks, saveNavExtraLinks,
  getEventImageColumn, saveEventImageColumn,
  getTextOverrides, saveTextOverridesForLocale,
  type BuilderSettingsGroup, type NavExtraLink,
} from "@/app/actions/eventBuilderActions"
import { ImageUploadCrop } from "@/components/admin/ImageUploadCrop"
import {
  DEFAULT_STRINGS, STRING_NAMESPACES, type StringKey,
} from "@/lib/i18n"

type GroupDef = { key: BuilderSettingsGroup; label: string; desc: string; Icon: typeof Globe }

// Settings group cards. Notification / Time / Map / Search / Thumb /
// Favicon are added by ITEM 10. Navigation is added by ITEM 8.
const GROUPS: GroupDef[] = [
  { key: "general",       label: "General",        desc: "Microsite name, tagline, time zone, social",  Icon: Globe },
  { key: "text",          label: "Customize text", desc: "Per-locale override of every visible string", Icon: TypeIcon },
  { key: "seo",           label: "SEO",            desc: "Title, description, OG card",                 Icon: Search },
  { key: "domain",        label: "Custom domain",  desc: "events.yourdomain.com",                       Icon: Globe },
  { key: "privacy",       label: "Privacy",        desc: "GDPR notices, data-retention",                Icon: Lock },
  { key: "cookies",       label: "Cookie banner",  desc: "Show / hide, copy, link to policy",           Icon: Cookie },
  { key: "code",          label: "Custom code",    desc: "Inject head + body scripts",                  Icon: Code2 },
  { key: "navigation",    label: "Navigation",     desc: "Custom links + nested submenus",              Icon: NavIcon },
  { key: "notification",  label: "Notification",   desc: "Sticky banner above nav",                     Icon: Bell },
  { key: "timeFormat",    label: "Time format",    desc: "Date / 12h-24h / timezone",                   Icon: ClockIcon },
  { key: "map",           label: "Map display",    desc: "Provider, zoom, directions",                  Icon: MapIcon },
  { key: "searchVis",     label: "Search visibility", desc: "Indexable / robots / sitemap",             Icon: Search },
  { key: "thumbnail",     label: "Event thumbnail", desc: "Card image on /events listing",              Icon: ImageIco },
  { key: "favicon",       label: "Favicon",        desc: "Browser tab icon",                            Icon: Smile },
]

export function SettingsPanel({
  eventId,
  onClose,
  initialGroup = null,
}: {
  eventId: string
  onClose?: () => void
  /** Pre-select a sub-form on mount. Used by IntegrationsPanel cards
   *  that route directly into Analytics / Webhooks / Domain forms. */
  initialGroup?: BuilderSettingsGroup | null
}) {
  const [active, setActive] = useState<BuilderSettingsGroup | null>(initialGroup)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Record<string, unknown>>({})

  useEffect(() => {
    let cancelled = false
    void getBuilderSettings(eventId).then((res) => {
      if (cancelled) return
      setSettings(res.settings)
      setLoading(false)
    })
    // Cross-panel hook so IntegrationsPanel cards open a settings form.
    const onOpenGroup = (e: Event) => {
      const detail = (e as CustomEvent<{ group: BuilderSettingsGroup }>).detail
      if (detail?.group) setActive(detail.group)
    }
    window.addEventListener("builder:open-settings-group", onOpenGroup)
    return () => {
      cancelled = true
      window.removeEventListener("builder:open-settings-group", onOpenGroup)
    }
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
        <div className="px-3 py-3 grid grid-cols-2 gap-2">
          {GROUPS.map((g) => {
            const cfg = settings[g.key]
            const has = !!cfg && typeof cfg === "object" && Object.keys(cfg as Record<string, unknown>).length > 0
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => setActive(g.key)}
                className="group relative flex flex-col items-start gap-1.5 p-3 rounded-lg border border-[var(--z-border,#e5e7eb)] bg-white text-left hover:border-[var(--z-info,#3e7af7)]/40 hover:shadow-sm hover:-translate-y-px transition-all"
              >
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  <g.Icon size={20} strokeWidth={1.5} />
                </span>
                <span className="block text-[13px] font-semibold text-[var(--z-text,#1f2937)]">{g.label}</span>
                <span className="block text-[11px] leading-snug text-[var(--z-text-muted,#6b7280)]">{g.desc}</span>
                {has && (
                  <span
                    aria-label="Configured"
                    title="Configured"
                    className="absolute top-2 right-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white"
                  >
                    <Check size={10} strokeWidth={2.5} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
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

  // ITEM 4 — the Customize Text editor is a different shape (locale
  // picker + table) so we render it inline instead of the standard
  // FormData-collected fields.
  if (groupKey === "text") {
    return (
      <aside className="w-[480px] shrink-0 h-full bg-[var(--z-bg-alt,#f7f8fa)] border-r border-[var(--z-border,#e5e7eb)] flex flex-col">
        <div className="shrink-0 h-12 px-4 flex items-center gap-2 border-b border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg,#fff)]">
          <button type="button" onClick={onBack} aria-label="Back" className="z-btn z-btn-icon">
            <ArrowLeft size={14} strokeWidth={1.5} />
          </button>
          <groupDef.Icon size={14} strokeWidth={1.5} className="text-[var(--z-text-muted,#6b7280)]" />
          <h2 className="text-[13px] font-bold text-[var(--z-text,#1f2937)]">{groupDef.label}</h2>
        </div>
        <CustomizeTextEditor eventId={eventId} />
      </aside>
    )
  }

  // Code + Webhooks + Navigation need wider real estate for the
  // textareas / dynamic rows; everything else stays in 288px.
  const wideGroups = new Set<BuilderSettingsGroup>(["code", "webhooks", "domain", "navigation"])
  const widthCls = wideGroups.has(groupKey) ? "w-[420px]" : "w-72"

  return (
    <aside className={`${widthCls} shrink-0 h-full bg-[var(--z-bg-alt,#f7f8fa)] border-r border-[var(--z-border,#e5e7eb)] flex flex-col`}>
      <div className="shrink-0 h-12 px-4 flex items-center gap-2 border-b border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg,#fff)]">
        <button type="button" onClick={onBack} aria-label="Back" className="z-btn z-btn-icon">
          <ArrowLeft size={14} strokeWidth={1.5} />
        </button>
        <groupDef.Icon size={14} strokeWidth={1.5} className="text-[var(--z-text-muted,#6b7280)]" />
        <h2 className="text-[13px] font-bold text-[var(--z-text,#1f2937)]">{groupDef.label}</h2>
      </div>
      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-3">
        <p className="text-[11px] text-[var(--z-text-muted,#6b7280)]">{groupDef.desc}</p>
        {renderGroupFields(groupKey, initial, eventId)}
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

function renderGroupFields(group: BuilderSettingsGroup, init: Record<string, unknown>, eventId: string) {
  switch (group) {
    case "general": {
      const sh = (init.socialHandles ?? {}) as Record<string, unknown>
      return (
        <>
          {/* A2: event logo. */}
          <LogoField eventId={eventId} />
          <Field label="Microsite name"           name="name"          defaultValue={s(init.name)} />
          <Field label="Tagline"                  name="tagline"       defaultValue={s(init.tagline)} />
          <SelectField label="Time zone"          name="timezone"      defaultValue={s(init.timezone) || "Asia/Kolkata"} options={TZ_OPTIONS} />
          {/* ITEM 2.4 — Social handles (read by Hero inline + Footer). */}
          <p className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)]">Social handles</p>
          <Field label="X / Twitter URL"   name="social_twitter"   type="url" defaultValue={s(sh.twitter)}   placeholder="https://x.com/…" />
          <Field label="LinkedIn URL"      name="social_linkedin"  type="url" defaultValue={s(sh.linkedin)}  placeholder="https://www.linkedin.com/…" />
          <Field label="Instagram URL"     name="social_instagram" type="url" defaultValue={s(sh.instagram)} placeholder="https://www.instagram.com/…" />
          <Field label="Facebook URL"      name="social_facebook"  type="url" defaultValue={s(sh.facebook)}  placeholder="https://www.facebook.com/…" />
          <Field label="YouTube URL"       name="social_youtube"   type="url" defaultValue={s(sh.youtube)}   placeholder="https://www.youtube.com/…" />
          <Field label="Website URL"       name="social_website"   type="url" defaultValue={s(sh.website)}   placeholder="https://…" />
        </>
      )
    }
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
          DNS records you&apos;ll need to add: a CNAME pointing your custom domain at <code className="font-mono">cname.vercel-dns.com</code>. Verification UI ships in a follow-up.
        </p>
        <BoolField label="Force HTTPS redirect" name="forceHttps"    defaultChecked={b(init.forceHttps, true)} />
      </>
    )
    case "privacy": return (
      <>
        <SelectField
          label="Page visibility"
          name="visibility"
          defaultValue={s(init.visibility) || "public"}
          options={["public", "coming_soon", "password"]}
        />
        <Field
          label="Password (only for 'password' mode)"
          name="password"
          defaultValue={s(init.password)}
          placeholder="visitors enter this to view"
        />
        <FieldArea
          label="Visibility message (optional)"
          name="visibilityMessage"
          defaultValue={s(init.visibilityMessage)}
          placeholder="Shown on the holding page or above the password input"
        />
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
    case "webhooks":
      return <WebhooksSection init={init} />

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
    /* ── ITEM 8 — navigation ─────────────────────────────────────── */
    case "navigation":
      return <NavigationSection eventId={eventId} />

    /* ── ITEM 10.1 — notification ───────────────────────────────── */
    case "notification": return (
      <>
        <BoolField label="Enabled"             name="enabled"      defaultChecked={b(init.enabled, false)} />
        <Field     label="Message"             name="message"      defaultValue={s(init.message)} placeholder="Early-bird ends Friday." />
        <Field     label="Link URL (optional)" name="link"         type="url" defaultValue={s(init.link)} />
        <Field     label="Link label"          name="linkLabel"    defaultValue={s(init.linkLabel) || "Learn more"} />
        <BoolField label="Dismissable"         name="dismissable"  defaultChecked={b(init.dismissable, true)} />
        <Field     label="Display until (date)" name="displayUntil" type="date" defaultValue={s(init.displayUntil)} />
      </>
    )
    /* ── ITEM 10.2 — time format ────────────────────────────────── */
    case "timeFormat": return (
      <>
        <SelectField label="Date format"        name="dateFormat"   defaultValue={s(init.dateFormat) || "DD/MM/YYYY"} options={["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]} />
        <SelectField label="Time format"        name="timeFormat"   defaultValue={s(init.timeFormat) || "12h"}        options={["12h", "24h"]} />
        <BoolField   label="Show timezone next to times" name="showTimezone" defaultChecked={b(init.showTimezone, true)} />
      </>
    )
    /* ── ITEM 10.3 — map display ────────────────────────────────── */
    case "map": return (
      <>
        <SelectField label="Map provider"     name="provider"   defaultValue={s(init.provider) || "google"} options={["google", "openstreetmap"]} />
        <Field       label="Default zoom (8–18)" name="defaultZoom" type="number" defaultValue={n(init.defaultZoom) || "14"} />
        <BoolField   label="Show 'Get directions' button" name="showDirectionsButton" defaultChecked={b(init.showDirectionsButton, true)} />
      </>
    )
    /* ── ITEM 10.4 — search visibility ──────────────────────────── */
    case "searchVis": return (
      <>
        <BoolField  label="Indexable (search engines)" name="indexable" defaultChecked={b(init.indexable, true)} />
        <FieldArea  label="Custom robots rules"        name="customRobotsRules" defaultValue={s(init.customRobotsRules)} placeholder="Disallow: /private/" />
        <BoolField  label="Include in sitemap.xml"     name="sitemapEnabled" defaultChecked={b(init.sitemapEnabled, true)} />
      </>
    )
    /* ── ITEM 10.5 — event thumbnail ────────────────────────────── */
    case "thumbnail":
      return <SingleImageColumnField eventId={eventId} column="thumbnail_url" label="Event thumbnail (used on /events listing card)" aspectRatio={4 / 3} />
    /* ── ITEM 10.6 — favicon ────────────────────────────────────── */
    case "favicon":
      return <SingleImageColumnField eventId={eventId} column="favicon_url" label="Favicon (.ico / .png ≤ 256 px)" aspectRatio={1} />
  }
}

function WebhooksSection({ init }: { init: Record<string, unknown> }) {
  const initial = Array.isArray(init.endpoints) ? (init.endpoints as Array<Record<string, unknown>>) : []
  // React-state-managed rows so adding/removing doesn't fight the DOM.
  // Each row carries a stable client id so React can reconcile correctly.
  const [rows, setRows] = useState<Array<{ key: string; initial: Record<string, unknown> }>>(
    () => initial.map((w, i) => ({ key: `w-${i}-${Math.random().toString(36).slice(2, 8)}`, initial: w }))
  )
  function addRow() {
    setRows((rs) => [...rs, { key: `w-${rs.length}-${Math.random().toString(36).slice(2, 8)}`, initial: {} }])
  }
  function removeRow(key: string) {
    setRows((rs) => rs.filter((r) => r.key !== key))
  }
  return (
    <>
      <p className="text-[11px] text-[var(--z-text-muted,#6b7280)]">
        POST a signed JSON payload to each endpoint when a registration / form submission / publish happens.
        Set <code className="font-mono">SECRET</code> to enable HMAC-SHA256 in <code className="font-mono">X-LF-Signature</code>.
      </p>
      <div data-name="endpoints" className="space-y-2">
        {rows.length === 0 && (
          <p className="text-[12px] text-[var(--z-text-subtle,#9ca3af)] italic">No webhooks yet.</p>
        )}
        {rows.map((r, i) => (
          <WebhookRow key={r.key} index={i} initial={r.initial} onRemove={() => removeRow(r.key)} />
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-md border border-dashed border-[var(--z-border-strong,#d1d5db)] text-[12px] font-medium text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-info,#3e7af7)] hover:border-[var(--z-info,#3e7af7)]"
      >
        <Plus size={14} strokeWidth={1.5} />
        Add webhook
      </button>
    </>
  )
}

const TZ_OPTIONS = [
  "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London",
  "Europe/Berlin", "America/New_York", "America/Los_Angeles", "UTC",
]

function WebhookRow({ index, initial, onRemove }: { index: number; initial: Record<string, unknown>; onRemove: () => void }) {
  return (
    <div className="rounded-md border border-[var(--z-border,#e5e7eb)] bg-white p-2.5 space-y-2 relative">
      <button
        type="button"
        onClick={onRemove}
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
      <Field label="HMAC secret (optional)" name={`endpoint_secret_${index}`} defaultValue={s(initial.secret)} placeholder="leave blank to skip signature" />
    </div>
  )
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
      const ev     = fd.get(`endpoint_event_${i}`)
      const auth   = fd.get(`endpoint_auth_${i}`)
      const secret = fd.get(`endpoint_secret_${i}`)
      if (typeof url === "string" && url.trim().length > 0) {
        endpoints.push({
          url:    url.trim(),
          event:  typeof ev     === "string" ? ev     : "publish",
          auth:   typeof auth   === "string" ? auth   : "",
          secret: typeof secret === "string" ? secret : "",
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
  // ITEM 2.4 — re-shape social_* keys into a nested socialHandles object.
  if (group === "general") {
    const sh: Record<string, string> = {}
    const keys = ["twitter", "linkedin", "instagram", "facebook", "youtube", "website"]
    for (const k of keys) {
      const v = out[`social_${k}`]
      if (typeof v === "string" && v.trim().length > 0) sh[k] = v.trim()
      delete out[`social_${k}`]
    }
    out.socialHandles = sh
  }
  return out
}

/* ── Customize Text editor (ITEM 4.3) ────────────────────────────
 *
 * Per-locale string-override editor. Top: locale picker. Body:
 * collapsible namespace sections (Navigation / Hero / Cookie / etc.)
 * each with one row per overridable key showing the default English
 * value next to a single-line input. Save button at the bottom
 * persists overrides for the current locale via
 * saveTextOverridesForLocale.
 */
function CustomizeTextEditor({ eventId }: { eventId: string }) {
  const [overrides, setOverrides] = useState<Record<string, Record<string, string>>>({})
  const [locale, setLocale] = useState<string>("en")
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [locales, setLocales] = useState<string[]>(["en"])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [openNs, setOpenNs] = useState<Set<string>>(() => new Set(["nav", "hero"]))

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      getTextOverrides(eventId),
      getBuilderSettings(eventId),
    ]).then(([res, settingsRes]) => {
      if (cancelled) return
      setOverrides(res.overrides)
      const langs = (() => {
        const lng = (settingsRes.settings.languages ?? {}) as Record<string, unknown>
        const list = Array.isArray(lng.locales) ? (lng.locales as string[]) : ["en"]
        return list.length > 0 ? list : ["en"]
      })()
      setLocales(langs)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [eventId])

  // Whenever the user picks a locale, seed the draft from saved overrides.
  useEffect(() => {
    setDraft({ ...(overrides[locale] ?? {}) })
  }, [locale, overrides])

  function setKey(key: string, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function toggleNs(ns: string) {
    setOpenNs((prev) => {
      const next = new Set(prev)
      if (next.has(ns)) next.delete(ns); else next.add(ns)
      return next
    })
  }

  async function save() {
    setSaving(true); setError(null)
    const res = await saveTextOverridesForLocale(eventId, locale, draft)
    setSaving(false)
    if (!res.success) {
      setError(res.error ?? "Save failed")
      return
    }
    setOverrides((prev) => ({ ...prev, [locale]: { ...draft } }))
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1500)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={16} className="animate-spin text-[var(--z-text-muted,#6b7280)]" />
      </div>
    )
  }

  // Group every key by namespace (everything before the first dot).
  const grouped: Record<string, Array<{ key: StringKey; defaultValue: string }>> = {}
  for (const key of Object.keys(DEFAULT_STRINGS) as StringKey[]) {
    const ns = key.split(".")[0]
    ;(grouped[ns] ??= []).push({ key, defaultValue: DEFAULT_STRINGS[key] })
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="shrink-0 px-3 py-2 border-b border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg,#fff)] flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-text-muted,#6b7280)]">Locale</span>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          className="z-input !h-7 !text-[12px] !py-0 flex-1"
        >
          {locales.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        <p className="text-[11px] text-[var(--z-text-muted,#6b7280)]">
          Override the public copy for this locale. Empty inputs fall back to the default English string. Variables in <code className="font-mono">{`{curly_braces}`}</code> are interpolated at render.
        </p>
        {STRING_NAMESPACES.map(({ ns, label }) => {
          const rows = grouped[ns]
          if (!rows || rows.length === 0) return null
          const expanded = openNs.has(ns)
          return (
            <div key={ns} className="rounded-md border border-[var(--z-border,#e5e7eb)] bg-white">
              <button
                type="button"
                onClick={() => toggleNs(ns)}
                className="w-full flex items-center gap-1.5 px-3 py-2 text-left text-[12px] font-bold text-[var(--z-text,#1f2937)] hover:bg-[var(--z-bg-alt,#f7f8fa)]"
              >
                {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                {label}
                <span className="ml-auto text-[10px] font-medium text-[var(--z-text-muted,#6b7280)]">{rows.length} keys</span>
              </button>
              {expanded && (
                <div className="border-t border-[var(--z-border,#e5e7eb)] divide-y divide-[var(--z-border,#e5e7eb)]">
                  {rows.map(({ key, defaultValue }) => (
                    <div key={key} className="px-3 py-2 grid grid-cols-1 gap-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--z-text-muted,#6b7280)]">{key}</span>
                      <p className="text-[10px] text-[var(--z-text-muted,#6b7280)] italic">Default: {defaultValue}</p>
                      <input
                        value={draft[key] ?? ""}
                        onChange={(e) => setKey(key, e.target.value)}
                        placeholder={defaultValue}
                        className="z-input !h-7 !text-[12px] !py-0"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {error && <p className="text-[12px] text-[var(--z-danger,#dc2626)] bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
      </div>
      <div className="shrink-0 px-3 py-3 border-t border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg-alt,#f7f8fa)] flex items-center gap-2">
        {savedFlash && <span className="text-[12px] text-[var(--z-success,#10b981)] mr-auto">Saved.</span>}
        {!savedFlash && <span className="flex-1" />}
        <button type="button" onClick={save} disabled={saving} className="z-btn-primary">
          {saving && <Loader2 size={12} className="animate-spin" />}
          Save overrides
        </button>
      </div>
    </div>
  )
}

/* ── Navigation section (ITEM 8) ─────────────────────────────────── */
function NavigationSection({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<NavExtraLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    let cancelled = false
    void getNavExtraLinks(eventId).then((res) => {
      if (cancelled) return
      setRows(res.rows)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [eventId])

  function update(idx: number, patch: Partial<NavExtraLink>) {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }
  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir
    if (j < 0 || j >= rows.length) return
    const next = [...rows]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setRows(next.map((r, i) => ({ ...r, sort_order: i * 10 })))
  }
  function add() {
    const id = `nx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setRows((rs) => [...rs, { id, label: "New link", url: "/", parent_id: null, sort_order: rs.length * 10, visible: true }])
  }
  function remove(idx: number) {
    const r = rows[idx]
    if (!r) return
    // Also detach children
    setRows((rs) => rs
      .filter((_, i) => i !== idx)
      .map((row) => row.parent_id === r.id ? { ...row, parent_id: null } : row))
  }
  async function persist() {
    setSaving(true); setError(null)
    const res = await saveNavExtraLinks(eventId, rows)
    setSaving(false)
    if (!res.success) { setError(res.error ?? "Save failed"); return }
    setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1500)
  }

  if (loading) return <div className="flex items-center gap-2 text-[11px] text-[var(--z-text-muted,#6b7280)]"><Loader2 size={12} className="animate-spin" /> Loading…</div>
  return (
    <>
      <p className="text-[11px] text-[var(--z-text-muted,#6b7280)]">
        Custom links appear in the public top nav alongside the canonical pages.
        Mark a link as nested under another to create a hover dropdown.
      </p>
      <div className="space-y-2">
        {rows.map((r, idx) => (
          <div key={r.id} className="rounded-md border border-[var(--z-border,#e5e7eb)] bg-white p-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <input
                value={r.label}
                onChange={(e) => update(idx, { label: e.target.value })}
                placeholder="Label"
                className="z-input flex-1 !h-7 !text-[12px]"
              />
              <button onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Up" className="z-btn z-btn-icon !w-6 !h-6 disabled:opacity-30">↑</button>
              <button onClick={() => move(idx, 1)} disabled={idx === rows.length - 1} aria-label="Down" className="z-btn z-btn-icon !w-6 !h-6 disabled:opacity-30">↓</button>
              <button onClick={() => remove(idx)} aria-label="Delete" className="z-btn z-btn-icon !w-6 !h-6 hover:!text-red-600">
                <Trash2 size={11} />
              </button>
            </div>
            <input
              value={r.url}
              onChange={(e) => update(idx, { url: e.target.value })}
              placeholder="URL — e.g. /sponsors or https://…"
              className="z-input !h-7 !text-[11px]"
            />
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center gap-1 text-[11px] text-[var(--z-text-muted,#6b7280)]">
                Nested under:
                <select
                  value={r.parent_id ?? ""}
                  onChange={(e) => update(idx, { parent_id: e.target.value || null })}
                  className="z-input !h-7 !text-[11px] !py-0 flex-1"
                >
                  <option value="">— top-level —</option>
                  {rows.filter((p) => p.id !== r.id && !p.parent_id).map((p) => (
                    <option key={p.id} value={p.id}>{p.label || "(untitled)"}</option>
                  ))}
                </select>
              </label>
              <label className="inline-flex items-center gap-1 text-[11px]">
                <input type="checkbox" checked={r.visible !== false} onChange={(e) => update(idx, { visible: e.target.checked })} />
                Visible
              </label>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-[12px] text-[var(--z-text-muted,#6b7280)] italic">No custom nav links yet.</p>}
      </div>
      <button type="button" onClick={add} className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-md border border-dashed border-[var(--z-border-strong,#d1d5db)] text-[12px] font-medium text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-info,#3e7af7)] hover:border-[var(--z-info,#3e7af7)]">
        <Plus size={14} strokeWidth={1.5} />
        Add nav link
      </button>
      {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-2.5 py-1.5">{error}</p>}
      <div className="pt-1 flex items-center gap-2">
        <button type="button" onClick={() => void persist()} disabled={saving} className="z-btn-primary flex-1">
          {saving && <Loader2 size={12} className="animate-spin" />}
          Save navigation
        </button>
        {savedFlash && <span className="text-[12px] text-[var(--z-success,#10b981)]">Saved.</span>}
      </div>
    </>
  )
}

/* ── Single-image column field (ITEM 10.5 / 10.6) ─────────────────── */
function SingleImageColumnField({
  eventId, column, label, aspectRatio,
}: {
  eventId: string
  column: "thumbnail_url" | "favicon_url"
  label: string
  aspectRatio: number
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void getEventImageColumn(eventId, column).then((res) => {
      if (cancelled) return
      setUrl(res.url); setLoading(false)
    })
    return () => { cancelled = true }
  }, [eventId, column])

  async function commit(next: string | null) {
    setSaving(true); setError(null)
    setUrl(next)
    const res = await saveEventImageColumn(eventId, column, next)
    setSaving(false)
    if (!res.success) setError(res.error ?? "Save failed")
  }

  if (loading) return <div className="flex items-center gap-2 text-[11px] text-[var(--z-text-muted,#6b7280)]"><Loader2 size={12} className="animate-spin" /> Loading…</div>
  return (
    <div className="space-y-1.5">
      <ImageUploadCrop
        value={url}
        onChange={(next) => void commit(next)}
        aspectRatio={aspectRatio}
        folder="events"
        label={label}
      />
      {saving && <p className="text-[11px] text-[var(--z-text-muted,#6b7280)] flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Saving…</p>}
      {error && <p className="text-[12px] text-[var(--z-danger,#dc2626)]">{error}</p>}
    </div>
  )
}

/* ── Logo field — A2 ────────────────────────────────────────────────
 *
 * Reads/writes events.logo_url directly via the dedicated actions. We
 * deliberately keep this OUT of the form's collectFormValues path because
 * (a) the URL belongs in a column, not in builder_settings JSONB, and
 * (b) ImageUploadCrop is React-state-driven and surfaces values via
 * onChange, not via FormData. Saves immediately on change.
 */
function LogoField({ eventId }: { eventId: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void getEventLogoUrl(eventId).then((res) => {
      if (cancelled) return
      setUrl(res.url)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [eventId])

  async function commit(next: string | null) {
    setSaving(true)
    setError(null)
    setUrl(next) // optimistic
    const res = await saveEventLogoUrl(eventId, next)
    setSaving(false)
    if (!res.success) setError(res.error ?? "Save failed")
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-[var(--z-text-muted,#6b7280)]">
        <Loader2 size={12} className="animate-spin" /> Loading logo…
      </div>
    )
  }
  return (
    <div className="space-y-1.5">
      <ImageUploadCrop
        value={url}
        onChange={(next) => void commit(next)}
        // Logos preserve their native ratio — `0` means "no fixed crop".
        aspectRatio={0}
        folder="events"
        label="Event logo"
        help="Shows at the left edge of the public nav bar. Optional — leave empty for text-only nav."
      />
      {saving && (
        <p className="text-[11px] text-[var(--z-text-muted,#6b7280)] flex items-center gap-1">
          <Loader2 size={10} className="animate-spin" /> Saving…
        </p>
      )}
      {error && (
        <p className="text-[12px] text-[var(--z-danger,#dc2626)]">{error}</p>
      )}
    </div>
  )
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
