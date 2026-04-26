"use client"

/**
 * Languages panel — picks which locales the microsite supports + sets the
 * default. Persists to events.locales[] + events.default_locale via the
 * languagesActions module.
 */

import { useEffect, useState, useTransition } from "react"
import { Check, Loader2, Plus, X } from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import { SUPPORTED_LOCALES, LOCALE_LABELS, LOCALE_FLAGS } from "@/lib/locales"
import { getEventLanguages, setEventLanguages } from "@/app/actions/languagesActions"

export function LanguagesPanel({ eventId, onClose }: { eventId: string; onClose?: () => void }) {
  const [active, setActive] = useState<string[]>(["en"])
  const [defaultLocale, setDefaultLocale] = useState("en")
  const [loading, setLoading] = useState(true)
  const [pending, start] = useTransition()
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let cancelled = false
    void getEventLanguages(eventId).then((res) => {
      if (cancelled) return
      setActive(res.locales.length > 0 ? res.locales : ["en"])
      setDefaultLocale(res.default_locale ?? "en")
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [eventId])

  function persist(nextActive: string[], nextDefault: string) {
    setActive(nextActive)
    setDefaultLocale(nextDefault)
    start(async () => {
      await setEventLanguages(eventId, nextActive, nextDefault)
    })
  }

  function add(lc: string) {
    if (active.includes(lc)) return
    persist([...active, lc], defaultLocale)
    setAdding(false)
  }

  function remove(lc: string) {
    if (lc === defaultLocale) return alert("Can't remove the default locale.")
    persist(active.filter((l) => l !== lc), defaultLocale)
  }

  return (
    <SecondaryPanel title="Languages" onClose={onClose}>
      {loading ? (
        <div className="z-empty mt-12">
          <Loader2 size={20} className="animate-spin z-empty-icon" />
        </div>
      ) : (
        <div className="px-2 py-2">
          <p className="px-2 text-[11px] text-[var(--z-text-muted,#6b7280)] leading-relaxed mb-2">
            Pick the languages this microsite supports. Visitors see a switcher in the top nav.
            Per-locale Puck data lives at <code className="font-mono">event_standard_pages.settings.{`{locale}`}.puckData</code>.
          </p>
          <ul className="space-y-1">
            {active.map((lc) => (
              <li
                key={lc}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 hover:bg-[var(--z-bg-alt,#f7f8fa)]"
              >
                <span className="text-base leading-none">{LOCALE_FLAGS[lc] ?? "🌐"}</span>
                <span className="flex-1 text-[13px] font-medium text-[var(--z-text,#1f2937)]">
                  {LOCALE_LABELS[lc] ?? lc}
                </span>
                <label className="flex items-center gap-1 text-[11px] text-[var(--z-text-muted,#6b7280)]">
                  <input
                    type="radio"
                    name="default-locale"
                    checked={defaultLocale === lc}
                    onChange={() => persist(active, lc)}
                  />
                  default
                </label>
                {lc !== defaultLocale && (
                  <button
                    type="button"
                    onClick={() => remove(lc)}
                    aria-label="Remove"
                    className="z-btn z-btn-icon !w-6 !h-6 hover:!text-red-700 hover:!bg-red-50"
                  >
                    <X size={11} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full mt-3 inline-flex items-center justify-center gap-1.5 h-8 rounded-md border border-dashed border-[var(--z-border-strong,#d1d5db)] text-[12px] text-[var(--z-text-muted,#6b7280)] hover:border-[var(--z-info,#3e7af7)] hover:text-[var(--z-info,#3e7af7)]"
            >
              <Plus size={12} /> Add language
            </button>
          ) : (
            <div className="mt-3 max-h-60 overflow-y-auto rounded-md border border-[var(--z-border,#e5e7eb)] bg-white">
              {SUPPORTED_LOCALES.filter((lc) => !active.includes(lc)).map((lc) => (
                <button
                  key={lc}
                  type="button"
                  onClick={() => add(lc)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-[var(--z-bg-alt,#f7f8fa)]"
                >
                  <span className="text-base leading-none">{LOCALE_FLAGS[lc] ?? "🌐"}</span>
                  <span className="flex-1">{LOCALE_LABELS[lc] ?? lc}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--z-text-subtle,#9ca3af)]">{lc}</span>
                </button>
              ))}
            </div>
          )}
          {pending && (
            <p className="mt-2 text-[11px] text-[var(--z-text-muted,#6b7280)] flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" /> Saving…
            </p>
          )}
          {!pending && (
            <p className="mt-2 text-[11px] text-[var(--z-success,#10b981)] flex items-center gap-1.5">
              <Check size={12} /> Saved.
            </p>
          )}
        </div>
      )}
    </SecondaryPanel>
  )
}
