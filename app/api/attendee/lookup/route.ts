/**
 * Attendee Lookup API Route
 *
 * POST /api/attendee/lookup
 * Public endpoint (no auth required).
 * Accepts { email: string, eventSlug?: string }
 * Returns matching registrations for the self-service portal.
 */

import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { rateLimit, clientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    // Prevent email enumeration: 10 lookups per IP per minute.
    const ip = clientIp(request)
    const rl = rateLimit({ key: `lookup:${ip}`, limit: 10, windowMs: 60 * 1000 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many lookups. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
        },
      )
    }

    const body = await request.json()
    const { email, eventSlug } = body as { email?: string; eventSlug?: string }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Build query: attendees joined with events and tickets
    let query = supabase
      .from("attendees")
      .select(`
        id, name, email, status, payment_status, payment_amount, checked_in, qr_token,
        tickets ( id, name ),
        events ( id, title, slug )
      `)
      .ilike("email", normalizedEmail)
      .in("status", ["registered", "confirmed", "checked_in"])

    // If eventSlug provided, filter by that event
    if (eventSlug && typeof eventSlug === "string") {
      query = supabase
        .from("attendees")
        .select(`
          id, name, email, status, payment_status, payment_amount, checked_in, qr_token,
          tickets ( id, name ),
          events!inner ( id, title, slug )
        `)
        .ilike("email", normalizedEmail)
        .in("status", ["registered", "confirmed", "checked_in"])
        .eq("events.slug", eventSlug)
    }

    const { data: attendees, error } = await query

    if (error) {
      console.error("[attendee/lookup] Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to look up registrations" },
        { status: 500 }
      )
    }

    // Map to a clean response shape
    const registrations = (attendees ?? []).map((a) => {
      const event = a.events as unknown as {
        id: string
        title: string
        slug: string
      } | null
      const ticket = a.tickets as unknown as {
        id: string
        name: string
      } | null

      return {
        id: a.id,
        name: a.name,
        email: a.email,
        event_title: event?.title ?? "Unknown Event",
        event_slug: event?.slug ?? "",
        event_id: event?.id ?? "",
        ticket_name: ticket?.name ?? "General",
        status: a.status,
        payment_status: a.payment_status,
        payment_amount: a.payment_amount,
        checked_in: a.checked_in ?? a.status === "checked_in",
        qr_token: a.qr_token,
      }
    })

    return NextResponse.json({ registrations })
  } catch (err) {
    console.error("[attendee/lookup] Error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
