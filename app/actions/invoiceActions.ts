"use server"

/**
 * Invoice Server Actions
 *
 * Generate and email GST-compliant tax invoices for paid attendees.
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { generateInvoicePdf } from "@/lib/generateInvoice"
import { Resend } from "resend"

/* ── Auth helper ─────────────────────────────────────────────────────── */

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

/* ── Resend client ───────────────────────────────────────────────────── */

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[invoiceActions] RESEND_API_KEY is not set.")
    return null
  }
  return new Resend(apiKey)
}

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS ||
  "The Leadership Federation <events@theleadershipfederation.com>"

const FALLBACK_FROM = "The Leadership Federation <onboarding@resend.dev>"

/* ── Generate invoice number ─────────────────────────────────────────── */

/**
 * Generates a sequential invoice number: INV-YYYYMMDD-XXXX
 * Uses a simple approach: count existing invoices for today + 1
 */
async function generateInvoiceNumber(
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  const today = new Date()
  const dateStr =
    today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, "0") +
    today.getDate().toString().padStart(2, "0")

  const prefix = `INV-${dateStr}-`

  // Count existing invoices with today's prefix
  const { count } = await supabase
    .from("attendees")
    .select("id", { count: "exact", head: true })
    .like("invoice_number", `${prefix}%`)

  const seq = ((count ?? 0) + 1).toString().padStart(4, "0")
  return `${prefix}${seq}`
}

/* ── Generate single invoice ─────────────────────────────────────────── */

