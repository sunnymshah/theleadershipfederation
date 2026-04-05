"use server"

/**
 * Certificate Server Actions
 *
 * Generate and email participation certificates for checked-in attendees.
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { generateCertificatePdf } from "@/lib/generateCertificate"
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
    console.warn("[certificateActions] RESEND_API_KEY is not set.")
    return null
  }
  return new Resend(apiKey)
}

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS ||
  "The Leadership Federation <events@theleadershipfederation.com>"

const FALLBACK_FROM = "The Leadership Federation <onboarding@resend.dev>"

/* ── Generate single certificate ─────────────────────────────────────── */

export async function generateCertificate(attendeeId: string): Promise<{
  success: boolean
  pdfBase64?: string
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: attendee, error: attendeeError } = await supabase
      .from("attendees")
      .select(`
        id, name, email, status,
        events ( id, title, slug, start_date, end_date, venue )
      `)
      .eq("id", attendeeId)
      .single()

    if (attendeeError || !attendee) {
      return { success: false, error: attendeeError?.message || "Attendee not found." }
    }

    if (attendee.status !== "checked_in") {
      return { success: false, error: "Only checked-in attendees can receive certificates." }
    }

    const event = attendee.events as unknown as {
      id: string; title: string; slug: string
      start_date: string; end_date: string; venue: string
    } | null

    if (!event) {
      return { success: false, error: "Associated event not found." }
    }

    const pdfBytes = generateCertificatePdf({
      attendeeName: attendee.name,
      eventTitle: event.title,
      eventDate: event.start_date,
      eventEndDate: event.end_date || undefined,
      venue: event.venue || "",
      eventSlug: event.slug,
      attendeeIdShort: attendee.id.slice(0, 8),
    })

    const pdfBase64 = Buffer.from(pdfBytes).toString("base64")
    return { success: true, pdfBase64 }
  } catch (err) {
    console.error("[certificateActions] generateCertificate error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── Generate bulk certificates ──────────────────────────────────────── */

export async function generateBulkCertificates(eventId: string): Promise<{
  success: boolean
  certificates?: Array<{
    attendeeId: string
    name: string
    email: string
    pdfBase64: string
  }>
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: attendees, error } = await supabase
      .from("attendees")
      .select(`
        id, name, email, status,
        events ( id, title, slug, start_date, end_date, venue )
      `)
      .eq("event_id", eventId)
      .eq("status", "checked_in")
      .order("name")

    if (error) {
      return { success: false, error: error.message }
    }

    if (!attendees || attendees.length === 0) {
      return { success: true, certificates: [] }
    }

    const certificates = attendees.map((attendee) => {
      const event = attendee.events as unknown as {
        id: string; title: string; slug: string
        start_date: string; end_date: string; venue: string
      }

      const pdfBytes = generateCertificatePdf({
        attendeeName: attendee.name,
        eventTitle: event.title,
        eventDate: event.start_date,
        eventEndDate: event.end_date || undefined,
        venue: event.venue || "",
        eventSlug: event.slug,
        attendeeIdShort: attendee.id.slice(0, 8),
      })

      return {
        attendeeId: attendee.id,
        name: attendee.name,
        email: attendee.email,
        pdfBase64: Buffer.from(pdfBytes).toString("base64"),
      }
    })

    return { success: true, certificates }
  } catch (err) {
    console.error("[certificateActions] generateBulkCertificates error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── Email single certificate ────────────────────────────────────────── */

export async function emailCertificate(attendeeId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: attendee, error: attendeeError } = await supabase
      .from("attendees")
      .select(`
        id, name, email, status,
        events ( id, title, slug, start_date, end_date, venue )
      `)
      .eq("id", attendeeId)
      .single()

    if (attendeeError || !attendee) {
      return { success: false, error: attendeeError?.message || "Attendee not found." }
    }

    if (attendee.status !== "checked_in") {
      return { success: false, error: "Only checked-in attendees can receive certificates." }
    }

    if (!attendee.email) {
      return { success: false, error: "Attendee does not have an email address." }
    }

    const event = attendee.events as unknown as {
      id: string; title: string; slug: string
      start_date: string; end_date: string; venue: string
    } | null

    if (!event) {
      return { success: false, error: "Associated event not found." }
    }

    const pdfBytes = generateCertificatePdf({
      attendeeName: attendee.name,
      eventTitle: event.title,
      eventDate: event.start_date,
      eventEndDate: event.end_date || undefined,
      venue: event.venue || "",
      eventSlug: event.slug,
      attendeeIdShort: attendee.id.slice(0, 8),
    })

    const resend = getResendClient()
    if (!resend) {
      return {
        success: false,
        error: "Email service is not configured. Set RESEND_API_KEY environment variable.",
      }
    }

    const pdfBuffer = Buffer.from(pdfBytes)
    const safeName = attendee.name.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-")

    const { error: emailError } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [attendee.email],
      subject: `Your Certificate of Participation - ${event.title}`,
      html: buildCertificateEmailHtml(attendee.name, event.title),
      attachments: [
        {
          filename: `certificate-${safeName}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    })

    if (emailError) {
      // Retry with fallback from address
      console.warn(`[certificateActions] Retrying with fallback address. Error: ${emailError.message}`)
      const { error: retryError } = await resend.emails.send({
        from: FALLBACK_FROM,
        to: [attendee.email],
        subject: `Your Certificate of Participation - ${event.title}`,
        html: buildCertificateEmailHtml(attendee.name, event.title),
        attachments: [
          {
            filename: `certificate-${safeName}.pdf`,
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
    console.error("[certificateActions] emailCertificate error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── Bulk email certificates ─────────────────────────────────────────── */

export async function emailBulkCertificates(eventId: string): Promise<{
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
      .eq("status", "checked_in")

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
      const result = await emailCertificate(attendee.id)
      if (result.success) {
        sent++
      } else {
        failed++
        errors.push(`${attendee.name} (${attendee.email}): ${result.error}`)
      }

      // Rate limit courtesy delay
      if (attendees.length > 5) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    return { success: failed === 0, sent, failed, errors }
  } catch (err) {
    console.error("[certificateActions] emailBulkCertificates error:", err)
    return { success: false, sent: 0, failed: 0, errors: [(err as Error).message] }
  }
}

/* ── Email HTML builder ──────────────────────────────────────────────── */

function buildCertificateEmailHtml(attendeeName: string, eventTitle: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#1a1a2e;border:1px solid rgba(231,171,28,0.3);border-radius:12px;padding:40px;text-align:center;">
      <h1 style="color:#e7ab1c;font-size:24px;margin:0 0 20px;">Certificate of Participation</h1>
      <p style="color:#ffffff;font-size:16px;line-height:1.6;margin:0 0 10px;">
        Dear ${attendeeName},
      </p>
      <p style="color:#cccccc;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Thank you for participating in <strong style="color:#ffffff;">${eventTitle}</strong>.
        Please find your Certificate of Participation attached to this email.
      </p>
      <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;margin-top:20px;">
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
