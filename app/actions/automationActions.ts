"use server"

/**
 * ─── EMAIL AUTOMATION SERVER ACTIONS ──────────────────────────────────
 *
 * Drip sequence / automation system for event-driven email workflows.
 * Supports trigger types: registration, payment_confirmed, check_in,
 * days_before_event, days_after_event, session_reminder,
 * waitlist_promoted, approval_approved, approval_rejected.
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

/* ── Auth helper ─────────────────────────────────────────────────────── */

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

/* ── Constants ───────────────────────────────────────────────────────── */

const FROM_ADDRESS =
  process.env.EMAIL_FROM || "noreply@theleadershipfederation.com"

/* ── Types ───────────────────────────────────────────────────────────── */

export interface Automation {
  id: string
  event_id: string
  name: string
  trigger_type: string
  trigger_config: Record<string, unknown>
  template_id: string | null
  subject: string
  body_html: string
  delay_minutes: number
  is_active: boolean
  sent_count: number
  last_triggered_at: string | null
  created_at: string
  updated_at: string
}

export interface AutomationLog {
  id: string
  automation_id: string
  attendee_id: string
  status: "sent" | "failed" | "skipped"
  error_message: string | null
  sent_at: string
  attendees?: { name: string; email: string } | null
}

/* ── createAutomation ────────────────────────────────────────────────── */

