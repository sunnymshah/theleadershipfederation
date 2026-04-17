"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { Resend } from "resend"

/**
 * Server Action: submitContactInquiry
 *
 * Receives form data from the ContactForm client component, inserts it
 * into the Supabase `contact_inquiries` table, and emails a notification
 * to the owner via Resend (best-effort — DB insert is the source of truth;
 * email failure does NOT fail the request).
 *
 * Config (all optional, fall back to sensible defaults):
 *   RESEND_API_KEY         — required for email to actually send
 *   RESEND_FROM_ADDRESS    — "From" line on the notification
 *   CONTACT_NOTIFY_EMAIL   — recipient (owner/admin). Defaults to
 *                            sunnymshah@gmail.com if unset.
 */

const CONTACT_NOTIFY_EMAIL =
  process.env.CONTACT_NOTIFY_EMAIL || "sunnymshah@gmail.com"

const RESEND_FROM =
  process.env.RESEND_FROM_ADDRESS ||
  "The Leadership Federation <onboarding@resend.dev>"

type InquiryPayload = {
  full_name: string
  email: string
  phone: string | null
  company: string | null
  designation: string | null
  inquiry_type: string
  message: string
  source_page: string
}

async function notifyOwnerByEmail(p: InquiryPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn(
      "[Contact Inquiry] RESEND_API_KEY not set — inquiry saved but no " +
      "email notification sent. Set it in Vercel env to enable.",
    )
    return
  }
  const resend = new Resend(apiKey)

  const subject = `New contact inquiry — ${p.inquiry_type} — ${p.full_name}`
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a2e">
      <h2 style="margin:0 0 16px;font-size:20px">New contact inquiry</h2>
      <table cellpadding="6" style="border-collapse:collapse;font-size:14px">
        <tr><td style="color:#888">Name</td><td>${escapeHtml(p.full_name)}</td></tr>
        <tr><td style="color:#888">Email</td><td><a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a></td></tr>
        ${p.phone ? `<tr><td style="color:#888">Phone</td><td><a href="tel:${escapeHtml(p.phone)}">${escapeHtml(p.phone)}</a></td></tr>` : ""}
        ${p.company ? `<tr><td style="color:#888">Company</td><td>${escapeHtml(p.company)}</td></tr>` : ""}
        ${p.designation ? `<tr><td style="color:#888">Designation</td><td>${escapeHtml(p.designation)}</td></tr>` : ""}
        <tr><td style="color:#888">Inquiry type</td><td>${escapeHtml(p.inquiry_type)}</td></tr>
        <tr><td style="color:#888">Source page</td><td>${escapeHtml(p.source_page)}</td></tr>
      </table>
      <h3 style="margin:24px 0 8px;font-size:16px">Message</h3>
      <div style="background:#f7f7f8;padding:16px;border-radius:8px;white-space:pre-wrap;line-height:1.55">${escapeHtml(p.message)}</div>
      <p style="color:#888;font-size:12px;margin-top:24px">
        Reply directly to ${escapeHtml(p.email)} — or open the admin console
        at Contact Inquiries to manage this lead.
      </p>
    </div>
  `

  const { error } = await resend.emails.send({
    from: RESEND_FROM,
    to: [CONTACT_NOTIFY_EMAIL],
    replyTo: p.email, // replying to the notification goes straight to the inquirer
    subject,
    html,
  })
  if (error) {
    console.error("[Contact Inquiry] Resend failed:", error)
  }
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function submitContactInquiry(formData: FormData) {
  const payload: InquiryPayload = {
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

    // Fire-and-forget email notification so the request doesn't wait on
    // SMTP. Any error is logged; the row is already persisted.
    notifyOwnerByEmail(payload).catch((e) =>
      console.error("[Contact Inquiry] notifyOwnerByEmail crashed:", e),
    )

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
