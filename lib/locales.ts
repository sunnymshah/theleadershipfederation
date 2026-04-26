/**
 * Multi-language helpers for event microsites.
 *
 * Resolution order on the public side:
 *   1. ?lang= query param
 *   2. /[lang]/events/... URL segment
 *   3. Accept-Language header (best-effort first match)
 *   4. events.default_locale
 *
 * Per-page Puck data is stored at:
 *   event_standard_pages.settings[locale].puckData
 * The legacy single-locale shape lives at .puckData (no locale key) and
 * is treated as the default-locale value during transition.
 */

export const SUPPORTED_LOCALES = [
  "en", "hi", "ta", "te", "kn", "ml", "mr", "gu", "bn", "pa",
  "es", "fr", "de", "it", "pt", "nl", "ar", "ja", "ko", "zh",
  "id", "tr", "ru", "th", "vi", "uk", "pl", "sv",
] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const LOCALE_LABELS: Record<string, string> = {
  en: "English",   hi: "हिन्दी",      ta: "தமிழ்",      te: "తెలుగు",
  kn: "ಕನ್ನಡ",      ml: "മലയാളം",    mr: "मराठी",      gu: "ગુજરાતી",
  bn: "বাংলা",      pa: "ਪੰਜਾਬੀ",     es: "Español",   fr: "Français",
  de: "Deutsch",   it: "Italiano",  pt: "Português", nl: "Nederlands",
  ar: "العربية",   ja: "日本語",      ko: "한국어",      zh: "中文",
  id: "Bahasa",    tr: "Türkçe",    ru: "Русский",   th: "ไทย",
  vi: "Tiếng Việt", uk: "Українська", pl: "Polski",    sv: "Svenska",
}

export const LOCALE_FLAGS: Record<string, string> = {
  en: "🇬🇧", hi: "🇮🇳", ta: "🇮🇳", te: "🇮🇳", kn: "🇮🇳", ml: "🇮🇳",
  mr: "🇮🇳", gu: "🇮🇳", bn: "🇮🇳", pa: "🇮🇳", es: "🇪🇸", fr: "🇫🇷",
  de: "🇩🇪", it: "🇮🇹", pt: "🇵🇹", nl: "🇳🇱", ar: "🇸🇦", ja: "🇯🇵",
  ko: "🇰🇷", zh: "🇨🇳", id: "🇮🇩", tr: "🇹🇷", ru: "🇷🇺", th: "🇹🇭",
  vi: "🇻🇳", uk: "🇺🇦", pl: "🇵🇱", sv: "🇸🇪",
}

export function isSupportedLocale(s: string | null | undefined): s is Locale {
  if (!s) return false
  return (SUPPORTED_LOCALES as readonly string[]).includes(s)
}

/** Pull a Puck data tree out of a page's settings, given a locale.
 *  Falls back to the default locale, then to the legacy un-namespaced
 *  `.puckData`, then to null. */
export function readLocaleData(
  settings: Record<string, unknown> | null | undefined,
  locale: string,
  defaultLocale: string,
): unknown {
  if (!settings || typeof settings !== "object") return null
  const s = settings as Record<string, unknown>
  const fromLocale = (s[locale] as Record<string, unknown> | undefined)?.puckData
  if (fromLocale) return fromLocale
  if (locale !== defaultLocale) {
    const fromDefault = (s[defaultLocale] as Record<string, unknown> | undefined)?.puckData
    if (fromDefault) return fromDefault
  }
  if (s.puckData) return s.puckData
  return null
}

/** Best-match accept-language → supported locale. */
export function pickAcceptedLocale(
  acceptLanguage: string | null,
  available: string[],
): string | null {
  if (!acceptLanguage) return null
  const wants = acceptLanguage
    .split(",")
    .map((p) => p.trim().split(";")[0].trim().toLowerCase())
    .filter(Boolean)
  for (const w of wants) {
    if (available.includes(w)) return w
    const base = w.split("-")[0]
    if (available.includes(base)) return base
  }
  return null
}
