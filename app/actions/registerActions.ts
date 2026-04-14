"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

/**
 * Submit a public registration (no auth required).
 * Inserts into the `registrations` table.
 */
export async function submitRegistration(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const company = (formData.get("company") as string) || null
  const designation = (formData.get("designation") as string) || null
  const linkedinUrl = (formData.get("linkedin_url") as string) || null
  const eventId = (formData.get("event_id") as string) || null
  const participationType = formData.get("participation_type") as string
  const message = (formData.get("message") as string) || null

  // Validation
  if (!name || !email || !phone) {
    return { success: false, error: "Name, email, and phone are required." }
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
