"use server"

import { cookies, headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { Resend } from "resend"
import { rateLimit } from "@/lib/rate-limit"

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

/**
 * Fetch the set of valid inquiry types from the DB so the public contact
 * form's dropdown is data-driven. Each row in contact_departments is a
 * valid category (e.g. "Partner With Us"). No hardcoded fallback — if the
 * admin hasn't added any departments yet, the dropdown is empty and the
 * page shows only the "General" fallback.
 */
export async function getContactInquiryTypes(): Promise<string[]> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data } = await supabase
      .from("contact_departments")
      .select("name")
      .order("sort_order", { ascending: true })
    const names = (data ?? []).map((d) => d.name as string).filter(Boolean)
    // Always keep a generic catch-all last so visitors with miscellaneous
    // inquiries can still submit — this is a UX label, not a contact person.
    return [...names, "General"]
  } catch {
    return ["General"]
  }
}

/**
 * Admin action: reply to a contact inquiry via Resend. Pulls the signing
 * org's primary office info from the DB so the inquirer gets real phone /
 * email to reach back on — nothing hardcoded.
 */
export async function replyToContactInquiry(
  inquiryId: string,
  subject: string,
  body: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }

    // Load the inquiry
    const { data: inquiry, error: inqErr } = await supabase
      .from("contact_inquiries")
      .select("*")
      .eq("id", inquiryId)
      .maybeSingle()
    if (inqErr || !inquiry) {
      return { success: false, error: inqErr?.message ?? "Inquiry not found" }
    }

    // Load reply-back contact info (primary office + any key phone contact)
    const [{ data: offices }, { data: persons }] = await Promise.all([
      supabase
        .from("office_locations")
        .select("city, address_lines, phone, email, is_primary")
        .order("is_primary", { ascending: false }),
      supabase
        .from("contact_persons")
        .select("name, role, email, phone")
        .not("phone", "is", null)
        .order("sort_order", { ascending: true })
        .limit(3),
    ])

    const primaryOffice =
      (offices ?? []).find((o) => o.is_primary) ?? (offices ?? [])[0] ?? null
    const phoneContacts = (persons ?? []).filter((p) => p.phone)

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return {
        success: false,
        error:
          "RESEND_API_KEY is not set in Vercel env. Email cannot be sent.",
      }
    }
    const resend = new Resend(apiKey)

    const html = renderReplyHtml({
      inquirerName: inquiry.full_name as string,
      inquirerMessage: inquiry.message as string,
      inquiryType: inquiry.inquiry_type as string,
      bodyText: body,
      replyFromEmail: user.email ?? "",
      office: primaryOffice
        ? {
            city: primaryOffice.city as string,
            address: (primaryOffice.address_lines as string[] | null) ?? [],
            phone: (primaryOffice.phone as string | null) ?? null,
            email: (primaryOffice.email as string | null) ?? null,
          }
        : null,
      phoneContacts: phoneContacts.map((p) => ({
        name: (p.name as string) ?? "",
        role: (p.role as string | null) ?? null,
        phone: (p.phone as string | null) ?? null,
        email: (p.email as string | null) ?? null,
      })),
    })

    const { error: sendErr } = await resend.emails.send({
      from: RESEND_FROM,
      to: [inquiry.email as string],
      replyTo: user.email || CONTACT_NOTIFY_EMAIL,
      subject,
      html,
    })
    if (sendErr) {
      return { success: false, error: sendErr.message || "Send failed" }
    }

    // Auto-mark as contacted so the inbox reflects the outbound action
    await supabase
      .from("contact_inquiries")
      .update({ status: "contacted", updated_at: new Date().toISOString() })
      .eq("id", inquiryId)

    revalidatePath("/admin/contact-inquiries", "page")
    return { success: true }
  } catch (err) {
    console.error("[replyToContactInquiry] failed:", err)
    return { success: false, error: (err as Error).message }
  }
}

