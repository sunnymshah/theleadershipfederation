import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import Razorpay from "razorpay"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId, attendeeDetails, customFieldValues, promoCode } = body as {
      ticketId: string
      attendeeDetails: {
        name: string
        email: string
        phone?: string
        company?: string
        designation?: string
      }
      customFieldValues?: Record<string, string>
      promoCode?: string
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
    // Use maybeSingle so 0-rows is not treated as an error and so the query
    // never throws on PGRST116. Order by created_at to get the most recent
    // record if multiple ever existed (shouldn't, but defensive).
    const { data: existingList } = await supabase
      .from("attendees")
      .select("id, payment_status")
      .eq("event_id", ticket.event_id)
      .eq("email", attendeeDetails.email)
      .order("created_at", { ascending: false })
      .limit(1)

    const existing = existingList?.[0] ?? null

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

    // ── Validate promo code server-side (if provided) ─────────────────
    let discountedPrice = ticket.price_inr
    let validatedPromoId: string | null = null
    let promoUsedCount = 0

    if (promoCode && ticket.price_inr > 0) {
      const { data: promo, error: promoError } = await supabase
        .from("promo_codes")
        .select("id, code, discount_type, discount_value, max_uses, used_count, valid_from, valid_until, active")
        .eq("event_id", ticket.event_id)
        .eq("code", promoCode.toUpperCase().trim())
        .single()

      if (promoError || !promo) {
        return NextResponse.json(
          { error: "Invalid promo code." },
          { status: 400 }
        )
      }

      if (!promo.active) {
        return NextResponse.json(
          { error: "This promo code is no longer active." },
          { status: 400 }
        )
      }

      if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
        return NextResponse.json(
          { error: "This promo code has reached its usage limit." },
          { status: 400 }
        )
      }

      const now = new Date()
      if (promo.valid_from && new Date(promo.valid_from) > now) {
        return NextResponse.json(
          { error: "This promo code is not yet active." },
          { status: 400 }
        )
      }
      if (promo.valid_until && new Date(promo.valid_until) < now) {
        return NextResponse.json(
          { error: "This promo code has expired." },
          { status: 400 }
        )
      }

      // Calculate discounted price
      if (promo.discount_type === "percentage") {
        discountedPrice = Math.max(0, Math.round(ticket.price_inr * (1 - promo.discount_value / 100)))
      } else {
        discountedPrice = Math.max(0, ticket.price_inr - promo.discount_value)
      }

      validatedPromoId = promo.id
      promoUsedCount = promo.used_count || 0
    }

    /** Helper: increment the promo code used_count after a successful
     *  registration. Used for the free-ticket path where registration
     *  completes synchronously. For paid tickets the increment is
     *  deferred to /api/payments/verify so an abandoned checkout does
     *  not consume a seat of the discount pool. */
    async function incrementPromoUsedCount() {
      if (!validatedPromoId) return
      await supabase
        .from("promo_codes")
        .update({ used_count: promoUsedCount + 1 })
        .eq("id", validatedPromoId)
    }

    // ── Free ticket (base price is 0 OR promo made it free): register directly ──
    if (discountedPrice === 0) {
      const qrToken = randomBytes(24).toString("hex")

      const insertData: Record<string, unknown> = {
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
      }

      // Store promo code reference in notes if a promo was used
      if (validatedPromoId && promoCode) {
        insertData.notes = `Promo code: ${promoCode.toUpperCase().trim()}`
      }

      const { data: attendee, error: insertError } = await supabase
        .from("attendees")
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
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

      // Increment sold count
      await supabase
        .from("tickets")
        .update({ sold: ticket.sold + 1 })
        .eq("id", ticketId)

      // Increment promo code used_count
      await incrementPromoUsedCount()

      return NextResponse.json({
        free: true,
        attendee,
        message: "Registration successful (free ticket).",
      })
    }

    // ── Paid ticket: create Razorpay order ────────────────────────────
    // Lazy-init Razorpay only for paid tickets so env vars are checked at
    // runtime, not at module load. This makes free tickets keep working even
    // when Razorpay credentials are missing, and gives a clear error message
    // when they are.
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) {
      console.error(
        "[create-order] Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment (Vercel → Project Settings → Environment Variables) and redeploy."
      )
      return NextResponse.json(
        {
          error:
            "Payment gateway is not configured. Please contact the event organiser.",
        },
        { status: 503 }
      )
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

    const amountInPaise = discountedPrice * 100
    const receiptId = `tkt_${ticketId.slice(0, 8)}_${Date.now()}`

    const orderNotes: Record<string, string> = {
      ticket_id: ticketId,
      event_id: ticket.event_id,
      attendee_name: attendeeDetails.name,
      attendee_email: attendeeDetails.email,
    }

    if (promoCode) {
      orderNotes.promo_code = promoCode.toUpperCase().trim()
    }
    if (validatedPromoId) {
      orderNotes.promo_code_id = validatedPromoId
    }

    let order
    try {
      order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: receiptId,
        notes: orderNotes,
      })
    } catch (rzpErr) {
      const message =
        rzpErr instanceof Error ? rzpErr.message : String(rzpErr)
      console.error("[create-order] Razorpay order creation failed:", message)
      return NextResponse.json(
        {
          error: `Payment gateway error: ${message}. Please try again or contact support.`,
        },
        { status: 502 }
      )
    }

    // NOTE: promo code used_count is intentionally NOT incremented here
    // for paid orders. If the user abandons the Razorpay modal the
    // counter would otherwise be inflated, letting an attacker burn a
    // "max_uses" promo without paying. /api/payments/verify performs
    // the increment after the attendee row is successfully created.

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
    const message = err instanceof Error ? err.message : String(err)
    console.error("[create-order] Error:", message, err)
    return NextResponse.json(
      {
        error: `Failed to create payment order: ${message}`,
      },
      { status: 500 }
    )
  }
}
