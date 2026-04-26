"use client"

/**
 * Drop-in Sparkles button next to a text/textarea field.
 * Opens a small floating panel with quick chips (Make shorter / punchier
 * / on-brand / SEO / translate / custom). Diffs the response, lets the
 * admin Apply or Cancel.
 *
 * Usage:
 *   <SparklesAssist
 *     value={value}
 *     onChange={setValue}
 *     fieldType="title"
 *     locales={["en","hi"]}
 *   />
 */

import { useEffect, useRef, useState, useTransition } from "react"
import { Sparkles, Loader2, Check, X } from "lucide-react"
import { aiAssistField, type AssistMode } from "@/app/actions/aiActions"
import { LOCALE_LABELS } from "@/lib/locales"

const QUICK_CHIPS: Array<{ mode: AssistMode; label: string }> = [
  { mode: "shorter",     label: "Shorter" },
  { mode: "punchier",    label: "Punchier" },
  { mode: "on-brand",    label: "On-brand" },
  { mode: "improve-seo", label: "Improve SEO" },
]

export function SparklesAssist({
  value, onChange, fieldType, locales,
}: {
  value: string
  onChange: (next: string) => void
  fieldType?: "title" | "subtitle" | "body" | "cta" | "generic"
  /** Locales available for the translate preset. */
  locales?: string[]
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [customPrompt, setCustomPrompt] = useState("")
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setPreview(null); setError(null)
      }
    }
    window.addEventListener("mousedown", close)
    return () => window.removeEventListener("mousedown", close)
  }, [open])

  function run(mode: AssistMode, opts: { customPrompt?: string; targetLocale?: string } = {}) {
    setError(null)
    setPreview(null)
    start(async () => {
      const res = await aiAssistField({
        fieldType, currentValue: value, mode,
        customPrompt: opts.customPrompt,
        targetLocale: opts.targetLocale,
      })
      if (!res.success) { setError(res.error ?? "AI failed"); return }
      setPreview(res.result ?? "")
    })
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="AI assist"
        title="AI assist (Gemini)"
        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--lf-primary,#e7ab1c)] hover:bg-[var(--lf-primary,#e7ab1c)]/10"
      >
        <Sparkles size={14} strokeWidth={1.5} />
      </button>
      {open && (
        <div
          role="dialog"
          className="absolute right-0 top-9 z-50 w-80 rounded-md bg-white shadow-2xl border border-[#1a1a2e]/10 p-3 space-y-2"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#1a1a2e]/55">AI assist · Gemini</p>
          {!preview && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_CHIPS.map((c) => (
                  <button
                    key={c.mode}
                    type="button"
                    onClick={() => run(c.mode)}
                    disabled={pending}
                    className="inline-flex items-center px-2.5 h-7 rounded-md text-[11px] font-semibold bg-[#1a1a2e]/[0.04] text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.08]"
                  >
                    {c.label}
                  </button>
                ))}
                {locales && locales.filter((l) => l !== "en").map((lc) => (
                  <button
                    key={`tx-${lc}`}
                    type="button"
                    onClick={() => run("translate", { targetLocale: lc })}
                    disabled={pending}
                    className="inline-flex items-center px-2.5 h-7 rounded-md text-[11px] font-semibold bg-[#1a1a2e]/[0.04] text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.08]"
                  >
                    → {LOCALE_LABELS[lc] ?? lc}
                  </button>
                ))}
              </div>
              <div>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={2}
                  placeholder="Or describe the change you want…"
                  className="w-full px-2 py-1.5 rounded border border-[#1a1a2e]/15 text-[12px]"
                />
                <button
                  type="button"
                  onClick={() => customPrompt.trim() && run("custom", { customPrompt })}
                  disabled={pending || !customPrompt.trim()}
                  className="mt-1 inline-flex items-center px-3 h-7 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[var(--lf-primary,#e7ab1c)] text-white hover:bg-[#d49c10] disabled:opacity-60"
                >
                  Run
                </button>
              </div>
              {pending && (
                <p className="text-[11px] text-[#1a1a2e]/55 flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" /> Asking Gemini…
                </p>
              )}
            </>
          )}
          {preview !== null && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-[#1a1a2e]/55">Preview</p>
              <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-[#1a1a2e] bg-[#1a1a2e]/[0.02] border border-[#1a1a2e]/[0.06] rounded-md p-2 max-h-48 overflow-y-auto">{preview}</pre>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => { onChange(preview); setOpen(false); setPreview(null) }}
                  className="inline-flex items-center gap-1 px-3 h-7 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[var(--lf-primary,#e7ab1c)] text-white"
                >
                  <Check size={11} /> Apply
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="inline-flex items-center gap-1 px-3 h-7 rounded-md text-[11px] font-semibold text-[#1a1a2e]/70 hover:bg-[#1a1a2e]/[0.04]"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); setPreview(null) }}
                  className="inline-flex items-center gap-1 px-3 h-7 rounded-md text-[11px] font-semibold text-[#1a1a2e]/70 hover:bg-[#1a1a2e]/[0.04] ml-auto"
                >
                  <X size={11} /> Cancel
                </button>
              </div>
            </div>
          )}
          {error && (
            <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
