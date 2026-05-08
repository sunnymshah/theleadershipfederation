"use client"

/**
 * Languages panel — picks which locales the microsite supports + sets the
 * default. Persists to events.locales[] + events.default_locale via the
 * languagesActions module.
 */

import { useEffect, useState, useTransition } from "react"
import { Check, Loader2, Plus, X, Sparkles, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react"
import { SecondaryPanel } from "./SecondaryPanel"
import { SUPPORTED_LOCALES, LOCALE_LABELS, LOCALE_FLAGS } from "@/lib/locales"
import { getEventLanguages, setEventLanguages, getLocaleCoverage } from "@/app/actions/languagesActions"
import { aiAutoTranslateEvent } from "@/app/actions/aiActions"

export function LanguagesPanel({ eventId, onClose }: { eventId: string; onClose?: () => void }) {
  const [active, setActive] = useState<string[]>(["en"])
  const [defaultLocale, setDefaultLocale] = useState("en")
  // PART C10 — locales hidden from the public top-nav switcher.
  const [hidden, setHidden] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, start] = useTransition()
  const [adding, setAdding] = useState(false)
  const [translating, setTranslating] = useState<string | null>(null)
  const [translateMsg, setTranslateMsg] = useState<string | null>(null)
  const [coverage, setCoverage] = useState<Record<string, "full" | "partial" | "empty">>({})

  useEffect(() => {
    let cancelled = false
    void Promise.all([getEventLanguages(eventId), getLocaleCoverage(eventId)]).then(([langs, cov]) => {
      if (cancelled) return
      setActive(langs.locales.length > 0 ? langs.locales : ["en"])
      setDefaultLocale(langs.default_locale ?? "en")
      setHidden(langs.locales_hidden ?? [])
      setCoverage(cov.coverage)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [eventId, translateMsg])

  function persist(nextActive: string[], nextDefault: string, nextHidden: string[] = hidden) {
    setActive(nextActive)
    setDefaultLocale(nextDefault)
    setHidden(nextHidden)
    start(async () => {
      await setEventLanguages(eventId, nextActive, nextDefault, nextHidden)
    })
  }

  function add(lc: string) {
    if (active.includes(lc)) return
    persist([...active, lc], defaultLocale)
    setAdding(false)
  }

  function remove(lc: string) {
    if (lc === defaultLocale) return alert("Can't remove the default locale.")
    persist(active.filter((l) => l !== lc), defaultLocale, hidden.filter((h) => h !== lc))
  }

  // PART C10 — Hide / unhide a locale from the public switcher. The
  // default locale is always visible (it's how visitors land) and is
  // protected by setEventLanguages on the server too.
  function toggleHidden(lc: string) {
    if (lc === defaultLocale) return
    const next = hidden.includes(lc) ? hidden.filter((h) => h !== lc) : [...hidden, lc]
    persist(active, defaultLocale, next)
  }

  // PART C10 — Move a locale up/down in the active list. Drag would be
  // nicer; chevron buttons keep the change set tiny + accessible.
  function move(lc: string, dir: -1 | 1) {
    const idx = active.indexOf(lc)
    if (idx < 0) return
    const j = idx + dir
    if (j < 0 || j >= active.length) return
    const next = [...active]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    persist(next, defaultLocale)
  }

  async function autoTranslateAll(toLocale: string) {
    if (!confirm(`Auto-translate all 12 standard pages from ${LOCALE_LABELS[defaultLocale] ?? defaultLocale} to ${LOCALE_LABELS[toLocale] ?? toLocale}? Existing content for that locale will be overwritten. AI translations may need editing.`)) return
    setTranslating(toLocale)
    setTranslateMsg(null)
    const res = await aiAutoTranslateEvent({ eventId, fromLocale: defaultLocale, toLocale })
    setTranslating(null)
    const failed = res.results.filter((r) => !r.success)
    setTranslateMsg(
      failed.length === 0
        ? `Translated all ${res.results.length} pages → ${LOCALE_LABELS[toLocale] ?? toLocale}.`
        : `Translated ${res.results.length - failed.length}/${res.results.length} — ${failed.length} failed (${failed.map((f) => f.kind).join(", ")}).`
    )
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
            {active.map((lc, idx) => (
              <li
                key={lc}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 hover:bg-[var(--z-bg-alt,#f7f8fa)]"
              >
                <span className="text-base leading-none">{LOCALE_FLAGS[lc] ?? "🌐"}</span>
                <span className="flex-1 text-[13px] font-medium text-[var(--z-text,#1f2937)] flex items-center gap-1.5">
                  <span className="font-mono uppercase text-[10px] text-[var(--z-text-muted,#6b7280)]">{lc}</span>
                  <span>{LOCALE_LABELS[lc] ?? lc}</span>
                  {(() => {
                    const status = coverage[lc] ?? "empty"
                    const cls = status === "full"
                      ? "bg-emerald-500"
                      : status === "partial"
                        ? "bg-amber-400"
                        : "bg-gray-300"
                    return (
                      <span
                        title={status === "full" ? "All 12 pages translated" : status === "partial" ? "Some pages translated" : "No translations yet"}
                        className={`inline-block w-1.5 h-1.5 rounded-full ${cls}`}
                        aria-label={`Translation status: ${status}`}
                      />
                    )
                  })()}
                </span>
                {/* PART C10 — reorder up/down (default locale stays
                    movable; default is just the visitor-landing locale,
                    not necessarily first in the switcher). */}
                <button
                  type="button"
                  onClick={() => move(lc, -1)}
                  disabled={idx === 0}
                  aria-label={`Move ${lc} up`}
                  className="z-btn z-btn-icon !w-5 !h-5 disabled:opacity-30"
                ><ChevronUp size={11} /></button>
                <button
                  type="button"
                  onClick={() => move(lc, 1)}
                  disabled={idx === active.length - 1}
                  aria-label={`Move ${lc} down`}
                  className="z-btn z-btn-icon !w-5 !h-5 disabled:opacity-30"
                ><ChevronDown size={11} /></button>
                <label className="flex items-center gap-1 text-[11px] text-[var(--z-text-muted,#6b7280)]">
                  <input
                    type="radio"
                    name="default-locale"
                    checked={defaultLocale === lc}
                    onChange={() => persist(active, lc)}
                  />
                  default
                </label>
                {/* PART C10 — visibility toggle. Default locale is
                    always visible — it's how visitors land. */}
                {lc !== defaultLocale && (
                  <button
                    type="button"
                    onClick={() => toggleHidden(lc)}
                    aria-label={hidden.includes(lc) ? "Unhide" : "Hide"}
                    title={hidden.includes(lc) ? "Locale is hidden from the public switcher — click to unhide" : "Hide from the public switcher"}
                    className={`z-btn z-btn-icon !w-6 !h-6 ${hidden.includes(lc) ? "text-[var(--z-text-subtle,#9ca3af)]" : ""}`}
                  >
                    {hidden.includes(lc) ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                )}
                {lc !== defaultLocale && (
                  <button
                    type="button"
                    onClick={() => autoTranslateAll(lc)}
                    aria-label={`Auto-translate to ${lc}`}
                    title={`Auto-translate from ${defaultLocale} → ${lc} (Gemini)`}
                    disabled={translating === lc}
                    className="z-btn z-btn-icon !w-6 !h-6"
                  >
                    {translating === lc
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Sparkles size={11} className="text-[var(--lf-primary,#e7ab1c)]" />}
                  </button>
                )}
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
          {!pending && !translating && translateMsg === null && (
            <p className="mt-2 text-[11px] text-[var(--z-success,#10b981)] flex items-center gap-1.5">
              <Check size={12} /> Saved.
            </p>
          )}
          {translating && (
            <p className="mt-2 text-[11px] text-[var(--z-text-muted,#6b7280)] flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              Translating all 12 pages → {LOCALE_LABELS[translating] ?? translating}…
            </p>
          )}
          {translateMsg && (
            <p className="mt-2 text-[11px] text-[var(--z-info,#3e7af7)]">{translateMsg}</p>
          )}
        </div>
      )}
    </SecondaryPanel>
  )
}
