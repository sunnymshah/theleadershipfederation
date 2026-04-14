"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

/**
 * Subscribe a user to the newsletter.
 * Handles duplicate emails gracefully by updating the name if already subscribed,
 * or reactivating if previously unsubscribed.
 */
export async function subscribeToNewsletter(formData: FormData) {
  const name = (formData.get("name") as string)?.trim() || null
  const email = (formData.get("email") as string)?.trim()

  if (!email) {
    return { success: false, error: "Email is required." }
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: "Please enter a valid email address." }
  }

  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Upsert: if email exists, update name and reactivate; otherwise insert
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        {
          email: email.toLowerCase(),
          name,
          is_active: true,
          subscribed_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )

    if (error) {
      console.error("[Newsletter] Supabase error:", error)
      return { success: false, error: "Something went wrong. Please try again." }
    }

    return { success: true }
  } catch (err) {
    console.error("[Newsletter] Unexpected error:", err)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}

/**
 * Fetch all newsletter subscribers (admin use).
 */
export async function getNewsletterSubscribers() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false })

    if (error) {
      console.error("[Newsletter] Fetch error:", error)
      return { success: false, error: "Failed to fetch subscribers.", data: [] }
    }

    return { success: true, data: data ?? [] }
  } catch (err) {
    console.error("[Newsletter] Unexpected error:", err)
    return { success: false, error: "An unexpected error occurred.", data: [] }
  }
}
