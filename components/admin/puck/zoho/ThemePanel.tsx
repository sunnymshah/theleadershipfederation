"use client"

/**
 * Theme panel — Zoho-style theme editor.
 *
 * Top  — 4-col grid of preset thumbnails. Click applies preset.
 * Mid  — Custom block: primary / text / background colour pickers + font dropdown.
 * Bot  — Page background image (URL paste; full upload deferred to Phase 5).
 *
 * Every change writes through `patchRootProps` which dispatches a Puck
 * `replaceRoot` action — the canvas re-renders immediately and autosave
 * picks up the change as part of the normal flow.
 */

import { useEffect, useState } from "react"
import { Palette, Image as ImageIcon } from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import { THEME_PRESETS, type ThemePresetKey } from "../blocks"
import { getPuckData, patchRootProps } from "./PuckBridge"

const FONT_LABELS: Record<string, string> = {
  sf:    "SF Pro / System",
  inter: "Inter",
  serif: "Playfair Display",
  mono:  "JetBrains Mono",
}

const FONT_VALUES: Array<{ value: "sf" | "inter" | "serif" | "mono"; label: string }> = [
  { value: "sf",    label: FONT_LABELS.sf },
  { value: "inter", label: FONT_LABELS.inter },
  { value: "serif", label: FONT_LABELS.serif },
  { value: "mono",  label: FONT_LABELS.mono },
]

type RootSnapshot = {
  themePreset?: ThemePresetKey
  primaryColor?: string
  textColor?: string
  bgColor?: string
  fontFamily?: "sf" | "inter" | "serif" | "mono"
  pageBackgroundUrl?: string
}

function readRoot(): RootSnapshot {
  const data = getPuckData()
  const props = (data?.root as { props?: Record<string, unknown> } | undefined)?.props ?? {}
  return {
    themePreset:       props.themePreset       as ThemePresetKey | undefined,
    primaryColor:      props.primaryColor      as string | undefined,
    textColor:         props.textColor         as string | undefined,
    bgColor:           props.bgColor           as string | undefined,
    fontFamily:        props.fontFamily        as RootSnapshot["fontFamily"],
    pageBackgroundUrl: props.pageBackgroundUrl as string | undefined,
  }
}

