"use server"

import { cookies, headers } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { requirePermission } from "@/lib/server-permissions"
import { isValidEmail } from "@/lib/security"
import { rateLimit } from "@/lib/rate-limit"

/**
 * Subscribe a user to the newsletter (public).
 * Honeypotted + rate-limited + strictly validated — this endpoint used
 * to accept unlimited unvalidated inserts.
 */
export async function subscribeToNewsletter(formData: FormData) {
  // Honeypot — bots fill hidden fields. Fake success so they don't retry.
  const honeypot = formData.get("company_website")
  if (honeypot && typeof honeypot === "string" && honeypot.length > 0) {
    return { success: true }
  }

  // Rate limit per IP: 5 per 10 minutes.
  try {
    const hdrs = await headers()
    const ip =
      hdrs.get("x-real-ip") ||
      hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
      "unknown"
    const rl = rateLimit({ key: `newsletter:${ip}`, limit: 5, windowMs: 10 * 60 * 1000 })
    if (!rl.allowed) {
      return { success: false, error: "Too many attempts. Please try again shortly." }
    }
  } catch { /* never block on limiter errors */ }

  const name = (formData.get("name") as string)?.trim().slice(0, 200) || null
  const email = (formData.get("email") as string)?.trim().slice(0, 320)

  if (!email) {
    return { success: false, error: "Email is required." }
  }
  if (!isValidEmail(email)) {
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
 * Guarded: /admin/newsletter is gated by the "attendees" module.
 */
export async function getNewsletterSubscribers() {
  try {
    await requirePermission("attendees", "view")
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
