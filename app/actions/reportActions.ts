"use server"

/**
 * Report & Analytics Export Server Actions
 *
 * Generate comprehensive event reports, export CSV data.
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import type { ReportData } from "@/lib/generateReport"

/* ── Auth helper ─────────────────────────────────────────────────────── */

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

/* ── Generate comprehensive event report data ────────────────────────── */

export async function generateEventReport(eventId: string): Promise<{
  success: boolean
  data?: ReportData
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, start_date, end_date, venue, status")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return { success: false, error: eventError?.message || "Event not found." }
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
      return {
        name: t.name,
        sold: t.sold,
        limit: t.inventory_limit,
        priceInr: t.price_inr,
        revenue,
      }
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

    // Map attendees for report
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

    return { success: true, data: reportData }
  } catch (err) {
    console.error("[reportActions] generateEventReport error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── Export attendee CSV ─────────────────────────────────────────────── */

export async function exportEventReportCSV(eventId: string): Promise<{
  success: boolean
  csv?: string
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: attendees, error } = await supabase
      .from("attendees")
      .select(`
        id, name, email, phone, company, designation, status,
        payment_status, payment_amount, registration_date,
        qr_token, vip_level, check_in_at,
        tickets ( name ),
        events ( title )
      `)
      .eq("event_id", eventId)
      .order("name")

    if (error) {
      return { success: false, error: error.message }
    }

    const rows = (attendees ?? []).map((a) => {
      const ticket = a.tickets as unknown as { name: string } | null
      const event = a.events as unknown as { title: string } | null
      return {
        Name: a.name,
        Email: a.email,
        Phone: a.phone || "",
        Company: a.company || "",
        Designation: a.designation || "",
        Event: event?.title || "",
        Ticket: ticket?.name || "",
        Status: a.status,
        "Payment Status": a.payment_status || "",
        "Payment Amount": a.payment_amount?.toString() || "0",
        "VIP Level": a.vip_level || "standard",
        "Registration Date": a.registration_date
          ? new Date(a.registration_date).toLocaleDateString("en-IN")
          : "",
        "Check-In Time": a.check_in_at
          ? new Date(a.check_in_at).toLocaleString("en-IN")
          : "",
        "QR Token": a.qr_token || "",
      }
    })

    if (rows.length === 0) {
      return { success: true, csv: "No data" }
    }

    const headers = Object.keys(rows[0])
    const csvLines = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = (row as Record<string, string>)[h] ?? ""
            // Escape commas and quotes
            if (val.includes(",") || val.includes('"') || val.includes("\n")) {
              return `"${val.replace(/"/g, '""')}"`
            }
            return val
          })
          .join(",")
      ),
    ]

    return { success: true, csv: csvLines.join("\n") }
  } catch (err) {
    console.error("[reportActions] exportEventReportCSV error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── Export revenue CSV ──────────────────────────────────────────────── */

export async function exportRevenueReportCSV(eventId: string): Promise<{
  success: boolean
  csv?: string
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: attendees, error } = await supabase
      .from("attendees")
      .select(`
        id, name, payment_status, payment_amount, registration_date,
        tickets ( name, price_inr )
      `)
      .eq("event_id", eventId)
      .eq("payment_status", "paid")
      .order("registration_date")

    if (error) {
      return { success: false, error: error.message }
    }

    const list = attendees ?? []

    // Revenue by day
    const dayMap = new Map<string, { revenue: number; count: number }>()
    for (const a of list) {
      if (a.registration_date) {
        const day = new Date(a.registration_date).toISOString().split("T")[0]
        const existing = dayMap.get(day) ?? { revenue: 0, count: 0 }
        existing.revenue += a.payment_amount ?? 0
        existing.count += 1
        dayMap.set(day, existing)
      }
    }

    // Revenue by tier
    const tierMap = new Map<string, { revenue: number; count: number }>()
    for (const a of list) {
      const ticket = a.tickets as unknown as { name: string; price_inr: number } | null
      const tierName = ticket?.name ?? "Unknown"
      const existing = tierMap.get(tierName) ?? { revenue: 0, count: 0 }
      existing.revenue += a.payment_amount ?? 0
      existing.count += 1
      tierMap.set(tierName, existing)
    }

    let csv = "=== Revenue by Day ===\n"
    csv += "Date,Registrations,Revenue\n"
    for (const [date, val] of Array.from(dayMap.entries()).sort()) {
      csv += `${date},${val.count},${val.revenue}\n`
    }

    csv += "\n=== Revenue by Ticket Tier ===\n"
    csv += "Ticket,Count,Revenue\n"
    for (const [tier, val] of tierMap) {
      csv += `"${tier}",${val.count},${val.revenue}\n`
    }

    const totalRevenue = list.reduce((sum, a) => sum + (a.payment_amount ?? 0), 0)
    csv += `\nTotal,${list.length},${totalRevenue}\n`

    return { success: true, csv }
  } catch (err) {
    console.error("[reportActions] exportRevenueReportCSV error:", err)
    return { success: false, error: (err as Error).message }
  }
}
