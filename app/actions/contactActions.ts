"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

/**
 * Server Action: submitContactInquiry
 *
 * Receives form data from the ContactForm client component and inserts it
 * into the Supabase `contact_inquiries` table.
 */

export async function submitContactInquiry(formData: FormData) {
  const payload = {
    full_name: formData.get("full_name") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || null,
    company: (formData.get("company") as string) || null,
    designation: (formData.get("designation") as string) || null,
    inquiry_type: formData.get("inquiry_type") as string,
    message: formData.get("message") as string,
    source_page: (formData.get("source_page") as string) || "contact",
  }

  // Basic validation
  if (!payload.full_name || !payload.email || !payload.inquiry_type || !payload.message) {
    return { success: false, error: "Please fill in all required fields." }
  }

  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { error } = await supabase.from("contact_inquiries").insert(payload)
    if (error) throw error

    revalidatePath("/admin/contact-inquiries", "page")
    return { success: true }
  } catch (err) {
    console.error("[Contact Inquiry] Failed:", err)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}

/**
 * Fetch contact inquiries for admin view.
 */
export async function getContactInquiries(filters?: {
  status?: string
  search?: string
}) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    let query = supabase
      .from("contact_inquiries")
      .select("*")
      .order("created_at", { ascending: false })

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    const { data, error } = await query

    if (error) {
      console.error("[Contact Inquiries] Fetch failed:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message, data: [] }
  }
}

/**
 * Update the status of a contact inquiry (new → contacted → resolved).
 */
export async function updateInquiryStatus(
  id: string,
  status: "new" | "contacted" | "resolved"
) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase
      .from("contact_inquiries")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/contact-inquiries", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
