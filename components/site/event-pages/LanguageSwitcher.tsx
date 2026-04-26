"use client"

import { useState } from "react"
import { Globe, ChevronDown, Check } from "lucide-react"
import { LOCALE_LABELS, LOCALE_FLAGS } from "@/lib/locales"

export function LanguageSwitcher({
  eventSlug,
  currentLocale,
  available,
}: {
  eventSlug: string
  currentLocale: string
  available: string[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-2 h-9 rounded-md text-[12px] font-medium text-[#1a1a2e]/70 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.04]"
      >
        <Globe size={14} />
        <span className="text-base leading-none">{LOCALE_FLAGS[currentLocale] ?? "🌐"}</span>
        <span className="uppercase tracking-wider">{currentLocale}</span>
        <ChevronDown size={12} className="opacity-50" />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-10 z-40 min-w-[180px] rounded-md bg-white shadow-lg border border-[#1a1a2e]/10 py-1 max-h-80 overflow-y-auto"
        >
          {available.map((lc) => {
            const isCurrent = lc === currentLocale
            const href = `/${lc}/events/${eventSlug}`
            return (
              <a
                key={lc}
                href={href}
                role="option"
                aria-selected={isCurrent}
                className={`flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-[#1a1a2e]/[0.04] ${
                  isCurrent ? "font-semibold text-[#1a1a2e]" : "text-[#1a1a2e]/75"
                }`}
              >
                <span className="text-base leading-none">{LOCALE_FLAGS[lc] ?? "🌐"}</span>
                <span className="flex-1">{LOCALE_LABELS[lc] ?? lc}</span>
                {isCurrent && <Check size={12} className="text-emerald-600" />}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
