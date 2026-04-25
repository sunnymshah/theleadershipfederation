"use client"

/**
 * ── UrlPicker custom Puck field ───────────────────────────────────────
 *
 * A three-mode picker for any "URL" field on a builder block — Hero CTA,
 * CtaButton, Newsletter, etc.
 *
 *   External  → user pastes any https:// URL
 *   Event-page → drop-down of this event's sub-pages (and Tickets) with
 *                 friendly labels; saved as `internal:<key>`
 *   Anchor    → scroll-to within the current page; saved as `anchor:#id`
 *
 * The stored value is a tagged string so the resolver in blocks.tsx can
 * convert it to a real URL at render time:
 *
 *   "https://..."         → external link, target=_blank
 *   "internal:tickets"    → /events/[slug]/tickets   (special)
 *   "internal:p:<slug>"   → /events/[slug]/p/<slug>
 *   "internal:home"       → /events/[slug]
 *   "anchor:#id"          → #id
 *
 * Shape change is backward-compat: anything that doesn't match a tag
 * prefix is rendered as-is, so legacy "/tickets" strings keep working.
 */

import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { FieldLabel } from "@measured/puck"
import { ExternalLink, Hash, Layers } from "lucide-react"
import { getPublicBuilderNav } from "@/app/actions/eventBuilderActions"

type Mode = "external" | "internal" | "anchor"

type UrlPickerProps = {
  field: { label?: string }
  value: string
  onChange: (v: string) => void
  /** Optional — when provided we fetch the event's sub-pages so the
   *  Event-page mode can show real labels. Falls back to "Home/Tickets"
   *  only when missing. */
  eventId?: string
}

function detectMode(v: string): Mode {
  if (!v) return "external"
  if (v.startsWith("anchor:")) return "anchor"
  if (v.startsWith("internal:")) return "internal"
  return "external"
}

const STATIC_INTERNAL = [
  { value: "internal:home",     label: "Home" },
  { value: "internal:tickets",  label: "Tickets page" },
  { value: "internal:schedule", label: "Schedule" },
  { value: "internal:live",     label: "Live page" },
] as const

export function UrlPicker({ field, value, onChange, eventId }: UrlPickerProps) {
  const [mode, setMode] = useState<Mode>(detectMode(value))
  const [pages, setPages] = useState<Array<{ slug: string; title: string }>>([])

  // Re-detect when the underlying value changes from outside (undo, etc.)
  useEffect(() => { setMode(detectMode(value)) }, [value])

  // Recover eventId from the /admin/builder/<id> URL when not passed in.
  const pathname = usePathname() ?? ""
  const resolvedEventId = useMemo(() => {
    if (eventId) return eventId
    const m = pathname.match(/\/admin\/builder\/([0-9a-fA-F-]{36})/)
    return m ? m[1] : ""
  }, [eventId, pathname])

  useEffect(() => {
    if (!resolvedEventId) return
    let cancelled = false
    ;(async () => {
      try {
        const list = await getPublicBuilderNav(resolvedEventId)
        if (!cancelled) setPages(list)
      } catch {
        /* ignore */
      }
    })()
    return () => { cancelled = true }
  }, [resolvedEventId])

  const internalOptions = useMemo(() => {
    return [
      ...STATIC_INTERNAL,
      ...pages.map((p) => ({ value: `internal:p:${p.slug}`, label: p.title })),
    ]
  }, [pages])

  // Derive editable inner value for each mode.
  const externalValue = mode === "external" ? value : ""
  const internalValue = mode === "internal" ? value : "internal:home"
  const anchorValue   = mode === "anchor"   ? value.replace(/^anchor:/, "") : ""

  return (
    <FieldLabel label={field.label ?? "URL"}>
      <div className="space-y-2">
        {/* Mode tabs */}
        <div className="inline-flex p-0.5 bg-[#1a1a2e]/[0.05] rounded-md text-[11px]">
          <ModeTab active={mode === "external"} onClick={() => { setMode("external"); onChange("") }} icon={<ExternalLink size={11} />} label="External" />
          <ModeTab active={mode === "internal"} onClick={() => { setMode("internal"); onChange(internalValue) }} icon={<Layers size={11} />} label="Event page" />
          <ModeTab active={mode === "anchor"}   onClick={() => { setMode("anchor");   onChange("anchor:" + (anchorValue || "")) }} icon={<Hash size={11} />} label="Anchor" />
        </div>

        {mode === "external" && (
          <input
            type="url"
            value={externalValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com"
            className="w-full text-xs px-2 py-1.5 rounded-md bg-white border border-[#1a1a2e]/15 focus:outline-none focus:border-[#e7ab1c]"
          />
        )}

        {mode === "internal" && (
          <select
            value={internalValue}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded-md bg-white border border-[#1a1a2e]/15 focus:outline-none focus:border-[#e7ab1c]"
          >
            {internalOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {mode === "anchor" && (
          <div className="flex items-center gap-1">
            <span className="text-[#1a1a2e]/55 text-xs">#</span>
            <input
              type="text"
              value={anchorValue.replace(/^#/, "")}
              onChange={(e) => onChange(`anchor:#${e.target.value.replace(/^#/, "")}`)}
              placeholder="speakers"
              className="flex-1 text-xs px-2 py-1.5 rounded-md bg-white border border-[#1a1a2e]/15 focus:outline-none focus:border-[#e7ab1c]"
            />
          </div>
        )}
      </div>
    </FieldLabel>
  )
}

function ModeTab({
  active, onClick, icon, label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium ${
        active ? "bg-white text-[#1a1a2e] shadow-sm" : "text-[#1a1a2e]/70 hover:text-[#1a1a2e]"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

/**
 * Resolve a stored UrlPicker value into a real href usable in <a> / <Link>.
 * Pure helper — used in block render functions.
 *
 *   resolveUrl("https://x.com", "events/foo")         → "https://x.com"
 *   resolveUrl("internal:tickets", "events/foo")      → "/events/foo/tickets"
 *   resolveUrl("internal:p:venue", "events/foo")      → "/events/foo/p/venue"
 *   resolveUrl("internal:home", "events/foo")         → "/events/foo"
 *   resolveUrl("anchor:#speakers", "...")             → "#speakers"
 *   resolveUrl("/legacy", ...)                         → "/legacy" (passthrough)
 */
export function resolveUrl(raw: string | undefined, eventSlug: string): string {
  const v = (raw ?? "").trim()
  if (!v) return "#"
  if (v.startsWith("anchor:")) return v.slice("anchor:".length) || "#"
  if (v.startsWith("internal:")) {
    const key = v.slice("internal:".length)
    if (key === "home")     return `/events/${eventSlug}`
    if (key === "tickets")  return `/events/${eventSlug}/tickets`
    if (key === "schedule") return `/events/${eventSlug}/schedule`
    if (key === "live")     return `/events/${eventSlug}/live`
    if (key.startsWith("p:")) return `/events/${eventSlug}/p/${key.slice(2)}`
    return `/events/${eventSlug}`
  }
  return v
}

/** Decide whether a stored value should open in a new tab. External
 *  https:// URLs do; internal/anchor stay in-tab. */
export function urlIsExternal(raw: string | undefined): boolean {
  const v = (raw ?? "").trim()
  if (!v) return false
  if (v.startsWith("internal:") || v.startsWith("anchor:")) return false
  return /^https?:\/\//i.test(v)
}
