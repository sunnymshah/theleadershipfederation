import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createHmac, randomBytes, timingSafeEqual } from "crypto"
import { revalidatePath } from "next/cache"
import { Resend } from "resend"
import { confirmationEmailHtml } from "@/lib/email-templates"
import { rateLimit, clientIp } from "@/lib/rate-limit"

/**
 * Send a confirmation email to the newly registered attendee.
 * Runs unauthenticated because the payment verify flow is public (protected
 * instead by the Razorpay signature check). Any failure here is logged but
 * does not fail the request — the attendee is already registered and can
 * trigger a resend from the admin panel.
 */
async function sendRegistrationConfirmationEmail(params: {
  attendeeName: string
  attendeeEmail: string
  eventTitle: string
  eventStartDate: string
  eventEndDate: string | null
  eventVenue: string | null
  ticketName: string | null
  qrToken: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn(
      "[verify] RESEND_API_KEY not set — skipping confirmation email. " +
        "Attendee was registered successfully; email can be sent later from the admin panel."
    )
    return
  }

  try {
    const resend = new Resend(apiKey)

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "https://theleadershipfederation.com")

    const qrImageUrl = `${siteUrl}/api/qr/${encodeURIComponent(params.qrToken)}`

    const html = confirmationEmailHtml({
      attendeeName: params.attendeeName,
      attendeeEmail: params.attendeeEmail,
      eventTitle: params.eventTitle,
      eventDate: params.eventStartDate,
      eventEndDate: params.eventEndDate || undefined,
      eventVenue: params.eventVenue || "",
      ticketName: params.ticketName,
      qrToken: params.qrToken,
      qrImageUrl,
    })

    const primaryFrom =
      process.env.RESEND_FROM_ADDRESS ||
      "The Leadership Federation <events@theleadershipfederation.com>"
    const fallbackFrom = "The Leadership Federation <onboarding@resend.dev>"

    const subject = `Registration Confirmed: ${params.eventTitle}`

    const { error: primaryError } = await resend.emails.send({
      from: primaryFrom,
      to: [params.attendeeEmail],
      subject,
      html,
    })

    if (primaryError) {
      console.warn(
        `[verify] Primary from address failed, retrying with fallback: ${primaryError.message}`
      )
      const { error: fallbackError } = await resend.emails.send({
        from: fallbackFrom,
        to: [params.attendeeEmail],
        subject,
        html,
      })
      if (fallbackError) {
        console.error(`[verify] Email delivery failed: ${fallbackError.message}`)
      }
    }
  } catch (err) {
    console.error("[verify] Confirmation email error:", err)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 20 verify attempts per IP per minute. A legitimate
    // payment triggers exactly one; anything more is suspicious
    // (replay, forgery attempt, misbehaving client).
    const ip = clientIp(request)
    const rl = rateLimit({ key: `payverify:${ip}`, limit: 20, windowMs: 60 * 1000 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many verification attempts. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
        },
      )
    }

    const body = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      ticketId,
      attendeeDetails,
      customFieldValues,
    } = body as {
      razorpay_order_id: string
      razorpay_payment_id: string
      razorpay_signature: string
      ticketId: string
      attendeeDetails: {
        name: string
        email: string
        phone?: string
        company?: string
        designation?: string
      }
      customFieldValues?: Record<string, string>
    }

    // ── Validate required fields ──────────────────────────────────────
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !ticketId ||
      !attendeeDetails?.name ||
      !attendeeDetails?.email
    ) {
      return NextResponse.json(
        { error: "Missing required payment verification fields." },
        { status: 400 }
      )
    }

    // ── Verify Razorpay signature ─────────────────────────────────────
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      console.error("[verify] RAZORPAY_KEY_SECRET not configured")
      return NextResponse.json(
        { error: "Payment verification is not configured." },
        { status: 500 }
      )
    }

    const expectedSignature = createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    // Constant-time comparison — blocks byte-by-byte timing leaks of
    // the expected signature. Also: never log the expected signature
    // in production — that's a direct leak if error logs end up visible.
    let sigOk = false
    try {
      const a = Buffer.from(expectedSignature, "hex")
      const b = Buffer.from(razorpay_signature, "hex")
      sigOk = a.length === b.length && timingSafeEqual(a, b)
    } catch { sigOk = false }

    if (!sigOk) {
      // Do not log the order id: forgery attempts reveal which orders
      // an attacker is probing, and Vercel Function logs are not the
      // right place to maintain that list.
      console.error("[verify] Signature verification failed")
      return NextResponse.json(
        { error: "Payment verification failed. Invalid signature." },
        { status: 400 }
      )
    }

    // ── Signature valid — proceed with registration ───────────────────
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Fetch ticket details (joined with event for email content)
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(
        "id, name, price_inr, inventory_limit, sold, event_id, events(title, start_date, end_date, venue)"
      )
      .eq("id", ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: "Ticket not found." },
        { status: 404 }
      )
    }

    // Check availability (race condition guard)
    if (ticket.sold >= ticket.inventory_limit) {
      // Ticket sold out between order creation and payment — refund needed
      return NextResponse.json(
        {
          error:
            "This ticket sold out while your payment was processing. Please contact support for a refund.",
          refundRequired: true,
          paymentId: razorpay_payment_id,
        },
        { status: 409 }
      )
    }

    // Check for duplicate registration (idempotency)
    const { data: existing } = await supabase
      .from("attendees")
      .select("id, payment_status")
      .eq("event_id", ticket.event_id)
      .eq("email", attendeeDetails.email)
      .not("payment_status", "eq", "failed")
      .single()

    if (existing) {
      // Already registered — could be a duplicate webhook/verify call
      if (existing.payment_status === "paid") {
        return NextResponse.json({
          success: true,
          message: "Registration already confirmed.",
          attendeeId: existing.id,
          alreadyRegistered: true,
        })
      }
    }

    // Clean up any failed attempts for this email + event
    await supabase
      .from("attendees")
      .delete()
      .eq("event_id", ticket.event_id)
      .eq("email", attendeeDetails.email)
      .eq("payment_status", "failed")

    // Generate unique QR token
    const qrToken = randomBytes(24).toString("hex")

    // Generate invoice number: INV-YYYYMMDD-XXXXX
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "")
    const invoiceSeq = randomBytes(3).toString("hex").toUpperCase()
    const invoiceNumber = `INV-${dateStr}-${invoiceSeq}`

    // Create attendee record
    const { data: attendee, error: insertError } = await supabase
      .from("attendees")
      .insert({
        event_id: ticket.event_id,
        ticket_id: ticketId,
        name: attendeeDetails.name,
        email: attendeeDetails.email,
        phone: attendeeDetails.phone || null,
        company: attendeeDetails.company || null,
        designation: attendeeDetails.designation || null,
        qr_token: qrToken,
        status: "registered",
        payment_status: "paid",
        payment_id: razorpay_payment_id,
        razorpay_order_id,
        payment_amount: ticket.price_inr,
        invoice_number: invoiceNumber,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[verify] Insert error:", insertError)
      return NextResponse.json(
        { error: `Registration failed: ${insertError.message}` },
        { status: 500 }
      )
    }

    // Save custom field values if provided
    if (customFieldValues && attendee && Object.keys(customFieldValues).length > 0) {
      const cfRows = Object.entries(customFieldValues).map(([fieldId, value]) => ({
        custom_field_id: fieldId,
        attendee_id: attendee.id,
        value: String(value),
      }))
      await supabase.from("custom_field_values").insert(cfRows)
    }

    // Increment ticket sold count
    await supabase
      .from("tickets")
      .update({ sold: ticket.sold + 1 })
      .eq("id", ticketId)

    // Increment promo_codes.used_count now that the attendee exists.
    // We read the promo id out of the Razorpay order notes (set at
    // create-order time) so the verify path is the single point of
    // increment and abandoned checkouts don't burn promo seats.
    try {
      const orderNotes = body?.orderNotes as { promo_code_id?: string } | undefined
      const promoId = orderNotes?.promo_code_id
      if (promoId && typeof promoId === "string") {
        const { data: promoRow } = await supabase
          .from("promo_codes")
          .select("used_count")
          .eq("id", promoId)
          .maybeSingle()
        if (promoRow) {
          await supabase
            .from("promo_codes")
            .update({ used_count: (promoRow.used_count ?? 0) + 1 })
            .eq("id", promoId)
        }
      }
    } catch (e) {
      console.error("[verify] promo increment failed:", (e as Error).message)
    }

    // Revalidate relevant paths
    revalidatePath("/events", "page")
    revalidatePath("/admin/attendees", "page")
    revalidatePath("/admin", "page")

    // Send confirmation email (fire-and-forget; never blocks the response)
    const eventInfo = (ticket.events as unknown) as {
      title: string
      start_date: string
      end_date: string | null
      venue: string | null
    } | null
    if (eventInfo && attendee) {
      void sendRegistrationConfirmationEmail({
        attendeeName: attendee.name,
        attendeeEmail: attendee.email,
        eventTitle: eventInfo.title,
        eventStartDate: eventInfo.start_date,
        eventEndDate: eventInfo.end_date,
        eventVenue: eventInfo.venue,
        ticketName: ticket.name,
        qrToken,
      })

      // Best-effort: mark confirmation_sent_at even though send is async.
      // If the send fails, admin can still resend — this flag mainly drives UI.
      await supabase
        .from("attendees")
        .update({ confirmation_sent_at: new Date().toISOString() })
        .eq("id", attendee.id)
    }

    return NextResponse.json({
      success: true,
      attendee,
      invoiceNumber,
      message: "Payment verified and registration confirmed.",
    })
  } catch (err) {
    console.error("[verify] Error:", err)
    return NextResponse.json(
      { error: "Payment verification failed. Please contact support." },
      { status: 500 }
    )
  }
}