export function ThemePanel({
  onClose,
}: {
  onClose?: () => void
}) {
  const [root, setRoot] = useState<RootSnapshot>(() => readRoot())
  // Re-read every 500ms while panel is open (covers the case where the
  // admin made changes via the right inspector).
  useEffect(() => {
    const t = setInterval(() => setRoot(readRoot()), 500)
    return () => clearInterval(t)
  }, [])

  const keys = Object.keys(THEME_PRESETS) as ThemePresetKey[]
  const currentPreset: ThemePresetKey = root.themePreset ?? "custom"

  function pickPreset(key: ThemePresetKey) {
    patchRootProps({ themePreset: key })
    setRoot((r) => ({ ...r, themePreset: key }))
  }

  function setColor(field: "primaryColor" | "textColor" | "bgColor", val: string) {
    patchRootProps({ themePreset: "custom", [field]: val })
    setRoot((r) => ({ ...r, themePreset: "custom", [field]: val }))
  }

  function setFont(val: RootSnapshot["fontFamily"]) {
    patchRootProps({ themePreset: "custom", fontFamily: val })
    setRoot((r) => ({ ...r, themePreset: "custom", fontFamily: val }))
  }

  function setPageBg(url: string) {
    patchRootProps({ pageBackgroundUrl: url })
    setRoot((r) => ({ ...r, pageBackgroundUrl: url }))
  }

  return (
    <SecondaryPanel title="Theme" onClose={onClose}>
      <div className="p-3">
        {/* ── Presets ── */}
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--z-text-muted,#6b7280)] mb-2">
          Presets
        </p>
        <div className="grid grid-cols-2 gap-2">
          {keys.map((key) => {
            const p = THEME_PRESETS[key]
            const active = currentPreset === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => pickPreset(key)}
                title={p.label}
                className={`flex flex-col rounded-md overflow-hidden bg-white border transition-all text-left ${
                  active
                    ? "border-[var(--z-accent,#f0483e)] ring-2 ring-[var(--z-accent,#f0483e)]/30"
                    : "border-[var(--z-border,#e5e7eb)] hover:border-[var(--z-border-strong,#d1d5db)] hover:shadow-[var(--z-shadow-sm)]"
                }`}
              >
                <div className="h-10 flex items-center justify-center gap-1.5 px-2" style={{ backgroundColor: p.bg }}>
                  <span className="inline-block w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: p.primary }} />
                  <span className="inline-block w-4 h-4 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: p.text }} />
                </div>
                <div className="px-2 py-1.5 bg-white">
                  <p className="text-[11px] font-semibold text-[var(--z-text,#1f2937)] truncate leading-tight">
                    {p.label.replace(/^\d+\.\s*/, "")}
                  </p>
                  <p className="text-[10px] text-[var(--z-text-muted,#6b7280)] truncate">
                    {FONT_LABELS[p.font] ?? p.font}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Custom colours ── */}
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--z-text-muted,#6b7280)] mb-2">
          Custom
        </p>
        <div className="space-y-2">
          <ColorRow
            label="Primary"
            value={root.primaryColor ?? THEME_PRESETS[currentPreset]?.primary ?? "#e7ab1c"}
            onChange={(v) => setColor("primaryColor", v)}
          />
          <ColorRow
            label="Text"
            value={root.textColor ?? THEME_PRESETS[currentPreset]?.text ?? "#1a1a2e"}
            onChange={(v) => setColor("textColor", v)}
          />
          <ColorRow
            label="Background"
            value={root.bgColor ?? THEME_PRESETS[currentPreset]?.bg ?? "#ffffff"}
            onChange={(v) => setColor("bgColor", v)}
          />
          <label className="block">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--z-text-muted,#6b7280)] mb-1">
              Font
            </span>
            <select
              value={root.fontFamily ?? THEME_PRESETS[currentPreset]?.font ?? "sf"}
              onChange={(e) => setFont(e.target.value as RootSnapshot["fontFamily"])}
              className="z-input"
            >
              {FONT_VALUES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </label>
        </div>

        {/* ── Page background image ── */}
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--z-text-muted,#6b7280)] mb-2">
          Page background image
        </p>
        <div className="flex items-center gap-2">
          {root.pageBackgroundUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={root.pageBackgroundUrl}
              alt="Page background"
              className="w-12 h-12 rounded-md object-cover border border-[var(--z-border,#e5e7eb)]"
            />
          ) : (
            <span className="w-12 h-12 rounded-md bg-[var(--z-bg-alt,#f7f8fa)] border border-[var(--z-border,#e5e7eb)] flex items-center justify-center">
              <ImageIcon size={16} strokeWidth={1.5} className="text-[var(--z-text-subtle,#9ca3af)]" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <input
              type="url"
              defaultValue={root.pageBackgroundUrl ?? ""}
              placeholder="Paste an image URL"
              onBlur={(e) => setPageBg(e.target.value.trim())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  ;(e.currentTarget as HTMLInputElement).blur()
                }
              }}
              className="z-input"
            />
            {root.pageBackgroundUrl && (
              <button
                type="button"
                onClick={() => setPageBg("")}
                className="mt-1 text-[10px] text-[var(--z-text-muted,#6b7280)] hover:text-[var(--z-danger,#dc2626)]"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 px-1 text-[11px] text-[var(--z-text-muted,#6b7280)] flex items-start gap-1.5">
          <Palette size={12} strokeWidth={1.5} className="mt-0.5 shrink-0" />
          <span>Changes apply immediately. Click <strong>Publish</strong> to push live.</span>
        </p>
      </div>
    </SecondaryPanel>
  )
}

function ColorRow({
  label, value, onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  // Sanitize value for the native color input — only #rrggbb is accepted.
  const safe = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"
  return (
    <label className="flex items-center gap-2">
      <span className="w-20 text-[12px] text-[var(--z-text-muted,#6b7280)] shrink-0">{label}</span>
      <input
        type="color"
        value={safe}
        onChange={(e) => onChange(e.target.value)}
        className="w-9 h-8 rounded-md border border-[var(--z-border,#e5e7eb)] bg-transparent p-0.5 cursor-pointer"
        aria-label={`${label} colour swatch`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="z-input flex-1 font-mono text-[12px]"
        placeholder="#rrggbb"
      />
    </label>
  )
}
