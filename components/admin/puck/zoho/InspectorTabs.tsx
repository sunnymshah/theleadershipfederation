"use client"

/**
 * Zoho-style right-inspector tab bar.
 *
 * Wraps Puck's default field list with four tabs:
 *   - Settings   — content fields (title, body, ctaLabel, etc.)
 *   - Style      — layout fields (padding, bg colour/image, alignment)
 *   - Visibility — show on desktop/tablet/mobile + schedule (Phase 5)
 *   - Advanced   — anchor id, custom CSS class, A/B (Phase 5)
 *
 * Each field's label is matched against a small keyword set by the
 * fieldLabel override (see categorizeFieldLabel below) and stamped with
 * a data-z-cat attribute. The tab bar then uses a scoped CSS rule to
 * hide non-matching fields when a non-Settings tab is active.
 *
 * Visibility + Advanced tabs currently render a friendly empty-state
 * card pointing to Phase 5; existing block field schemas haven't been
 * extended yet to actually carry these fields.
 */

import { useState, type ReactNode } from "react"
import { Settings as SettingsIcon, Palette, Eye, Sliders } from "lucide-react"

type TabKey = "settings" | "style" | "visibility" | "advanced"

const TABS: Array<{ key: TabKey; label: string; Icon: typeof SettingsIcon }> = [
  { key: "settings",   label: "Settings",   Icon: SettingsIcon },
  { key: "style",      label: "Style",      Icon: Palette },
  { key: "visibility", label: "Visibility", Icon: Eye },
  { key: "advanced",   label: "Advanced",   Icon: Sliders },
]

const STYLE_KEYWORDS = [
  "layout", "padding", "background", "overlay", "text colour", "text color",
  "align", "full bleed", "bleed",
]

/** Returns the category for a field label. Matches case-insensitively. */
export function categorizeFieldLabel(label: string): TabKey {
  const l = (label ?? "").toLowerCase()
  if (STYLE_KEYWORDS.some((kw) => l.includes(kw))) return "style"
  // visibility/advanced keywords reserved for when field schemas extend;
  // for now everything non-style goes to Settings.
  return "settings"
}

/**
 * The wrapper used by `overrides.fields`. We can't re-render Puck's
 * fields ourselves (their internal AutoField wiring is complex), so we
 * keep `children` (the default-rendered field list) and toggle visibility
 * via a scoped style block that targets the data-z-cat attribute set by
 * the fieldLabel override.
 */
export function InspectorTabs({
  children,
  isLoading,
  itemSelector,
}: {
  children: ReactNode
  isLoading?: boolean
  itemSelector?: { index: number; zone?: string } | null | undefined
}) {
  const [tab, setTab] = useState<TabKey>("settings")

  // Empty-state when nothing selected.
  if (!itemSelector) {
    return (
      <div className="lf-zoho-inspector p-4 h-full overflow-y-auto">
        <div className="z-empty mt-12">
          <Sliders size={32} strokeWidth={1.5} className="z-empty-icon" />
          <p className="z-empty-title">Select a section to edit</p>
          <p className="z-empty-desc">
            Click any section on the canvas — its fields appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="lf-zoho-inspector flex flex-col h-full">
      {/* Tab bar */}
      <div role="tablist" className="shrink-0 flex items-center border-b border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg,#fff)] px-2">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-3 h-10 -mb-px text-[12px] font-medium border-b-2 transition-colors ${
              tab === key
                ? "border-[var(--z-accent,#f0483e)] text-[var(--z-text,#1f2937)]"
                : "border-transparent text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-text,#1f2937)]"
            }`}
          >
            <Icon size={13} strokeWidth={1.5} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Per-tab body. CSS toggles inside the children based on the
          current tab key (see fieldLabel override). For non-Settings/
          Style tabs we render a placeholder; for Settings + Style we
          let children render through. */}
      <div
        className="flex-1 overflow-y-auto"
        data-z-tab={tab}
      >
        {(tab === "settings" || tab === "style") ? (
          <>
            <style>{`
              .lf-zoho-inspector [data-z-tab="style"] [data-z-cat]:not([data-z-cat="style"]),
              .lf-zoho-inspector [data-z-tab="style"] [data-z-cat]:not([data-z-cat="style"]) ~ *:not([data-z-cat]) {
                display: none;
              }
              .lf-zoho-inspector [data-z-tab="settings"] [data-z-cat="style"] {
                display: none;
              }
            `}</style>
            {isLoading ? (
              <div className="p-6 text-[12px] text-[var(--z-text-muted,#6b7280)]">Loading…</div>
            ) : children}
          </>
        ) : tab === "visibility" ? (
          <div className="p-4">
            <div className="z-empty mt-8">
              <Eye size={32} strokeWidth={1.5} className="z-empty-icon" />
              <p className="z-empty-title">Visibility settings</p>
              <p className="z-empty-desc">
                Show on Desktop / Tablet / Mobile and schedule visibility — coming in
                the next release.
              </p>
            </div>
            <p className="mt-2 px-1 text-[11px] text-[var(--z-text-muted,#6b7280)]">
              For now, use the section overflow menu (•••) on the canvas to Hide / Show a section.
            </p>
          </div>
        ) : (
          <div className="p-4">
            <div className="z-empty mt-8">
              <Sliders size={32} strokeWidth={1.5} className="z-empty-icon" />
              <p className="z-empty-title">Advanced</p>
              <p className="z-empty-desc">
                Anchor id, custom CSS class, A/B test variants — coming in the next release.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * fieldLabel override that stamps each field's wrapper with a
 * data-z-cat attribute matching its category. The InspectorTabs CSS
 * rule above hides non-matching wrappers when a tab filters by
 * category.
 *
 * Puck's default render passes the original wrapper element via
 * `el` ("label" or "div"). We re-use it so the form behaves identically.
 */
export function ZohoFieldLabel({
  children,
  icon,
  label,
  el = "label",
  readOnly,
  className,
}: {
  children?: ReactNode
  icon?: ReactNode
  label: string
  el?: "label" | "div"
  readOnly?: boolean
  className?: string
}) {
  const cat = categorizeFieldLabel(label)
  const Tag = el as "label" | "div"
  return (
    <Tag
      data-z-cat={cat}
      className={[
        "lf-zoho-field block",
        "px-3 py-2",
        readOnly ? "opacity-60" : "",
        className ?? "",
      ].filter(Boolean).join(" ")}
    >
      <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      {children}
    </Tag>
  )
}
