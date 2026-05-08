"use server"

import { createAdminClient } from "@/utils/supabase/admin"
import { requirePermission } from "@/lib/server-permissions"
import { isSupportedLocale } from "@/lib/locales"
import { STANDARD_PAGE_KINDS } from "@/lib/standard-pages"

export async function getEventLanguages(
  eventId: string,
): Promise<{ locales: string[]; default_locale: string; locales_hidden: string[] }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data } = await admin
      .from("events")
      .select("locales, default_locale, locales_hidden")
      .eq("id", eventId)
      .maybeSingle()
    return {
      locales: ((data?.locales as string[] | null) ?? ["en"]).filter(Boolean),
      default_locale: (data?.default_locale as string) ?? "en",
      locales_hidden: ((data?.locales_hidden as string[] | null) ?? []).filter(Boolean),
    }
  } catch {
    return { locales: ["en"], default_locale: "en", locales_hidden: [] }
  }
}

export async function setEventLanguages(
  eventId: string,
  locales: string[],
  defaultLocale: string,
  /** PART C10 — locales hidden from the public top-nav switcher. They
   *  remain valid translation targets for content authoring; they're
   *  just not surfaced to anonymous visitors. */
  hidden: string[] = [],
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const cleaned = Array.from(new Set(locales.filter(isSupportedLocale)))
    if (cleaned.length === 0) cleaned.push("en")
    const def = isSupportedLocale(defaultLocale) && cleaned.includes(defaultLocale) ? defaultLocale : cleaned[0]
    // Hidden must be a strict subset of active + must never include the
    // default (the default is always visible — it's how visitors land).
    const hiddenClean = Array.from(new Set(
      hidden.filter(isSupportedLocale).filter((h) => cleaned.includes(h) && h !== def),
    ))
    const admin = createAdminClient()
    const { error } = await admin
      .from("events")
      .update({
        locales: cleaned,
        default_locale: def,
        locales_hidden: hiddenClean,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * For each active locale, count how many of the 12 standard pages have
 * a puckData entry under settings.{locale}.puckData. Returns a coverage
 * map { [locale]: 'full' | 'partial' | 'empty' } the LanguagesPanel
 * uses to render the status dot.
 */
export async function getLocaleCoverage(
  eventId: string,
): Promise<{ success: boolean; coverage: Record<string, "full" | "partial" | "empty"> }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data: rows } = await admin
      .from("event_standard_pages")
      .select("kind, settings")
      .eq("event_id", eventId)
    const list = (rows ?? []) as Array<{ kind: string; settings: Record<string, unknown> }>
    const coverage: Record<string, "full" | "partial" | "empty"> = {}
    if (list.length === 0) return { success: true, coverage }

    // Pull active locales for this event so we know what to score.
    const { data: ev } = await admin
      .from("events")
      .select("locales, default_locale")
      .eq("id", eventId)
      .maybeSingle()
    const locales = ((ev?.locales as string[] | null) ?? ["en"]).filter(Boolean)
    const defaultLocale = (ev?.default_locale as string) ?? "en"

    for (const locale of locales) {
      let withPuck = 0
      for (const row of list) {
        const settings = (row.settings ?? {}) as Record<string, unknown>
        const localeSettings = (settings[locale] as Record<string, unknown> | undefined) ?? {}
        const fallback = settings.puckData
        // For the default locale: legacy un-namespaced .puckData counts.
        const has = locale === defaultLocale
          ? (!!localeSettings.puckData || !!fallback)
          : !!localeSettings.puckData
        if (has) withPuck++
      }
      // Need at least one row to score. STANDARD_PAGE_KINDS is the canonical 12.
      const total = STANDARD_PAGE_KINDS.length
      if (withPuck >= total) coverage[locale] = "full"
      else if (withPuck > 0) coverage[locale] = "partial"
      else coverage[locale] = "empty"
    }
    return { success: true, coverage }
  } catch {
    return { success: false, coverage: {} }
  }
}
