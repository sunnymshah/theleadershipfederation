/**
 * Public-string i18n (ITEM 4.2).
 *
 * Every overridable string on the public event pages has a stable
 * dot-path key. Server components resolve via getString(key, locale,
 * event.text_overrides) and fall back to DEFAULT_STRINGS when an
 * override isn't set. The Customize Text panel writes back into
 * events.text_overrides[locale][key].
 *
 * Keys are grouped by namespace (nav / hero / cookie / footer /
 * agenda / register) so the admin UI can render them in collapsible
 * sections. To add a new key: register it here, render it in the
 * matching component via getString(), and the admin Settings → Text
 * panel picks it up automatically.
 */

export type StringKey =
  // Top-nav rail
  | "nav.register"
  | "nav.signin"
  | "nav.menu"
  | "nav.languageSwitcher"
  // Hero defaults
  | "hero.cta.default"
  | "hero.cta.secondary"
  // Cookie banner
  | "cookie.message"
  | "cookie.accept"
  | "cookie.manage"
  // Footer
  | "footer.copyright"
  | "footer.poweredBy"
  // Agenda
  | "agenda.day_label"
  | "agenda.empty"
  | "agenda.allTracks"
  // Speakers
  | "speakers.empty"
  // Tickets
  | "tickets.sold_out"
  | "tickets.early_bird"
  | "tickets.book_now"
  | "tickets.from"
  // Sponsors
  | "sponsors.empty"
  // Register form
  | "register.success"
  | "register.error"
  | "register.submitting"
  // Generic
  | "common.loading"
  | "common.error"
  | "common.viewAll"
  | "common.learnMore"
  | "common.close"
  // Notification banner
  | "notification.dismiss"
  // PART D5 — strings backfilled into the i18n table during close-out.
  | "venue.directions"
  | "venue.share"
  | "venue.addToCalendar"
  | "common.readMore"

export const DEFAULT_STRINGS: Record<StringKey, string> = {
  "nav.register":          "Register Now",
  "nav.signin":            "Sign In",
  "nav.menu":              "Menu",
  "nav.languageSwitcher":  "Language",
  "hero.cta.default":      "Register Now",
  "hero.cta.secondary":    "Learn More",
  "cookie.message":        "We use cookies to improve your experience.",
  "cookie.accept":         "Accept",
  "cookie.manage":         "Manage",
  "footer.copyright":      "© {year} The Leadership Federation. All rights reserved.",
  "footer.poweredBy":      "Powered by The Leadership Federation",
  "agenda.day_label":      "Day {n}",
  "agenda.empty":          "Agenda coming soon.",
  "agenda.allTracks":      "All tracks",
  "speakers.empty":        "Speakers coming soon.",
  "tickets.sold_out":      "Sold out",
  "tickets.early_bird":    "Early bird",
  "tickets.book_now":      "Book now",
  "tickets.from":          "From",
  "sponsors.empty":        "Sponsors coming soon.",
  "register.success":      "Thanks — we got your registration.",
  "register.error":        "Something went wrong. Please try again.",
  "register.submitting":   "Submitting…",
  "common.loading":        "Loading…",
  "common.error":          "Something went wrong.",
  "common.viewAll":        "View all",
  "common.learnMore":      "Learn more",
  "common.close":          "Close",
  "notification.dismiss":  "Dismiss",
  // PART D5 — backfill defaults.
  "venue.directions":      "Get directions",
  "venue.share":           "Share",
  "venue.addToCalendar":   "Add to calendar",
  "common.readMore":       "Read more",
}

/** Group key → human label, used by the admin Customize Text panel. */
export const STRING_NAMESPACES: Array<{ ns: string; label: string }> = [
  { ns: "nav",          label: "Navigation" },
  { ns: "venue",        label: "Venue" },
  { ns: "hero",         label: "Hero defaults" },
  { ns: "cookie",       label: "Cookie banner" },
  { ns: "footer",       label: "Footer" },
  { ns: "agenda",       label: "Agenda" },
  { ns: "speakers",     label: "Speakers" },
  { ns: "tickets",      label: "Tickets" },
  { ns: "sponsors",     label: "Sponsors" },
  { ns: "register",     label: "Registration form" },
  { ns: "common",       label: "Common" },
  { ns: "notification", label: "Notification banner" },
]

export type TextOverrides = Record<string, Record<string, string>>

/**
 * Resolve a string for a given locale, applying any override stored on
 * the event row. Interpolates {placeholder} tokens from `vars`. Falls
 * back to DEFAULT_STRINGS when no override exists for the locale.
 */
export function getString(
  key: StringKey,
  locale: string | undefined | null,
  overrides: TextOverrides | undefined | null,
  vars?: Record<string, string | number>,
): string {
  const fallback = DEFAULT_STRINGS[key]
  let raw: string = fallback
  if (overrides && locale) {
    const localeMap = overrides[locale]
    if (localeMap && typeof localeMap[key] === "string" && localeMap[key].trim().length > 0) {
      raw = localeMap[key]
    }
  } else if (overrides) {
    // No locale supplied — try a default-en bucket if present.
    const en = overrides["en"]
    if (en && typeof en[key] === "string" && en[key].trim().length > 0) {
      raw = en[key]
    }
  }
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (_, name) => {
    const v = vars[name]
    return v === undefined || v === null ? "" : String(v)
  })
}
