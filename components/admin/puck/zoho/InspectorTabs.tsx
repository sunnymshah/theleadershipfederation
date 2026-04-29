"use client"

/**
 * Zoho-style right-inspector tab bar.
 *
 * Wraps Puck's default field list with four tabs:
 *   - Settings   — content fields (title, body, ctaLabel, etc.)
 *   - Style      — layout fields (padding, bg colour/image, alignment)
 *   - Visibility — Hide on public, Lock for non-admin viewers
 *   - Advanced   — Anchor (#id), CSS class
 *
 * Visibility + Advanced talk directly to the selected block via
 * usePuck(); they don't piggyback on the field-config render path so
 * they work no matter which block is selected.
 */

import { useState, type ReactNode } from "react"
import {
  Settings as SettingsIcon, Palette, Eye, EyeOff, Sliders, Lock, Unlock, Beaker, X,
} from "lucide-react"
import { usePuck } from "@measured/puck"

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
  // Hooks must be called unconditionally — read selected block here so
  // we don't violate rules-of-hooks below.
  const { appState } = usePuck()

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

  // Read selected block's type so the overlay header shows what we're editing.
  const selBlock = appState.data.content[itemSelector.index] as { type?: string } | undefined
  const blockType = selBlock?.type ?? "Section"

  function closeOverlay() {
    window.dispatchEvent(new CustomEvent("builder:close-inspector"))
  }

  return (
    <div className="lf-zoho-inspector flex flex-col h-full">
      {/* Overlay header — shown only when the shell has lf-inspector-open
          (CSS in builder-theme.css positions the whole inspector as a
          slide-in when that class is set; otherwise the inspector is
          hidden and this header doesn't render anywhere visible). */}
      <div className="shrink-0 flex items-center gap-2 px-3 h-11 border-b border-[var(--z-border,#e5e7eb)] bg-[var(--z-bg,#fff)]">
        <span className="inline-flex items-center px-2 h-5 rounded text-[10px] font-bold uppercase tracking-[0.06em] bg-[var(--z-bg-alt,#f7f8fa)] text-[var(--z-text-muted,#6b7280)]">
          {blockType}
        </span>
        <span className="text-[12px] text-[var(--z-text-muted,#6b7280)]">settings</span>
        <button
          type="button"
          onClick={closeOverlay}
          aria-label="Close inspector"
          title="Close (Esc)"
          className="ml-auto inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-text,#1f2937)] hover:bg-[var(--z-bg-alt,#f7f8fa)]"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>
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
          <VisibilityTab />
        ) : (
          <AdvancedTab />
        )}
      </div>
    </div>
  )
}

/* ── Visibility tab ──────────────────────────────────────────────── */

function VisibilityTab() {
  const { appState, dispatch } = usePuck()
  const sel = appState.ui.itemSelector
  const idx = typeof sel?.index === "number" ? sel.index : -1
  if (idx === -1) return <PlaceholderTab Icon={Eye} title="Nothing selected" body="Click a section first." />

  const block = appState.data.content[idx] as { type: string; props: Record<string, unknown> } | undefined
  if (!block) return <PlaceholderTab Icon={Eye} title="Section not found" body="Try clicking it again on the canvas." />

  const hidden = !!block.props.__hidden
  const layout = (block.props.layout ?? {}) as Record<string, unknown>
  const locked = !!layout.locked

  function patchProp(key: string, value: unknown) {
    if (idx === -1 || !block) return
    dispatch({
      type: "replace",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { type: block.type, props: { ...block.props, [key]: value } } as any,
      destinationIndex: idx,
      destinationZone: "root:default-zone",
    })
  }
  function patchLayout(key: string, value: unknown) {
    if (idx === -1 || !block) return
    const nextLayout = { ...layout, [key]: value }
    dispatch({
      type: "replace",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { type: block.type, props: { ...block.props, layout: nextLayout } } as any,
      destinationIndex: idx,
      destinationZone: "root:default-zone",
    })
  }

  return (
    <div className="p-4 space-y-3">
      <ToggleRow
        Icon={hidden ? EyeOff : Eye}
        label="Hide on public site"
        description="Editor still shows the section with diagonal stripes; visitors never see it."
        checked={hidden}
        onChange={(v) => patchProp("__hidden", v)}
      />
      <ToggleRow
        Icon={locked ? Lock : Unlock}
        label="Lock for non-admins"
        description="Public renderer disables interaction (pointer-events: none) on this section."
        checked={locked}
        onChange={(v) => patchLayout("locked", v)}
      />
      <p className="text-[11px] text-[var(--z-text-muted,#6b7280)] leading-relaxed pt-2">
        Per-breakpoint visibility (Desktop / Tablet / Mobile) and time-window schedules
        ship with the next builder release.
      </p>
    </div>
  )
}

