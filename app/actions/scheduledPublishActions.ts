"use server"

/**
 * Scheduled publish — admin sets a future timestamp; the cron at
 * /api/cron/publish-scheduled fires every 5 minutes and calls
 * publishBuilderAtomic for any rows that are due.
 */

import { createAdminClient } from "@/utils/supabase/admin"
import { requirePermission } from "@/lib/server-permissions"

export async function setScheduledPublish(
  eventId: string,
  isoTimestamp: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const value = isoTimestamp ? new Date(isoTimestamp).toISOString() : null
    if (isoTimestamp && Number.isNaN(new Date(isoTimestamp).getTime())) {
      return { success: false, error: "Invalid date." }
    }
    const { error } = await admin
      .from("events")
      .update({ builder_scheduled_publish_at: value, updated_at: new Date().toISOString() })
      .eq("id", eventId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function getScheduledPublish(
  eventId: string,
): Promise<{ at: string | null }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data } = await admin
      .from("events")
      .select("builder_scheduled_publish_at")
      .eq("id", eventId)
      .maybeSingle()
    return { at: (data?.builder_scheduled_publish_at as string | null) ?? null }
  } catch {
    return { at: null }
  }
}
