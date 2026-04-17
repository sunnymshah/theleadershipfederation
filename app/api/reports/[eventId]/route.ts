/**
 * Report PDF Download API Route
 *
 * GET /api/reports/[eventId]
 * Returns a downloadable comprehensive event report PDF.
 */

import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { generateReportPdf, type ReportData } from "@/lib/generateReport"
import { isValidUUID } from "@/lib/security"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    if (!isValidUUID(eventId)) {
      return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400, headers: { "content-type": "application/json" } })
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
      .select("id, title, start_date, end_date, venue, status")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: eventError?.message || "Event not found" },
        { status: 404 }
      )
    }

    // Fetch attendees
    const { data: attendees } = await supabase
      .from("attendees")
      .select(`
        id, name, email, company, designation, status,
        payment_status, payment_amount, ticket_id, registration_date,
        qr_token, vip_level,
        tickets ( id, name, price_inr )
      `)
      .eq("event_id", eventId)
      .order("name")

    // Fetch tickets
    const { data: tickets } = await supabase
      .from("tickets")
      .select("id, name, price_inr, sold, inventory_limit")
      .eq("event_id", eventId)
      .order("price_inr", { ascending: false })

    // Fetch sponsors
    const { data: sponsors } = await supabase
      .from("sponsors")
      .select("id, name, tier, website")
      .eq("event_id", eventId)
      .order("sort_order")

    // Fetch speakers
    const { data: speakers } = await supabase
      .from("speakers")
      .select("id, name, title, company")
      .eq("event_id", eventId)
      .order("sort_order")

    const attendeeList = attendees ?? []
    const ticketList = tickets ?? []
    const sponsorList = sponsors ?? []
    const speakerList = speakers ?? []

    // Calculate stats
    const activeAttendees = attendeeList.filter(
      (a) => a.status !== "cancelled" && a.status !== "waitlisted"
    )
    const totalRegistrations = activeAttendees.length
    const totalCheckedIn = attendeeList.filter((a) => a.status === "checked_in").length
    const checkInRate = totalRegistrations > 0
      ? Math.round((totalCheckedIn / totalRegistrations) * 100)
      : 0
    const totalRevenue = attendeeList
      .filter((a) => a.payment_status === "paid")
      .reduce((sum, a) => sum + (a.payment_amount ?? 0), 0)

    // Ticket breakdown
    const ticketBreakdown = ticketList.map((t) => {
      const ticketPaidAttendees = attendeeList.filter(
        (a) => a.ticket_id === t.id && a.payment_status === "paid"
      )
      const revenue = ticketPaidAttendees.reduce(
        (sum, a) => sum + (a.payment_amount ?? 0), 0
      )
      return { name: t.name, sold: t.sold, limit: t.inventory_limit, priceInr: t.price_inr, revenue }
    })

    // Revenue by day
    const dayMap = new Map<string, { revenue: number; count: number }>()
    for (const a of attendeeList) {
      if (a.payment_status === "paid" && a.registration_date) {
        const day = new Date(a.registration_date).toISOString().split("T")[0]
        const existing = dayMap.get(day) ?? { revenue: 0, count: 0 }
        existing.revenue += a.payment_amount ?? 0
        existing.count += 1
        dayMap.set(day, existing)
      }
    }
    const revenueByDay = Array.from(dayMap.entries())
      .map(([date, val]) => ({ date, ...val }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Status breakdown
    const statusBreakdown: Record<string, number> = {}
    for (const a of attendeeList) {
      statusBreakdown[a.status] = (statusBreakdown[a.status] ?? 0) + 1
    }

    const reportAttendees = attendeeList.map((a) => {
      const ticket = a.tickets as unknown as { id: string; name: string; price_inr: number } | null
      return {
        name: a.name,
        email: a.email,
        company: a.company,
        designation: a.designation,
        status: a.status,
        paymentStatus: a.payment_status,
        ticketName: ticket?.name ?? null,
        vipLevel: a.vip_level,
      }
    })

    const reportData: ReportData = {
      event: {
        title: event.title,
        startDate: event.start_date,
        endDate: event.end_date || undefined,
        venue: event.venue || "",
        status: event.status,
      },
      totalRegistrations,
      totalCheckedIn,
      checkInRate,
      totalRevenue,
      ticketBreakdown,
      revenueByDay,
      attendees: reportAttendees,
      sponsors: sponsorList.map((s) => ({ name: s.name, tier: s.tier, website: s.website })),
      speakers: speakerList.map((s) => ({ name: s.name, title: s.title, company: s.company })),
      statusBreakdown,
    }

    // Generate PDF
    const pdfBytes = generateReportPdf(reportData)

    const safeTitle = event.title
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-${safeTitle}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[reports API] Error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
