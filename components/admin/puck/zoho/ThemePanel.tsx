"use client"

/**
 * Theme panel — quick access to the 20 presets. Clicking a tile is a
 * UI-only signal to scroll the inspector to the Root block (where
 * ThemePresetGrid lives). For Phase 4 this becomes a direct theme
 * applicator that writes to events.builder_data.root.props without
 * needing the inspector to be open.
 */

import { SecondaryPanel } from "./SecondaryPanel"
import { THEME_PRESETS, type ThemePresetKey } from "../blocks"

const FONT_LABELS: Record<string, string> = {
  sf: "SF Pro / System",
  inter: "Inter",
  serif: "Playfair Display",
  mono: "JetBrains Mono",
}

export function ThemePanel({
  onClose,
  onPick,
}: {
  onClose?: () => void
  /** Caller can hook this up to set events.builder_data.root.props.themePreset directly. */
  onPick?: (key: ThemePresetKey) => void
}) {
  const keys = Object.keys(THEME_PRESETS) as ThemePresetKey[]
  return (
    <SecondaryPanel title="Theme" onClose={onClose}>
      <div className="p-3">
        <p className="text-[11px] text-[var(--z-text-muted,#6b7280)] mb-2">
          Pick a preset, or open the Root block in the canvas for full control.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {keys.map((key) => {
            const p = THEME_PRESETS[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => onPick?.(key)}
                title={p.label}
                className="flex flex-col rounded-md border border-[var(--z-border,#e5e7eb)] overflow-hidden bg-white hover:border-[var(--z-border-strong,#d1d5db)] hover:shadow-[var(--z-shadow-sm)] transition-all text-left"
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
      </div>
    </SecondaryPanel>
  )
}