export async function generateInvoice(attendeeId: string): Promise<{
  success: boolean
  pdfBase64?: string
  invoiceNumber?: string
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: attendee, error: attendeeError } = await supabase
      .from("attendees")
      .select(`
        id, name, email, phone, company, payment_status, payment_amount, invoice_number, invoice_generated_at,
        tickets ( id, name, price_inr ),
        events ( id, title, slug, start_date, end_date, venue )
      `)
      .eq("id", attendeeId)
      .single()

    if (attendeeError || !attendee) {
      return { success: false, error: attendeeError?.message || "Attendee not found." }
    }

    if (attendee.payment_status !== "paid") {
      return { success: false, error: "Invoices can only be generated for paid attendees." }
    }

    const event = attendee.events as unknown as {
      id: string; title: string; slug: string
      start_date: string; end_date: string; venue: string
    } | null

    const ticket = attendee.tickets as unknown as {
      id: string; name: string; price_inr: number
    } | null

    if (!event) {
      return { success: false, error: "Associated event not found." }
    }

    // Generate or reuse invoice number
    let invoiceNumber = attendee.invoice_number as string | null

    if (!invoiceNumber) {
      invoiceNumber = await generateInvoiceNumber(supabase)

      const { error: updateError } = await supabase
        .from("attendees")
        .update({
          invoice_number: invoiceNumber,
          invoice_generated_at: new Date().toISOString(),
        })
        .eq("id", attendeeId)

      if (updateError) {
        return { success: false, error: `Failed to save invoice number: ${updateError.message}` }
      }
    }

    const priceInr = ticket?.price_inr ?? attendee.payment_amount ?? 0

    const pdfBytes = generateInvoicePdf({
      invoiceNumber,
      invoiceDate: (attendee.invoice_generated_at as string) || new Date().toISOString(),
      attendeeName: attendee.name,
      attendeeEmail: attendee.email,
      attendeeCompany: attendee.company,
      attendeePhone: attendee.phone,
      ticketName: ticket?.name ?? "Event Registration",
      eventTitle: event.title,
      priceInr,
      eventDate: event.start_date,
      venue: event.venue || "",
    })

    const pdfBase64 = Buffer.from(pdfBytes).toString("base64")
    return { success: true, pdfBase64, invoiceNumber }
  } catch (err) {
    console.error("[invoiceActions] generateInvoice error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── Email single invoice ────────────────────────────────────────────── */

export async function emailInvoice(attendeeId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // First generate (or re-use) the invoice
    const genResult = await generateInvoice(attendeeId)
    if (!genResult.success || !genResult.pdfBase64) {
      return { success: false, error: genResult.error || "Failed to generate invoice." }
    }

    // Fetch attendee email
    const { data: attendee } = await supabase
      .from("attendees")
      .select(`
        id, name, email, invoice_number,
        events ( title )
      `)
      .eq("id", attendeeId)
      .single()

    if (!attendee?.email) {
      return { success: false, error: "Attendee email not found." }
    }

    const event = attendee.events as unknown as { title: string } | null
    const eventTitle = event?.title ?? "Event"

    const resend = getResendClient()
    if (!resend) {
      return {
        success: false,
        error: "Email service is not configured. Set RESEND_API_KEY environment variable.",
      }
    }

    const pdfBuffer = Buffer.from(genResult.pdfBase64, "base64")
    const safeName = attendee.name.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-")

    const { error: emailError } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [attendee.email],
      subject: `Tax Invoice ${attendee.invoice_number} - ${eventTitle}`,
      html: buildInvoiceEmailHtml(attendee.name, eventTitle, attendee.invoice_number ?? ""),
      attachments: [
        {
          filename: `invoice-${safeName}-${attendee.invoice_number}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    })

    if (emailError) {
      console.warn(`[invoiceActions] Retrying with fallback address. Error: ${emailError.message}`)
      const { error: retryError } = await resend.emails.send({
        from: FALLBACK_FROM,
        to: [attendee.email],
        subject: `Tax Invoice ${attendee.invoice_number} - ${eventTitle}`,
        html: buildInvoiceEmailHtml(attendee.name, eventTitle, attendee.invoice_number ?? ""),
        attachments: [
          {
            filename: `invoice-${safeName}-${attendee.invoice_number}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      })

      if (retryError) {
        return { success: false, error: `Email delivery failed: ${retryError.message}` }
      }
    }

    return { success: true }
  } catch (err) {
    console.error("[invoiceActions] emailInvoice error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── Bulk email invoices ─────────────────────────────────────────────── */

export async function emailBulkInvoices(eventId: string): Promise<{
  success: boolean
  sent: number
  failed: number
  errors: string[]
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: attendees, error } = await supabase
      .from("attendees")
      .select("id, name, email")
      .eq("event_id", eventId)
      .eq("payment_status", "paid")

    if (error) {
      return { success: false, sent: 0, failed: 0, errors: [error.message] }
    }

    if (!attendees || attendees.length === 0) {
      return { success: true, sent: 0, failed: 0, errors: [] }
    }

    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const attendee of attendees) {
      const result = await emailInvoice(attendee.id)
      if (result.success) {
        sent++
      } else {
        failed++
        errors.push(`${attendee.name} (${attendee.email}): ${result.error}`)
      }

      if (attendees.length > 5) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    return { success: failed === 0, sent, failed, errors }
  } catch (err) {
    console.error("[invoiceActions] emailBulkInvoices error:", err)
    return { success: false, sent: 0, failed: 0, errors: [(err as Error).message] }
  }
}

/* ── Get invoice list for an event ───────────────────────────────────── */

export async function getInvoiceList(eventId: string): Promise<{
  success: boolean
  invoices?: Array<{
    id: string
    name: string
    email: string
    company: string | null
    invoice_number: string | null
    invoice_generated_at: string | null
    payment_status: string
    payment_amount: number
  }>
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("attendees")
      .select("id, name, email, company, invoice_number, invoice_generated_at, payment_status, payment_amount")
      .eq("event_id", eventId)
      .eq("payment_status", "paid")
      .order("name")

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, invoices: data ?? [] }
  } catch (err) {
    console.error("[invoiceActions] getInvoiceList error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── Email HTML builder ──────────────────────────────────────────────── */

function buildInvoiceEmailHtml(
  attendeeName: string,
  eventTitle: string,
  invoiceNumber: string
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#1a1a2e;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#252540;border:1px solid rgba(231,171,28,0.3);border-radius:12px;padding:40px;">
      <h1 style="color:#e7ab1c;font-size:22px;margin:0 0 20px;text-align:center;">Tax Invoice</h1>
      <p style="color:#ffffff;font-size:16px;line-height:1.6;margin:0 0 10px;">
        Dear ${attendeeName},
      </p>
      <p style="color:#cccccc;font-size:14px;line-height:1.6;margin:0 0 10px;">
        Please find attached your tax invoice <strong style="color:#ffffff;">${invoiceNumber}</strong>
        for <strong style="color:#ffffff;">${eventTitle}</strong>.
      </p>
      <p style="color:#cccccc;font-size:14px;line-height:1.6;margin:0 0 20px;">
        This is a GST-compliant invoice for your records.
      </p>
      <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;margin-top:20px;text-align:center;">
        <p style="color:#888888;font-size:12px;margin:0;">
          The Leadership Federation<br>
          Leadership Development &amp; Event Management
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}
