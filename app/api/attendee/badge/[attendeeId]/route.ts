/**
 * Public Badge PDF Download API Route
 *
 * GET /api/attendee/badge/[attendeeId]?token=<qr_token>
 * Returns a downloadable single-badge PDF for an attendee.
 * Verifies the qr_token for public access (no auth required).
 */

import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import {
  generateBadgePDF,
  DEFAULT_DESIGN,
  type BadgeData,
} from "@/lib/generateBadge"
import { isValidUUID } from "@/lib/security"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attendeeId: string }> }
) {
  try {
    const { attendeeId } = await params
    if (!isValidUUID(attendeeId)) {
      return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400, headers: { "content-type": "application/json" } })
    }
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { error: "Token is required for verification" },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Fetch attendee with event
    const { data: attendee, error: attendeeError } = await supabase
      .from("attendees")
      .select(`
        id, name, email, company, designation, status, qr_token, vip_level,
        events ( id, title, slug )
      `)
      .eq("id", attendeeId)
      .single()

    if (attendeeError || !attendee) {
      return NextResponse.json(
        { error: "Attendee not found" },
        { status: 404 }
      )
    }

    // Verify token
    if (attendee.qr_token !== token) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 403 }
      )
    }

    // Verify status allows badge download
    if (!["registered", "confirmed", "checked_in"].includes(attendee.status)) {
      return NextResponse.json(
        { error: "Badge is not available for this registration status" },
        { status: 400 }
      )
    }

    const event = attendee.events as unknown as {
      id: string
      title: string
      slug: string
    } | null

    // Build single badge
    const badge: BadgeData = {
      attendeeName: attendee.name,
      company: attendee.company,
      designation: attendee.designation,
      qrToken: attendee.qr_token || attendee.id,
      badgeNumber: 1,
      vipLevel: attendee.vip_level,
    }

    const design = {
      ...DEFAULT_DESIGN,
      eventTitle: event?.title ?? "The Leadership Federation",
    }

    // Generate PDF with single badge
    const doc = generateBadgePDF([badge], design)
    const pdfBytes = doc.output("arraybuffer") as unknown as Uint8Array

    const safeName = attendee.name
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="badge-${safeName}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[attendee/badge] Error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
