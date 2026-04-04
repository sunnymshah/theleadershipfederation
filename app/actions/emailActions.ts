"use server"

/**
 * ─── EMAIL SERVER ACTIONS ──────────────────────────────────────────────
 *
 * Send confirmation emails with QR codes to event attendees via Resend.
 * Each attendee gets a unique qr_token stored in the database which is
 * embedded as a QR code in the email for event check-in.
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { Resend } from "resend"
import QRCode from "qrcode"
import { confirmationEmailHtml } from "@/lib/email-templates"

/* ── Resend client (lazy, null-safe) ────────────────────────────────── */

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn(
      "[emailActions] RESEND_API_KEY is not set. Emails will not be sent. " +
      "Set the RESEND_API_KEY environment variable to enable email delivery."
    )
    return null
  }
  return new Resend(apiKey)
}

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS ||
  "The Leadership Federation <events@theleadershipfederation.com>"

const FALLBACK_FROM = "The Leadership Federation <onboarding@resend.dev>"

/* ── Helpers ────────────────────────────────────────────────────────── */

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

/**
 * Generate a QR code PNG as a base64-encoded string.
 * The QR code encodes the qr_token value which can be scanned at the event.
 */
async function generateQrCodeBase64(token: string): Promise<string> {
  const dataUrl = await QRCode.toDataURL(token, {
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  })
  // Strip the data:image/png;base64, prefix
  return dataUrl.replace(/^data:image\/png;base64,/, "")
}

/* ── Single attendee confirmation ───────────────────────────────────── */

export async function sendConfirmationEmail(attendeeId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch attendee with event and ticket details
    const { data: attendee, error: attendeeError } = await supabase
      .from("attendees")
      .select(`
        id, name, email, event_id, ticket_id, qr_token,
        events ( id, title, slug, start_date, end_date, venue ),
        tickets ( id, name )
      `)
      .eq("id", attendeeId)
      .single()

    if (attendeeError || !attendee) {
      return { success: false, error: attendeeError?.message || "Attendee not found." }
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

    const ticket = attendee.tickets as unknown as { id: string; name: string } | null

    // Generate a unique QR token if one doesn't exist
    const qrToken = attendee.qr_token || crypto.randomUUID()

    // Save the qr_token if it was newly generated
    if (!attendee.qr_token) {
      const { error: tokenError } = await supabase
        .from("attendees")
        .update({ qr_token: qrToken })
        .eq("id", attendeeId)

      if (tokenError) {
        return { success: false, error: `Failed to save QR token: ${tokenError.message}` }
      }
    }

    // Generate QR code image
    const qrBase64 = await generateQrCodeBase64(qrToken)
    const qrBuffer = Buffer.from(qrBase64, "base64")
    const qrCid = "qrcode@tlf"

    // Build the email HTML
    const html = confirmationEmailHtml({
      attendeeName: attendee.name,
      attendeeEmail: attendee.email,
      eventTitle: event.title,
      eventDate: event.start_date,
      eventEndDate: event.end_date || undefined,
      eventVenue: event.venue || "",
      ticketName: ticket?.name || null,
      qrToken,
      qrCid,
    })

    // Send via Resend
    const resend = getResendClient()
    if (!resend) {
      return {
        success: false,
        error: "Email service is not configured. Set RESEND_API_KEY environment variable.",
      }
    }

    let fromAddress = FROM_ADDRESS
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: fromAddress,
      to: [attendee.email],
      subject: `Registration Confirmed: ${event.title}`,
      html,
      attachments: [
        {
          filename: "qrcode.png",
          content: qrBuffer,
          contentType: "image/png",
          // @ts-expect-error - Resend supports content_id for inline CID attachments
          content_id: qrCid,
        },
      ],
    })

    // If the primary from address fails (domain not verified), retry with fallback
    if (emailError && !emailResult) {
      console.warn(
        `[emailActions] Failed with primary from address, retrying with fallback. Error: ${emailError.message}`
      )
      const { data: retryResult, error: retryError } = await resend.emails.send({
        from: FALLBACK_FROM,
        to: [attendee.email],
        subject: `Registration Confirmed: ${event.title}`,
        html,
        attachments: [
          {
            filename: "qrcode.png",
            content: qrBuffer,
            contentType: "image/png",
            // @ts-expect-error - Resend supports content_id for inline CID attachments
            content_id: qrCid,
          },
        ],
      })

      if (retryError || !retryResult) {
        return {
          success: false,
          error: `Email delivery failed: ${retryError?.message || "Unknown error"}`,
        }
      }
    }

    // Update confirmation_sent_at timestamp
    const { error: updateError } = await supabase
      .from("attendees")
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq("id", attendeeId)

    if (updateError) {
      console.error("[emailActions] Failed to update confirmation_sent_at:", updateError.message)
      // Email was sent successfully, so we still return success
    }

    return { success: true }
  } catch (err) {
    console.error("[emailActions] sendConfirmationEmail error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── Bulk send for an event ─────────────────────────────────────────── */

export async function sendBulkConfirmationEmails(eventId: string): Promise<{
  success: boolean
  sent: number
  failed: number
  errors: string[]
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch all attendees for this event who haven't received a confirmation
    const { data: attendees, error } = await supabase
      .from("attendees")
      .select("id, name, email")
      .eq("event_id", eventId)
      .is("confirmation_sent_at", null)
      .in("status", ["registered", "confirmed"])

    if (error) {
      return { success: false, sent: 0, failed: 0, errors: [error.message] }
    }

    if (!attendees || attendees.length === 0) {
      return { success: true, sent: 0, failed: 0, errors: [] }
    }

    let sent = 0
    let failed = 0
    const errors: string[] = []

    // Send emails sequentially to avoid rate limits
    for (const attendee of attendees) {
      const result = await sendConfirmationEmail(attendee.id)
      if (result.success) {
        sent++
      } else {
        failed++
        errors.push(`${attendee.name} (${attendee.email}): ${result.error}`)
      }

      // Small delay between emails to respect rate limits
      if (attendees.length > 5) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    return { success: failed === 0, sent, failed, errors }
  } catch (err) {
    console.error("[emailActions] sendBulkConfirmationEmails error:", err)
    return {
      success: false,
      sent: 0,
      failed: 0,
      errors: [(err as Error).message],
    }
  }
}
