"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

function invalidateApprovalCaches() {
  revalidatePath("/admin/approvals", "page")
  revalidatePath("/admin/attendees", "page")
  revalidatePath("/admin", "page")
}

/**
 * Approve a registration: set approval_status='approved', update status to 'registered',
 * and optionally trigger a confirmation email.
 */
export async function approveRegistration(attendeeId: string) {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    const { data: attendee, error: fetchError } = await supabase
      .from("attendees")
      .select("id, approval_status, event_id, name, email")
      .eq("id", attendeeId)
      .single()

    if (fetchError || !attendee) {
      return { success: false, error: fetchError?.message ?? "Attendee not found." }
    }

    if (attendee.approval_status === "approved") {
      return { success: false, error: "Registration is already approved." }
    }

    const { error } = await supabase
      .from("attendees")
      .update({
        approval_status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        status: "registered",
        updated_at: new Date().toISOString(),
      })
      .eq("id", attendeeId)

    if (error) return { success: false, error: error.message }

    // Try to send confirmation email (non-blocking)
    try {
      const { sendConfirmationEmail } = await import("@/app/actions/emailActions")
      await sendConfirmationEmail(attendeeId)
    } catch {
      // Email sending is best-effort; don't fail the approval
    }

    invalidateApprovalCaches()
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Reject a registration with a reason.
 */
export async function rejectRegistration(attendeeId: string, reason: string) {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    const { data: attendee, error: fetchError } = await supabase
      .from("attendees")
      .select("id, approval_status, email, name, event_id")
      .eq("id", attendeeId)
      .single()

    if (fetchError || !attendee) {
      return { success: false, error: fetchError?.message ?? "Attendee not found." }
    }

    if (attendee.approval_status === "rejected") {
      return { success: false, error: "Registration is already rejected." }
    }

    const { error } = await supabase
      .from("attendees")
      .update({
        approval_status: "rejected",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: reason || null,
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", attendeeId)

    if (error) return { success: false, error: error.message }

    invalidateApprovalCaches()
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Bulk approve multiple registrations.
 */
export async function bulkApprove(attendeeIds: string[]) {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    if (!attendeeIds.length) {
      return { success: false, error: "No attendees selected." }
    }

    const { error } = await supabase
      .from("attendees")
      .update({
        approval_status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        status: "registered",
        updated_at: new Date().toISOString(),
      })
      .in("id", attendeeIds)
      .eq("approval_status", "pending")

    if (error) return { success: false, error: error.message }

    // Try to send confirmation emails (non-blocking, best-effort)
    try {
      const { sendConfirmationEmail } = await import("@/app/actions/emailActions")
      for (const id of attendeeIds) {
        await sendConfirmationEmail(id).catch(() => {})
      }
    } catch {
      // Email sending is best-effort
    }

    invalidateApprovalCaches()
    return { success: true, count: attendeeIds.length }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Fetch attendees with pending approval status.
 * Optionally filter by event.
 */
export async function getPendingApprovals(eventId?: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    let query = supabase
      .from("attendees")
      .select("*, events(id, title), tickets(id, name)")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false })

    if (eventId) {
      query = query.eq("event_id", eventId)
    }

    const { data, error } = await query

    if (error) return { success: false, error: error.message, approvals: [] }
    return { success: true, approvals: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message, approvals: [] }
  }
}
