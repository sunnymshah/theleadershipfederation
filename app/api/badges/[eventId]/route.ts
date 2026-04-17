/**
 * Badge PDF Download API Route
 *
 * GET /api/badges/[eventId]?filter=all|vip|checked_in&design={JSON}
 * Returns a downloadable PDF with all badge name tags for an event.
 * Accepts an optional BadgeDesign JSON config via the `design` query param.
 */

import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { generateBadgePDF, DEFAULT_DESIGN, type BadgeData, type BadgeDesign } from "@/lib/generateBadge"
import { isValidUUID } from "@/lib/security"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    if (!isValidUUID(eventId)) {
      return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400, headers: { "content-type": "application/json" } })
    }
    const { searchParams } = new URL(request.url)
    const filter = (searchParams.get("filter") ?? "all") as "all" | "vip" | "checked_in"
    const designParam = searchParams.get("design")

    // Parse design config (fall back to defaults)
    let design: BadgeDesign = { ...DEFAULT_DESIGN }
    if (designParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(designParam))
        design = { ...DEFAULT_DESIGN, ...parsed }
      } catch {
        // ignore invalid JSON, use defaults
      }
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: eventError?.message || "Event not found" },
        { status: 404 }
      )
    }

    // Set event title on design
    design.eventTitle = event.title

    // Build attendee query
    let query = supabase
      .from("attendees")
      .select("id, name, email, company, designation, status, qr_token, vip_level")
      .eq("event_id", eventId)
      .in("status", ["registered", "confirmed", "checked_in"])
      .order("name")

    if (filter === "checked_in") {
      query = supabase
        .from("attendees")
        .select("id, name, email, company, designation, status, qr_token, vip_level")
        .eq("event_id", eventId)
        .eq("status", "checked_in")
        .order("name")
    } else if (filter === "vip") {
      query = supabase
        .from("attendees")
        .select("id, name, email, company, designation, status, qr_token, vip_level")
        .eq("event_id", eventId)
        .in("status", ["registered", "confirmed", "checked_in"])
        .not("vip_level", "is", null)
        .not("vip_level", "eq", "standard")
        .order("name")
    }

    const { data: attendees, error: attError } = await query

    if (attError) {
      return NextResponse.json({ error: attError.message }, { status: 500 })
    }

    if (!attendees || attendees.length === 0) {
      return NextResponse.json(
        { error: "No attendees found matching the filter" },
        { status: 404 }
      )
    }

    // Build badge data
    const badges: BadgeData[] = attendees.map((a, idx) => ({
      attendeeName: a.name,
      company: a.company,
      designation: a.designation,
      qrToken: a.qr_token || a.id,
      badgeNumber: idx + 1,
      vipLevel: a.vip_level,
    }))

    // Generate PDF with design config
    const doc = generateBadgePDF(badges, design)
    const pdfBytes = doc.output("arraybuffer") as unknown as Uint8Array

    const safeTitle = event.title
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="badges-${safeTitle}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[badges API] Error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
