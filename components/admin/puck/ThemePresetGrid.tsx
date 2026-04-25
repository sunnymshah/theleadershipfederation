"use client"

/**
 * Custom Puck field rendering the 20 theme presets as a 4-column grid of
 * tappable tiles. Each tile shows the bg + primary + text swatches and
 * the font name so the admin can pick by sight rather than reading
 * "1. Classic Gold" in a select box.
 *
 * Replaces the plain themePreset select in puck-config.tsx.
 */

import { FieldLabel } from "@measured/puck"
import { THEME_PRESETS, type ThemePresetKey } from "./blocks"

const FONT_LABELS: Record<string, string> = {
  sf: "SF Pro / System",
  inter: "Inter",
  serif: "Playfair Display",
  mono: "JetBrains Mono",
}

export function ThemePresetGrid({
  field,
  value,
  onChange,
}: {
  field: { label?: string }
  value: string | undefined
  onChange: (v: string) => void
}) {
  const current: ThemePresetKey = (value as ThemePresetKey) || "custom"

  // Render every preset key (including "custom") as a tile so the admin
  // can flip back to manual control with one click.
  const keys = Object.keys(THEME_PRESETS) as ThemePresetKey[]

  return (
    <FieldLabel label={field.label ?? "Theme preset"}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {keys.map((key) => {
          const preset = THEME_PRESETS[key]
          const active = current === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={active}
              title={preset.label}
              className={`relative flex flex-col items-stretch text-left rounded-lg border overflow-hidden transition-colors ${
                active
                  ? "border-[#1a1a2e] ring-2 ring-[#e7ab1c] ring-offset-1"
                  : "border-[#1a1a2e]/15 hover:border-[#1a1a2e]/30"
              }`}
            >
              {/* Visual swatch — block of bg with two coloured pills */}
              <div
                className="h-12 flex items-center justify-center px-2 gap-1.5"
                style={{ backgroundColor: preset.bg }}
              >
                <span
                  className="inline-block w-5 h-5 rounded-full shadow-sm"
                  style={{ backgroundColor: preset.primary }}
                />
                <span
                  className="inline-block w-5 h-5 rounded-full shadow-sm border border-black/10"
                  style={{ backgroundColor: preset.text }}
                />
              </div>
              {/* Caption — preset name + font name */}
              <div className="px-2 py-1.5 bg-white">
                <p className="text-[11px] font-semibold text-[#1a1a2e] truncate leading-tight">
                  {preset.label.replace(/^\d+\.\s*/, "")}
                </p>
                <p className="text-[10px] text-[#1a1a2e]/55 truncate">
                  {FONT_LABELS[preset.font] ?? preset.font}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </FieldLabel>
  )
}
