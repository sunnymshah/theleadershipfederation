/**
 * Certificate PDF Download API Route
 *
 * GET /api/certificates/[attendeeId]
 * Returns a downloadable PDF certificate for a checked-in attendee.
 */

import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { generateCertificatePdf } from "@/lib/generateCertificate"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attendeeId: string }> }
) {
  try {
    const { attendeeId } = await params
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch attendee with event
    const { data: attendee, error: attendeeError } = await supabase
      .from("attendees")
      .select(`
        id, name, email, status,
        events ( id, title, slug, start_date, end_date, venue )
      `)
      .eq("id", attendeeId)
      .single()

    if (attendeeError || !attendee) {
      return NextResponse.json(
        { error: attendeeError?.message || "Attendee not found" },
        { status: 404 }
      )
    }

    if (attendee.status !== "checked_in") {
      return NextResponse.json(
        { error: "Only checked-in attendees can receive certificates" },
        { status: 400 }
      )
    }

    const event = attendee.events as unknown as {
      id: string; title: string; slug: string
      start_date: string; end_date: string; venue: string
    } | null

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Generate PDF
    const pdfBytes = generateCertificatePdf({
      attendeeName: attendee.name,
      eventTitle: event.title,
      eventDate: event.start_date,
      eventEndDate: event.end_date || undefined,
      venue: event.venue || "",
      eventSlug: event.slug,
      attendeeIdShort: attendee.id.slice(0, 8),
    })

    const safeName = attendee.name
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${safeName}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[certificates API] Error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
