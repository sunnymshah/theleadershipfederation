import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, eventId, ticketId } = body as {
      code: string
      eventId: string
      ticketId: string
    }

    if (!code || !eventId || !ticketId) {
      return NextResponse.json(
        { valid: false, error: "Code, event ID, and ticket ID are required." },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Look up the promo code for this event (case-insensitive match)
    const { data: promo, error } = await supabase
      .from("promo_codes")
      .select("id, code, discount_type, discount_value, max_uses, used_count, valid_from, valid_until, active")
      .eq("event_id", eventId)
      .eq("code", code.toUpperCase().trim())
      .single()

    if (error || !promo) {
      return NextResponse.json(
        { valid: false, error: "Invalid promo code." },
        { status: 200 }
      )
    }

    // Check active
    if (!promo.active) {
      return NextResponse.json(
        { valid: false, error: "This promo code is no longer active." },
        { status: 200 }
      )
    }

    // Check max uses
    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
      return NextResponse.json(
        { valid: false, error: "This promo code has reached its usage limit." },
        { status: 200 }
      )
    }

    // Check validity dates
    const now = new Date()

    if (promo.valid_from && new Date(promo.valid_from) > now) {
      return NextResponse.json(
        { valid: false, error: "This promo code is not yet active." },
        { status: 200 }
      )
    }

    if (promo.valid_until && new Date(promo.valid_until) < now) {
      return NextResponse.json(
        { valid: false, error: "This promo code has expired." },
        { status: 200 }
      )
    }

    return NextResponse.json({
      valid: true,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      code: promo.code,
    })
  } catch (err) {
    console.error("[promo-validate] Error:", err)
    return NextResponse.json(
      { valid: false, error: "Failed to validate promo code." },
      { status: 500 }
    )
  }
}