/* ── Advanced tab ────────────────────────────────────────────────── */

function AdvancedTab() {
  const { appState, dispatch } = usePuck()
  const sel = appState.ui.itemSelector
  const idx = typeof sel?.index === "number" ? sel.index : -1
  if (idx === -1) return <PlaceholderTab Icon={Sliders} title="Nothing selected" body="Click a section first." />

  const block = appState.data.content[idx] as { type: string; props: Record<string, unknown> } | undefined
  if (!block) return <PlaceholderTab Icon={Sliders} title="Section not found" body="Try clicking it again on the canvas." />

  const layout = (block.props.layout ?? {}) as Record<string, unknown>
  const anchor = typeof layout.anchor === "string" ? layout.anchor : ""
  const cssClass = typeof layout.cssClass === "string" ? layout.cssClass : ""
  const blockId = typeof block.props.id === "string" ? block.props.id : ""
  const blockType = block.type

  function patchLayout(key: string, value: unknown) {
    if (idx === -1 || !block) return
    const nextLayout = { ...layout, [key]: value }
    dispatch({
      type: "replace",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { type: block.type, props: { ...block.props, layout: nextLayout } } as any,
      destinationIndex: idx,
      destinationZone: "root:default-zone",
    })
  }

  function openAbDialog() {
    window.dispatchEvent(new CustomEvent("builder:open-ab-dialog", {
      detail: { blockId, blockType, blockProps: block!.props },
    }))
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">
            Anchor id
          </span>
          <input
            type="text"
            value={anchor}
            onChange={(e) => patchLayout("anchor", e.target.value)}
            placeholder="e.g. agenda  → renders id=&quot;agenda&quot;"
            className="w-full px-2.5 py-2 rounded-md border border-[var(--z-border,#d1d5db)] bg-white text-[13px]"
          />
        </label>
        <p className="mt-1 text-[11px] text-[var(--z-text-muted,#6b7280)]">
          Used for in-page links like <code className="font-mono">#agenda</code>.
        </p>
      </div>

      <div>
        <label className="block">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">
            Custom CSS class
          </span>
          <input
            type="text"
            value={cssClass}
            onChange={(e) => patchLayout("cssClass", e.target.value)}
            placeholder="e.g. lf-tier-platinum"
            className="w-full px-2.5 py-2 rounded-md border border-[var(--z-border,#d1d5db)] bg-white text-[13px]"
          />
        </label>
        <p className="mt-1 text-[11px] text-[var(--z-text-muted,#6b7280)]">
          Appended to the section&apos;s wrapper className.
        </p>
      </div>

      <div className="pt-3 border-t border-[var(--z-border,#e5e7eb)]">
        <button
          type="button"
          onClick={openAbDialog}
          className="w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-md bg-[var(--lf-primary,#e7ab1c)]/10 text-[var(--lf-primary,#e7ab1c)] hover:bg-[var(--lf-primary,#e7ab1c)]/20 text-[12px] font-bold uppercase tracking-wider"
        >
          <Beaker size={13} />
          Run an A/B test on this section
        </button>
        <p className="mt-1.5 text-[11px] text-[var(--z-text-muted,#6b7280)]">
          Sets up a draft variant to compare against the current version.
        </p>
      </div>

      <div className="pt-3 border-t border-[var(--z-border,#e5e7eb)] text-[10px] text-[var(--z-text-muted,#6b7280)]">
        <span className="font-mono">{blockType}</span> · id <span className="font-mono">{blockId.slice(0, 12)}…</span>
      </div>
    </div>
  )
}

/* ── shared bits ─────────────────────────────────────────────────── */

function ToggleRow({
  Icon, label, description, checked, onChange,
}: {
  Icon: typeof Eye
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-[var(--z-border,#e5e7eb)] p-3 cursor-pointer hover:border-[var(--z-info,#3e7af7)]/40">
      <Icon size={14} strokeWidth={1.5} className="mt-0.5 text-[var(--z-text-muted,#6b7280)]" />
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-semibold text-[var(--z-text,#1f2937)]">{label}</span>
        <span className="block text-[11px] text-[var(--z-text-muted,#6b7280)] mt-0.5 leading-relaxed">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
      />
    </label>
  )
}

function PlaceholderTab({ Icon, title, body }: { Icon: typeof Eye; title: string; body: string }) {
  return (
    <div className="p-4">
      <div className="z-empty mt-8">
        <Icon size={32} strokeWidth={1.5} className="z-empty-icon" />
        <p className="z-empty-title">{title}</p>
        <p className="z-empty-desc">{body}</p>
      </div>
    </div>
  )
}

/**
 * fieldLabel override that stamps each field's wrapper with a
 * data-z-cat attribute matching its category.
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
