import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createHmac, randomBytes } from "crypto"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      ticketId,
      attendeeDetails,
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

    if (expectedSignature !== razorpay_signature) {
      console.error("[verify] Signature mismatch", {
        expected: expectedSignature,
        received: razorpay_signature,
      })
      return NextResponse.json(
        { error: "Payment verification failed. Invalid signature." },
        { status: 400 }
      )
    }

    // ── Signature valid — proceed with registration ───────────────────
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Fetch ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("id, name, price_inr, inventory_limit, sold, event_id")
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

    // Increment ticket sold count
    await supabase
      .from("tickets")
      .update({ sold: ticket.sold + 1 })
      .eq("id", ticketId)

    // Revalidate relevant paths
    revalidatePath("/events", "page")
    revalidatePath("/admin/attendees", "page")
    revalidatePath("/admin", "page")

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
