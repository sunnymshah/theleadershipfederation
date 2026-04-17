"use server"

import { revalidatePath } from "next/cache"
import { cookies, headers } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { Resend } from "resend"
import { rateLimit } from "@/lib/rate-limit"
import { isValidEmail, isValidUUID } from "@/lib/security"

const NOTIFY_EMAIL =
  process.env.CONTACT_NOTIFY_EMAIL || "sunnymshah@gmail.com"
const RESEND_FROM =
  process.env.RESEND_FROM_ADDRESS ||
  "The Leadership Federation <onboarding@resend.dev>"

function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/**
 * Submit a public registration (no auth required).
 *
 * Uses the service-role admin client on purpose: RLS on `registrations`
 * was repeatedly blocking legit submissions after lockdown migrations
 * rewrote anon policies. This endpoint is server-only, rate-limited,
 * honeypotted, and validates everything before writing.
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

  const name = (formData.get("name") as string | null)?.slice(0, 200).trim() ?? ""
  const email = ((formData.get("email") as string | null) ?? "").trim().toLowerCase()
  const phone = (formData.get("phone") as string | null)?.slice(0, 50).trim() ?? ""
  const company = (formData.get("company") as string | null)?.slice(0, 200).trim() || null
  const designation = (formData.get("designation") as string | null)?.slice(0, 200).trim() || null
  const eventIdRaw = ((formData.get("event_id") as string | null) ?? "").trim()
  const eventId = eventIdRaw.length > 0 ? eventIdRaw : null
  const participationType = (formData.get("participation_type") as string | null)?.trim() ?? ""
  const message = (formData.get("message") as string | null)?.slice(0, 5000).trim() || null

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
    // Service-role client — bypasses RLS so legit public submissions
    // always land. The endpoint is guarded by honeypot + rate-limit +
    // strict validation above, so this is safe.
    const admin = createAdminClient()

    const { data: inserted, error } = await admin
      .from("registrations")
      .insert({
        name,
        email,
        phone,
        company,
        designation,
        event_id: eventId,
        participation_type: participationType,
        message,
      })
      .select("id")
      .maybeSingle()

    if (error) {
      console.error("[Registration] Insert failed:", error)
      return {
        success: false,
        error: `Failed to submit registration: ${error.message ?? "database error"}. Please try again.`,
      }
    }

    // Best-effort notification — don't block the user on email failures.
    try {
      await notifyAdminOfRegistration({
        id: (inserted?.id as string) ?? null,
        name,
        email,
        phone,
        company,
        designation,
        participationType,
        eventId,
        message,
      })
    } catch (mailErr) {
      console.error("[Registration] Notify failed:", mailErr)
    }

    revalidatePath("/admin/registrations", "page")
    return { success: true }
  } catch (err) {
    console.error("[Registration] Unexpected error:", err)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}

async function notifyAdminOfRegistration(p: {
  id: string | null
  name: string
  email: string
  phone: string
  company: string | null
  designation: string | null
  participationType: string
  eventId: string | null
  message: string | null
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  let eventTitle: string | null = null
  if (p.eventId) {
    try {
      const admin = createAdminClient()
      const { data } = await admin
        .from("events")
        .select("title")
        .eq("id", p.eventId)
        .maybeSingle()
      eventTitle = (data?.title as string | null) ?? null
    } catch { /* non-fatal */ }
  }

  const roleLabel = p.participationType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())

  const resend = new Resend(apiKey)
  await resend.emails.send({
    from: RESEND_FROM,
    to: [NOTIFY_EMAIL],
    replyTo: p.email,
    subject: `New registration — ${roleLabel} — ${p.name}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a2e">
        <h2 style="margin:0 0 16px;font-size:20px">New ${esc(roleLabel)} registration</h2>
        <table cellpadding="6" style="border-collapse:collapse;font-size:14px">
          <tr><td style="color:#888">Name</td><td>${esc(p.name)}</td></tr>
          <tr><td style="color:#888">Email</td><td><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></td></tr>
          <tr><td style="color:#888">Phone</td><td><a href="tel:${esc(p.phone)}">${esc(p.phone)}</a></td></tr>
          ${p.company ? `<tr><td style="color:#888">Company</td><td>${esc(p.company)}</td></tr>` : ""}
          ${p.designation ? `<tr><td style="color:#888">Designation</td><td>${esc(p.designation)}</td></tr>` : ""}
          ${eventTitle ? `<tr><td style="color:#888">Event</td><td>${esc(eventTitle)}</td></tr>` : ""}
          <tr><td style="color:#888">Role</td><td>${esc(roleLabel)}</td></tr>
        </table>
        ${p.message ? `<h3 style="margin:24px 0 8px;font-size:16px">Message</h3><div style="background:#f7f7f8;padding:16px;border-radius:8px;white-space:pre-wrap;line-height:1.55">${esc(p.message)}</div>` : ""}
        <p style="color:#888;font-size:12px;margin-top:24px">
          Reply directly to ${esc(p.email)} — or open the admin console at
          Registrations to manage this application.
        </p>
      </div>
    `,
  })
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
