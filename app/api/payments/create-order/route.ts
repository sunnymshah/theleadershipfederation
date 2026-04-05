import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Razorpay from "razorpay"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    // Lazy-init Razorpay inside the handler so env vars are available at
    // runtime (they are NOT available at build/compile time).
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
    const body = await request.json()
    const { ticketId, attendeeDetails } = body as {
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
    if (!ticketId || !attendeeDetails?.name || !attendeeDetails?.email) {
      return NextResponse.json(
        { error: "Ticket ID, name, and email are required." },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // ── Fetch ticket with event details ───────────────────────────────
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("id, name, description, price_inr, inventory_limit, sold, event_id, events(id, title, slug)")
      .eq("id", ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: "Ticket not found." },
        { status: 404 }
      )
    }

    // ── Check availability ────────────────────────────────────────────
    if (ticket.sold >= ticket.inventory_limit) {
      return NextResponse.json(
        { error: "Sorry, this ticket is sold out." },
        { status: 409 }
      )
    }

    // ── Check for duplicate registration ──────────────────────────────
    const { data: existing } = await supabase
      .from("attendees")
      .select("id, payment_status")
      .eq("event_id", ticket.event_id)
      .eq("email", attendeeDetails.email)
      .single()

    if (existing) {
      // Allow re-attempt if previous payment failed
      if (existing.payment_status !== "failed") {
        return NextResponse.json(
          { error: "You are already registered for this event." },
          { status: 409 }
        )
      }
      // Clean up the failed registration so a new one can be created
      await supabase.from("attendees").delete().eq("id", existing.id)
    }

    const event = ticket.events as unknown as {
      id: string
      title: string
      slug: string
    }

    // ── Free ticket: register directly ────────────────────────────────
    if (ticket.price_inr === 0) {
      const qrToken = randomBytes(24).toString("hex")

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
          payment_status: "free",
          payment_amount: 0,
        })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        )
      }

      // Increment sold count
      await supabase
        .from("tickets")
        .update({ sold: ticket.sold + 1 })
        .eq("id", ticketId)

      return NextResponse.json({
        free: true,
        attendee,
        message: "Registration successful (free ticket).",
      })
    }

    // ── Paid ticket: create Razorpay order ────────────────────────────
    const amountInPaise = ticket.price_inr * 100
    const receiptId = `tkt_${ticketId.slice(0, 8)}_${Date.now()}`

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        ticket_id: ticketId,
        event_id: ticket.event_id,
        attendee_name: attendeeDetails.name,
        attendee_email: attendeeDetails.email,
      },
    })

    return NextResponse.json({
      free: false,
      orderId: order.id,
      amount: amountInPaise,
      currency: "INR",
      ticket: {
        id: ticket.id,
        name: ticket.name,
        price_inr: ticket.price_inr,
      },
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
      },
    })
  } catch (err) {
    console.error("[create-order] Error:", err)
    return NextResponse.json(
      { error: "Failed to create payment order. Please try again." },
      { status: 500 }
    )
  }
}
