import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { rateLimit, clientIp } from "@/lib/rate-limit"
import { isValidUUID } from "@/lib/security"

export async function POST(request: NextRequest) {
  try {
    // Promo codes are short strings (often 6–10 chars) and this endpoint
    // answers true/false on existence without auth. Without a rate limit
    // an attacker can brute-force every event's promo codes and harvest
    // their discount values.
    const ip = clientIp(request)
    const rl = rateLimit({ key: `promo:${ip}`, limit: 15, windowMs: 60 * 1000 })
    if (!rl.allowed) {
      return NextResponse.json(
        { valid: false, error: "Too many attempts. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
        },
      )
    }

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
    if (!isValidUUID(eventId) || !isValidUUID(ticketId)) {
      return NextResponse.json(
        { valid: false, error: "Invalid event or ticket ID." },
        { status: 400 }
      )
    }
    // Codes are short alphanumeric tokens in our schema.
    if (typeof code !== "string" || code.length > 64 || !/^[A-Z0-9_\-]+$/i.test(code)) {
      return NextResponse.json(
        { valid: false, error: "Invalid promo code." },
        { status: 200 }
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
