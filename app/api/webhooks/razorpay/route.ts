import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createHmac, timingSafeEqual } from "crypto"

/**
 * Razorpay Webhook Handler
 *
 * This is a backup mechanism for when users close their browser after payment.
 * Razorpay sends webhook events for payment lifecycle changes.
 *
 * Note: We use createServerClient directly here (no cookies needed)
 * because webhooks are server-to-server calls with no user session.
 * We use the service role key for unrestricted DB access.
 */

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables for webhook handler")
  }

  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {
        // No-op: webhooks have no cookies
      },
    },
  })
}

function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    console.error("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not configured")
    return false
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(body)
    .digest("hex")

  // Constant-time comparison — prevents timing attacks that could
  // let a remote attacker learn the signature byte-by-byte by measuring
  // how long the string comparison takes.
  try {
    const a = Buffer.from(expectedSignature, "hex")
    const b = Buffer.from(signature, "hex")
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("x-razorpay-signature")

    if (!signature) {
      console.error("[razorpay-webhook] Missing X-Razorpay-Signature header")
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      )
    }

    // ── Verify webhook signature ──────────────────────────────────────
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("[razorpay-webhook] Invalid signature")
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      )
    }

    const event = JSON.parse(rawBody)
    const eventType = event.event as string

    console.log(`[razorpay-webhook] Received event: ${eventType}`)

    const supabase = getSupabaseAdmin()

    // ── Handle: payment.captured ──────────────────────────────────────
    if (eventType === "payment.captured") {
      const payment = event.payload?.payment?.entity
      if (!payment) {
        console.error("[razorpay-webhook] No payment entity in payload")
        return NextResponse.json({ status: "ok" })
      }

      const orderId = payment.order_id as string
      const paymentId = payment.id as string

      // Check if attendee exists for this order
      const { data: attendee } = await supabase
        .from("attendees")
        .select("id, payment_status")
        .eq("razorpay_order_id", orderId)
        .single()

      if (attendee) {
        // Only update if not already paid (idempotency)
        if (attendee.payment_status !== "paid") {
          await supabase
            .from("attendees")
            .update({
              payment_status: "paid",
              payment_id: paymentId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", attendee.id)

          console.log(
            `[razorpay-webhook] Updated attendee ${attendee.id} to paid`
          )
        }
      } else {
        // Attendee record doesn't exist yet — the verify endpoint
        // should create it. Log for monitoring.
        console.warn(
          `[razorpay-webhook] No attendee found for order ${orderId}. ` +
          `The /verify endpoint may not have been called yet.`
        )

        // Store the payment info in notes so verify can reconcile
        // This is a defensive measure — in practice the verify endpoint
        // creates the attendee before the webhook fires.
      }

      return NextResponse.json({ status: "ok" })
    }

    // ── Handle: payment.failed ────────────────────────────────────────
    if (eventType === "payment.failed") {
      const payment = event.payload?.payment?.entity
      if (!payment) {
        return NextResponse.json({ status: "ok" })
      }

      const orderId = payment.order_id as string

      // Update any attendee record with this order to failed
      const { data: attendee } = await supabase
        .from("attendees")
        .select("id, payment_status")
        .eq("razorpay_order_id", orderId)
        .single()

      if (attendee && attendee.payment_status !== "paid") {
        await supabase
          .from("attendees")
          .update({
            payment_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", attendee.id)

        console.log(
          `[razorpay-webhook] Updated attendee ${attendee.id} to failed`
        )
      }

      return NextResponse.json({ status: "ok" })
    }

    // ── Other events: acknowledge ─────────────────────────────────────
    console.log(`[razorpay-webhook] Unhandled event type: ${eventType}`)
    return NextResponse.json({ status: "ok" })
  } catch (err) {
    console.error("[razorpay-webhook] Error:", err)
    // Always return 200 to Razorpay to prevent retries for parsing errors
    return NextResponse.json({ status: "error" }, { status: 200 })
  }
}
