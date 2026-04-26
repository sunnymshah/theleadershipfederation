"use server"

import { createAdminClient } from "@/utils/supabase/admin"
import { requirePermission } from "@/lib/server-permissions"
import { isSupportedLocale } from "@/lib/locales"

export async function getEventLanguages(
  eventId: string,
): Promise<{ locales: string[]; default_locale: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data } = await admin
      .from("events")
      .select("locales, default_locale")
      .eq("id", eventId)
      .maybeSingle()
    return {
      locales: ((data?.locales as string[] | null) ?? ["en"]).filter(Boolean),
      default_locale: (data?.default_locale as string) ?? "en",
    }
  } catch {
    return { locales: ["en"], default_locale: "en" }
  }
}

export async function setEventLanguages(
  eventId: string,
  locales: string[],
  defaultLocale: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const cleaned = Array.from(new Set(locales.filter(isSupportedLocale)))
    if (cleaned.length === 0) cleaned.push("en")
    const def = isSupportedLocale(defaultLocale) && cleaned.includes(defaultLocale) ? defaultLocale : cleaned[0]
    const admin = createAdminClient()
    const { error } = await admin
      .from("events")
      .update({ locales: cleaned, default_locale: def, updated_at: new Date().toISOString() })
      .eq("id", eventId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
