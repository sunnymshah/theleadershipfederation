"use server"

import { revalidatePath } from "next/cache"
import { cookies, headers } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { rateLimit } from "@/lib/rate-limit"
import { isValidEmail, isValidUUID } from "@/lib/security"

/**
 * Submit a public registration (no auth required).
 * Inserts into the `registrations` table.
 */
export async function submitRegistration(formData: FormData) {
  // Honeypot — bots fill hidden fields. Silently accept so they don't retry.
  const honeypot = formData.get("company_website")
  if (honeypot && typeof honeypot === "string" && honeypot.length > 0) {
    return { success: true }
  }

  // Rate limit per IP: 5 per 10 minutes. Stops automated flood submits.
  try {
    const hdrs = await headers()
    const ip =
      hdrs.get("x-real-ip") ||
      hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
      "unknown"
    const rl = rateLimit({ key: `register:${ip}`, limit: 5, windowMs: 10 * 60 * 1000 })
    if (!rl.allowed) {
      return {
        success: false,
        error: `Too many submissions. Please try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`,
      }
    }
  } catch { /* never block on rate limiter errors */ }

  const name = (formData.get("name") as string | null)?.slice(0, 200) ?? ""
  const email = ((formData.get("email") as string | null) ?? "").trim().toLowerCase()
  const phone = (formData.get("phone") as string | null)?.slice(0, 50) ?? ""
  const company = (formData.get("company") as string | null)?.slice(0, 200) || null
  const designation = (formData.get("designation") as string | null)?.slice(0, 200) || null
  const linkedinUrlRaw = ((formData.get("linkedin_url") as string | null) ?? "").trim()
  const eventId = (formData.get("event_id") as string | null) || null
  const participationType = formData.get("participation_type") as string
  const message = (formData.get("message") as string | null)?.slice(0, 5000) || null

  // Validation
  if (!name || !email || !phone) {
    return { success: false, error: "Name, email, and phone are required." }
  }
  if (!isValidEmail(email)) {
    return { success: false, error: "Please enter a valid email address." }
  }
  if (eventId && !isValidUUID(eventId)) {
    return { success: false, error: "Invalid event." }
  }
  // Allow empty LinkedIn URL, but if supplied it must look like LinkedIn.
  let linkedinUrl: string | null = null
  if (linkedinUrlRaw) {
    if (!/^https:\/\/([a-z]{2,3}\.)?linkedin\.com\//i.test(linkedinUrlRaw)) {
      return { success: false, error: "LinkedIn URL must start with https://linkedin.com/." }
    }
    linkedinUrl = linkedinUrlRaw.slice(0, 500)
  }

  const validTypes = [
    "award_nomination",
    "delegate",
    "sponsor",
    "speaker",
    "jury",
    "membership",
  ]
  if (!participationType || !validTypes.includes(participationType)) {
    return { success: false, error: "Please select a valid participation type." }
  }

  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.from("registrations").insert({
      name,
      email,
      phone,
      company,
      designation,
      linkedin_url: linkedinUrl,
      event_id: eventId || null,
      participation_type: participationType,
      message,
    })

    if (error) {
      console.error("[Registration] Insert failed:", error)
      return { success: false, error: "Failed to submit registration. Please try again." }
    }

    revalidatePath("/admin/registrations", "page")
    return { success: true }
  } catch (err) {
    console.error("[Registration] Unexpected error:", err)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}

import { getCurrentUserContext } from "@/lib/server-permissions"

/**
 * Fetch registrations with optional filters (admin, auth required).
 */
export async function getRegistrations(filters?: {
  participation_type?: string
  status?: string
  event_id?: string
  limit?: number
  offset?: number
}) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    let query = supabase
      .from("registrations")
      .select("*, events(title, slug)", { count: "exact" })
      .order("created_at", { ascending: false })

    if (filters?.participation_type) {
      query = query.eq("participation_type", filters.participation_type)
    }
    if (filters?.status) {
      query = query.eq("status", filters.status)
    }
    if (filters?.event_id) {
      query = query.eq("event_id", filters.event_id)
    }

    const limit = filters?.limit ?? 50
    const offset = filters?.offset ?? 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return { success: false, error: error.message, data: null, count: 0 }
    }

    return { success: true, data, count: count ?? 0 }
  } catch (err) {
    return { success: false, error: (err as Error).message, data: null, count: 0 }
  }
}

/**
 * Update registration status (admin, auth required).
 */
export async function updateRegistrationStatus(
  id: string,
  status: "pending" | "reviewed" | "accepted" | "rejected"
) {
  try {
    // Must be an authenticated team member (or super_admin). Before this
    // gate the endpoint accepted any request and relied on RLS — which
    // is fine until someone loosens an `UPDATE` policy, at which point
    // anonymous status changes become possible.
    await getCurrentUserContext()
    if (!isValidUUID(id)) {
      return { success: false, error: "Invalid registration id." }
    }
    const allowed = new Set(["pending", "reviewed", "accepted", "rejected"])
    if (!allowed.has(status)) {
      return { success: false, error: "Invalid status." }
    }
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase
      .from("registrations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/registrations", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
