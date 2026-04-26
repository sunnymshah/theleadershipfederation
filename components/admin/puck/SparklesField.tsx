"use client"

/**
 * Puck custom-field renderer: a text or textarea input with a Sparkles
 * AI-assist button glued to the right. Matches Puck's native field
 * styling so it slots cleanly into the inspector panel.
 *
 * Used in puck-config for high-value copy fields (Hero title/subtitle,
 * RichText body, CtaWithImage title/body).
 */

import type { FieldProps } from "@measured/puck"
import { SparklesAssist } from "./SparklesAssist"

type FieldType = "text" | "textarea"
type FieldHint = "title" | "subtitle" | "body" | "cta" | "generic"

export function makeSparklesField(opts: {
  label: string
  type?: FieldType
  hint?: FieldHint
  rows?: number
}) {
  const { label, type = "text", hint = "generic", rows = 4 } = opts
  return {
    type: "custom" as const,
    label,
    render: (p: FieldProps) => {
      const value = (p.value as string) ?? ""
      const onChange = p.onChange as (v: string) => void
      return (
        <label className="block">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--bs-text-muted,#6b7280)] mb-1">
            {label}
          </span>
          <div className="relative">
            {type === "textarea" ? (
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                className="w-full px-2.5 py-2 pr-9 rounded-md border border-[var(--bs-border,#d1d5db)] bg-white text-[13px] resize-y"
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-2.5 py-2 pr-9 rounded-md border border-[var(--bs-border,#d1d5db)] bg-white text-[13px]"
              />
            )}
            <span className="absolute right-1 top-1">
              <SparklesAssist
                value={value}
                onChange={(next) => onChange(next)}
                fieldType={hint}
              />
            </span>
          </div>
        </label>
      )
    },
  }
}