export async function createAutomation(formData: FormData): Promise<{
  success: boolean
  automation?: Automation
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const event_id = formData.get("event_id") as string
    const name = formData.get("name") as string
    const trigger_type = formData.get("trigger_type") as string
    const trigger_config_raw = formData.get("trigger_config") as string
    const template_id = (formData.get("template_id") as string) || null
    const subject = formData.get("subject") as string
    const body_html = formData.get("body_html") as string
    const delay_minutes = parseInt(formData.get("delay_minutes") as string, 10) || 0
    const is_active = formData.get("is_active") === "true"

    if (!event_id || !name || !trigger_type || !subject || !body_html) {
      return { success: false, error: "Missing required fields: event_id, name, trigger_type, subject, body_html." }
    }

    let trigger_config: Record<string, unknown> = {}
    if (trigger_config_raw) {
      try {
        trigger_config = JSON.parse(trigger_config_raw)
      } catch {
        return { success: false, error: "trigger_config must be valid JSON." }
      }
    }

    const { data, error } = await supabase
      .from("email_automations")
      .insert({
        event_id,
        name,
        trigger_type,
        trigger_config,
        template_id,
        subject,
        body_html,
        delay_minutes,
        is_active,
      })
      .select("*")
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/campaigns", "page")
    return { success: true, automation: data as Automation }
  } catch (err) {
    console.error("[automationActions] createAutomation error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── updateAutomation ────────────────────────────────────────────────── */

export async function updateAutomation(
  automationId: string,
  formData: FormData
): Promise<{
  success: boolean
  automation?: Automation
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    const name = formData.get("name") as string | null
    const trigger_type = formData.get("trigger_type") as string | null
    const trigger_config_raw = formData.get("trigger_config") as string | null
    const template_id = formData.get("template_id") as string | null
    const subject = formData.get("subject") as string | null
    const body_html = formData.get("body_html") as string | null
    const delay_minutes_raw = formData.get("delay_minutes") as string | null
    const is_active_raw = formData.get("is_active") as string | null

    if (name !== null) updateObj.name = name
    if (trigger_type !== null) updateObj.trigger_type = trigger_type
    if (trigger_config_raw !== null) {
      try {
        updateObj.trigger_config = JSON.parse(trigger_config_raw)
      } catch {
        return { success: false, error: "trigger_config must be valid JSON." }
      }
    }
    if (formData.has("template_id")) updateObj.template_id = template_id || null
    if (subject !== null) updateObj.subject = subject
    if (body_html !== null) updateObj.body_html = body_html
    if (delay_minutes_raw !== null) updateObj.delay_minutes = parseInt(delay_minutes_raw, 10) || 0
    if (is_active_raw !== null) updateObj.is_active = is_active_raw === "true"

    const { data, error } = await supabase
      .from("email_automations")
      .update(updateObj)
      .eq("id", automationId)
      .select("*")
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/campaigns", "page")
    return { success: true, automation: data as Automation }
  } catch (err) {
    console.error("[automationActions] updateAutomation error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── deleteAutomation ────────────────────────────────────────────────── */

export async function deleteAutomation(automationId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { error } = await supabase
      .from("email_automations")
      .delete()
      .eq("id", automationId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/campaigns", "page")
    return { success: true }
  } catch (err) {
    console.error("[automationActions] deleteAutomation error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── toggleAutomation ────────────────────────────────────────────────── */

export async function toggleAutomation(
  automationId: string,
  isActive: boolean
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { error } = await supabase
      .from("email_automations")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", automationId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/campaigns", "page")
    return { success: true }
  } catch (err) {
    console.error("[automationActions] toggleAutomation error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── getEventAutomations ─────────────────────────────────────────────── */

export async function getEventAutomations(eventId: string): Promise<{
  success: boolean
  automations?: Automation[]
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("email_automations")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, automations: (data ?? []) as Automation[] }
  } catch (err) {
    console.error("[automationActions] getEventAutomations error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── triggerAutomation ───────────────────────────────────────────────── */

export async function triggerAutomation(
  automationId: string,
  attendeeIds: string[]
): Promise<{
  success: boolean
  sentCount: number
  skippedCount: number
  failedCount: number
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch automation details
    const { data: automation, error: autoError } = await supabase
      .from("email_automations")
      .select("*")
      .eq("id", automationId)
      .single()

    if (autoError || !automation) {
      return {
        success: false, sentCount: 0, skippedCount: 0, failedCount: 0,
        error: autoError?.message || "Automation not found.",
      }
    }

    // Lazy-import Resend (same pattern as emailActions.ts)
    const { Resend } = await import("resend")
    const resend = new Resend(process.env.RESEND_API_KEY)

    let sentCount = 0
    let skippedCount = 0
    let failedCount = 0

    for (const attendeeId of attendeeIds) {
      // Check if already sent (unique constraint on automation_id + attendee_id)
      const { data: existingLog } = await supabase
        .from("email_automation_logs")
        .select("id")
        .eq("automation_id", automationId)
        .eq("attendee_id", attendeeId)
        .maybeSingle()

      if (existingLog) {
        skippedCount++
        continue
      }

      // Get attendee email
      const { data: attendee, error: attError } = await supabase
        .from("attendees")
        .select("id, name, email")
        .eq("id", attendeeId)
        .single()

      if (attError || !attendee || !attendee.email) {
        failedCount++
        // Log the failure
        await supabase.from("email_automation_logs").insert({
          automation_id: automationId,
          attendee_id: attendeeId,
          status: "failed",
          error_message: attError?.message || "Attendee not found or missing email.",
          sent_at: new Date().toISOString(),
        })
        continue
      }

      // Replace template variables in subject and body
      const vars: Record<string, string> = {
        attendee_name: attendee.name || "",
        attendee_email: attendee.email,
      }

      let html = automation.body_html as string
      let subject = automation.subject as string
      for (const [key, value] of Object.entries(vars)) {
        const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g")
        html = html.replace(pattern, value)
        subject = subject.replace(pattern, value)
      }

      // Send email via Resend
      try {
        const { error: emailError } = await resend.emails.send({
          from: FROM_ADDRESS,
          to: [attendee.email],
          subject,
          html,
        })

        if (emailError) {
          failedCount++
          await supabase.from("email_automation_logs").insert({
            automation_id: automationId,
            attendee_id: attendeeId,
            status: "failed",
            error_message: emailError.message,
            sent_at: new Date().toISOString(),
          })
        } else {
          sentCount++
          await supabase.from("email_automation_logs").insert({
            automation_id: automationId,
            attendee_id: attendeeId,
            status: "sent",
            error_message: null,
            sent_at: new Date().toISOString(),
          })
        }
      } catch (sendErr) {
        failedCount++
        await supabase.from("email_automation_logs").insert({
          automation_id: automationId,
          attendee_id: attendeeId,
          status: "failed",
          error_message: (sendErr as Error).message,
          sent_at: new Date().toISOString(),
        })
      }

      // Rate limit courtesy
      if (attendeeIds.length > 5) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    // Update automation sent_count and last_triggered_at
    await supabase
      .from("email_automations")
      .update({
        sent_count: (automation.sent_count || 0) + sentCount,
        last_triggered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", automationId)

    revalidatePath("/admin/campaigns", "page")
    return { success: true, sentCount, skippedCount, failedCount }
  } catch (err) {
    console.error("[automationActions] triggerAutomation error:", err)
    return {
      success: false, sentCount: 0, skippedCount: 0, failedCount: 0,
      error: (err as Error).message,
    }
  }
}

/* ── processScheduledAutomations ─────────────────────────────────────── */

export async function processScheduledAutomations(eventId: string): Promise<{
  success: boolean
  processed: number
  totalSent: number
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch event start_date
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, start_date")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return { success: false, processed: 0, totalSent: 0, error: eventError?.message || "Event not found." }
    }

    const eventDate = new Date(event.start_date)
    const now = new Date()

    // Fetch active automations with schedule-based triggers
    const { data: automations, error: autoError } = await supabase
      .from("email_automations")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_active", true)
      .in("trigger_type", ["days_before_event", "days_after_event"])

    if (autoError) {
      return { success: false, processed: 0, totalSent: 0, error: autoError.message }
    }

    if (!automations || automations.length === 0) {
      return { success: true, processed: 0, totalSent: 0 }
    }

    let processed = 0
    let totalSent = 0

    for (const automation of automations) {
      const config = automation.trigger_config as Record<string, unknown>
      const days = typeof config.days === "number" ? config.days : parseInt(String(config.days || "0"), 10)

      // Determine if the trigger condition is met
      let shouldTrigger = false

      if (automation.trigger_type === "days_before_event") {
        // Trigger when we are exactly `days` days before the event (or fewer)
        const triggerDate = new Date(eventDate)
        triggerDate.setDate(triggerDate.getDate() - days)
        shouldTrigger = now >= triggerDate && now < eventDate
      } else if (automation.trigger_type === "days_after_event") {
        // Trigger when we are exactly `days` days after the event (or more, up to days+1)
        const triggerDate = new Date(eventDate)
        triggerDate.setDate(triggerDate.getDate() + days)
        const triggerEndDate = new Date(triggerDate)
        triggerEndDate.setDate(triggerEndDate.getDate() + 1)
        shouldTrigger = now >= triggerDate && now < triggerEndDate
      }

      if (!shouldTrigger) continue

      // Get all attendees for the event who haven't been sent this automation
      const { data: attendees, error: attError } = await supabase
        .from("attendees")
        .select("id")
        .eq("event_id", eventId)
        .not("email", "is", null)
        .in("status", ["registered", "confirmed", "checked_in"])

      if (attError || !attendees || attendees.length === 0) continue

      // Filter out attendees who already have a log entry
      const { data: existingLogs } = await supabase
        .from("email_automation_logs")
        .select("attendee_id")
        .eq("automation_id", automation.id)

      const sentAttendeeIds = new Set((existingLogs ?? []).map((l: { attendee_id: string }) => l.attendee_id))
      const eligibleIds = attendees
        .map((a: { id: string }) => a.id)
        .filter((id: string) => !sentAttendeeIds.has(id))

      if (eligibleIds.length === 0) continue

      const result = await triggerAutomation(automation.id, eligibleIds)
      if (result.success) {
        processed++
        totalSent += result.sentCount
      }
    }

    return { success: true, processed, totalSent }
  } catch (err) {
    console.error("[automationActions] processScheduledAutomations error:", err)
    return { success: false, processed: 0, totalSent: 0, error: (err as Error).message }
  }
}

/* ── getAutomationLogs ───────────────────────────────────────────────── */

export async function getAutomationLogs(automationId: string): Promise<{
  success: boolean
  logs?: AutomationLog[]
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("email_automation_logs")
      .select("*, attendees(name, email)")
      .eq("automation_id", automationId)
      .order("sent_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, logs: (data ?? []) as AutomationLog[] }
  } catch (err) {
    console.error("[automationActions] getAutomationLogs error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── getAutomationStats ──────────────────────────────────────────────── */

export async function getAutomationStats(eventId: string): Promise<{
  success: boolean
  stats?: {
    totalAutomations: number
    totalSent: number
    totalFailed: number
    byTriggerType: Record<string, { count: number; sent: number; failed: number }>
  }
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch all automations for this event
    const { data: automations, error: autoError } = await supabase
      .from("email_automations")
      .select("id, trigger_type, sent_count")
      .eq("event_id", eventId)

    if (autoError) {
      return { success: false, error: autoError.message }
    }

    const autos = automations ?? []

    if (autos.length === 0) {
      return {
        success: true,
        stats: {
          totalAutomations: 0,
          totalSent: 0,
          totalFailed: 0,
          byTriggerType: {},
        },
      }
    }

    // Fetch all logs for these automations
    const automationIds = autos.map((a: { id: string }) => a.id)
    const { data: logs, error: logsError } = await supabase
      .from("email_automation_logs")
      .select("automation_id, status")
      .in("automation_id", automationIds)

    if (logsError) {
      return { success: false, error: logsError.message }
    }

    const allLogs = logs ?? []

    // Build stats
    let totalSent = 0
    let totalFailed = 0
    const byTriggerType: Record<string, { count: number; sent: number; failed: number }> = {}

    for (const auto of autos) {
      const triggerType = auto.trigger_type as string
      if (!byTriggerType[triggerType]) {
        byTriggerType[triggerType] = { count: 0, sent: 0, failed: 0 }
      }
      byTriggerType[triggerType].count++
    }

    for (const log of allLogs) {
      const auto = autos.find((a: { id: string }) => a.id === log.automation_id)
      const triggerType = auto?.trigger_type as string
      if (!triggerType || !byTriggerType[triggerType]) continue

      if (log.status === "sent") {
        totalSent++
        byTriggerType[triggerType].sent++
      } else if (log.status === "failed") {
        totalFailed++
        byTriggerType[triggerType].failed++
      }
    }

    return {
      success: true,
      stats: {
        totalAutomations: autos.length,
        totalSent,
        totalFailed,
        byTriggerType,
      },
    }
  } catch (err) {
    console.error("[automationActions] getAutomationStats error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── previewAutomation ───────────────────────────────────────────────── */

export async function previewAutomation(automationId: string): Promise<{
  success: boolean
  automation?: Automation
  eligibleCount?: number
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch automation
    const { data: automation, error: autoError } = await supabase
      .from("email_automations")
      .select("*")
      .eq("id", automationId)
      .single()

    if (autoError || !automation) {
      return { success: false, error: autoError?.message || "Automation not found." }
    }

    // Count eligible attendees (those who haven't already received this automation)
    const { data: attendees, error: attError } = await supabase
      .from("attendees")
      .select("id")
      .eq("event_id", automation.event_id)
      .not("email", "is", null)
      .in("status", ["registered", "confirmed", "checked_in"])

    if (attError) {
      return { success: false, error: attError.message }
    }

    const allAttendeeIds = (attendees ?? []).map((a: { id: string }) => a.id)

    // Get already-sent attendee IDs
    const { data: existingLogs } = await supabase
      .from("email_automation_logs")
      .select("attendee_id")
      .eq("automation_id", automationId)

    const sentIds = new Set((existingLogs ?? []).map((l: { attendee_id: string }) => l.attendee_id))
    const eligibleCount = allAttendeeIds.filter((id: string) => !sentIds.has(id)).length

    return {
      success: true,
      automation: automation as Automation,
      eligibleCount,
    }
  } catch (err) {
    console.error("[automationActions] previewAutomation error:", err)
    return { success: false, error: (err as Error).message }
  }
}