function renderReplyHtml(ctx: {
  inquirerName: string
  inquirerMessage: string
  inquiryType: string
  bodyText: string
  replyFromEmail: string
  office: { city: string; address: string[]; phone: string | null; email: string | null } | null
  phoneContacts: Array<{ name: string; role: string | null; phone: string | null; email: string | null }>
}): string {
  const bodyHtml = escapeHtml(ctx.bodyText).replace(/\n/g, "<br>")
  const quotedMsg = escapeHtml(ctx.inquirerMessage).replace(/\n/g, "<br>")

  const contactBlock = (() => {
    const rows: string[] = []
    if (ctx.office) {
      if (ctx.office.phone) {
        rows.push(
          `<tr><td style="padding:2px 0;color:#888;width:90px">Office phone</td><td><a href="tel:${escapeHtml(ctx.office.phone)}" style="color:#1a1a2e">${escapeHtml(ctx.office.phone)}</a></td></tr>`,
        )
      }
      if (ctx.office.email) {
        rows.push(
          `<tr><td style="padding:2px 0;color:#888">Office email</td><td><a href="mailto:${escapeHtml(ctx.office.email)}" style="color:#1a1a2e">${escapeHtml(ctx.office.email)}</a></td></tr>`,
        )
      }
      if (ctx.office.address.length) {
        rows.push(
          `<tr><td style="padding:2px 0;color:#888;vertical-align:top">Address</td><td>${ctx.office.address.map(escapeHtml).join("<br>")}</td></tr>`,
        )
      }
    }
    for (const p of ctx.phoneContacts) {
      const bits = [p.phone ? `<a href="tel:${escapeHtml(p.phone)}" style="color:#1a1a2e">${escapeHtml(p.phone)}</a>` : "", p.email ? `<a href="mailto:${escapeHtml(p.email)}" style="color:#1a1a2e">${escapeHtml(p.email)}</a>` : ""].filter(Boolean).join(" · ")
      rows.push(
        `<tr><td style="padding:2px 0;color:#888">${escapeHtml(p.name)}${p.role ? `<br><span style='color:#aaa;font-size:11px'>${escapeHtml(p.role)}</span>` : ""}</td><td>${bits}</td></tr>`,
      )
    }
    if (rows.length === 0) return ""
    return `
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.08em">Reach us on</p>
      <table cellpadding="0" style="border-collapse:collapse;font-size:13px;color:#1a1a2e">
        ${rows.join("")}
      </table>`
  })()

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#1a1a2e">
      <p style="margin:0 0 16px">Hi ${escapeHtml(ctx.inquirerName.split(" ")[0] || ctx.inquirerName)},</p>
      <div style="font-size:14px;line-height:1.6">${bodyHtml}</div>
      ${contactBlock}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="margin:0;font-size:11px;color:#aaa">Your original message (${escapeHtml(ctx.inquiryType)}):</p>
      <blockquote style="margin:8px 0 0;padding:12px 16px;background:#f7f7f8;border-radius:6px;font-size:12px;color:#666;line-height:1.5">${quotedMsg}</blockquote>
    </div>
  `
}

export async function submitContactInquiry(formData: FormData) {
  // ── Honeypot: if the hidden "company_website" field was filled, this
  // is almost certainly a bot. Return a fake success so the bot moves
  // on without retrying. Never DB-insert, never email.
  const honeypot = formData.get("company_website")
  if (honeypot && typeof honeypot === "string" && honeypot.length > 0) {
    console.warn("[Contact Inquiry] Honeypot triggered — bot detected, silently dropped.")
    return { success: true }
  }

  // ── Rate limit: 5 submissions per IP per 10 minutes.
  // Stops contact-form bots hammering the endpoint + the Resend inbox.
  try {
    const hdrs = await headers()
    const ip =
      hdrs.get("x-real-ip") ||
      hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
      "unknown"
    const rl = rateLimit({ key: `contact:${ip}`, limit: 5, windowMs: 10 * 60 * 1000 })
    if (!rl.allowed) {
      return {
        success: false,
        error: `Too many submissions. Please try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`,
      }
    }
  } catch { /* rate limit errors never block the request */ }

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

  // Length validation (defeats jumbo-payload abuse)
  if (payload.message && payload.message.length > 5000) {
    return { success: false, error: "Message is too long (max 5,000 characters)." }
  }
  if (payload.full_name && payload.full_name.length > 200) {
    return { success: false, error: "Name is too long." }
  }

  // Basic validation
  if (!payload.full_name || !payload.email || !payload.inquiry_type || !payload.message) {
    return { success: false, error: "Please fill in all required fields." }
  }
  // Email format check — stops "name@ " kind of abuse
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return { success: false, error: "Please enter a valid email address." }
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
