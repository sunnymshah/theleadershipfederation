"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

export interface TicketBreakdown {
  id: string
  name: string
  sold: number
  limit: number
  price_inr: number
  revenue: number
}

export interface EventBreakdown {
  id: string
  title: string
  slug: string
  start_date: string
  status: string
  totalRegistrations: number
  totalCheckedIn: number
  checkInRate: number
  revenue: number
}

export interface RevenueByDay {
  date: string
  revenue: number
  count: number
}

export interface DashboardStats {
  totalRevenue: number
  totalRegistrations: number
  totalCheckedIn: number
  checkInRate: number
  ticketBreakdown: TicketBreakdown[]
  revenueByDay: RevenueByDay[]
}

export interface OverallStats {
  totalEvents: number
  totalAttendees: number
  totalRevenue: number
  totalCheckedIn: number
  overallCheckInRate: number
  eventBreakdowns: EventBreakdown[]
  topEventByRegistrations: { title: string; count: number } | null
}

/**
 * Get dashboard stats for a specific event, or the latest event if none specified.
 */
export async function getDashboardStats(
  eventId?: string
): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // If no eventId, get the latest event
    if (!eventId) {
      const { data: latest } = await supabase
        .from("events")
        .select("id")
        .order("start_date", { ascending: false })
        .limit(1)
        .single()

      if (!latest) {
        return {
          success: true,
          data: {
            totalRevenue: 0,
            totalRegistrations: 0,
            totalCheckedIn: 0,
            checkInRate: 0,
            ticketBreakdown: [],
            revenueByDay: [],
          },
        }
      }
      eventId = latest.id
    }

    // Fetch attendees for this event
    const { data: attendees } = await supabase
      .from("attendees")
      .select("id, status, payment_status, payment_amount, ticket_id, registration_date")
      .eq("event_id", eventId)

    // Fetch tickets for this event
    const { data: tickets } = await supabase
      .from("tickets")
      .select("id, name, price_inr, sold, inventory_limit")
      .eq("event_id", eventId)
      .order("price_inr", { ascending: false })

    const attendeeList = attendees ?? []
    const ticketList = tickets ?? []

    // Total revenue: sum payment_amount where payment_status = 'paid'
    const totalRevenue = attendeeList
      .filter((a) => a.payment_status === "paid")
      .reduce((sum, a) => sum + (a.payment_amount ?? 0), 0)

    // Non-cancelled registrations
    const activeAttendees = attendeeList.filter(
      (a) => a.status !== "cancelled" && a.status !== "waitlisted"
    )
    const totalRegistrations = activeAttendees.length
    const totalCheckedIn = attendeeList.filter(
      (a) => a.status === "checked_in"
    ).length
    const checkInRate =
      totalRegistrations > 0
        ? Math.round((totalCheckedIn / totalRegistrations) * 100)
        : 0

    // Ticket breakdown
    const ticketBreakdown: TicketBreakdown[] = ticketList.map((t) => {
      const ticketPaidAttendees = attendeeList.filter(
        (a) => a.ticket_id === t.id && a.payment_status === "paid"
      )
      const revenue = ticketPaidAttendees.reduce(
        (sum, a) => sum + (a.payment_amount ?? 0),
        0
      )
      return {
        id: t.id,
        name: t.name,
        sold: t.sold,
        limit: t.inventory_limit,
        price_inr: t.price_inr,
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
    const revenueByDay: RevenueByDay[] = Array.from(dayMap.entries())
      .map(([date, val]) => ({ date, ...val }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      success: true,
      data: {
        totalRevenue,
        totalRegistrations,
        totalCheckedIn,
        checkInRate,
        ticketBreakdown,
        revenueByDay,
      },
    }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Get overall stats across all events.
 */
export async function getOverallStats(): Promise<{
  success: boolean
  data?: OverallStats
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch all events
    const { data: events } = await supabase
      .from("events")
      .select("id, title, slug, start_date, status")
      .order("start_date", { ascending: false })

    // Fetch all attendees
    const { data: allAttendees } = await supabase
      .from("attendees")
      .select("id, event_id, status, payment_status, payment_amount, ticket_id")

    // Fetch all tickets
    const { data: allTickets } = await supabase
      .from("tickets")
      .select("id, event_id, name, price_inr, sold, inventory_limit")

    const eventList = events ?? []
    const attendeeList = allAttendees ?? []
    const ticketList = allTickets ?? []

    const totalEvents = eventList.length

    const activeAttendees = attendeeList.filter(
      (a) => a.status !== "cancelled" && a.status !== "waitlisted"
    )
    const totalAttendees = activeAttendees.length

    const totalRevenue = attendeeList
      .filter((a) => a.payment_status === "paid")
      .reduce((sum, a) => sum + (a.payment_amount ?? 0), 0)

    const totalCheckedIn = attendeeList.filter(
      (a) => a.status === "checked_in"
    ).length

    const overallCheckInRate =
      totalAttendees > 0
        ? Math.round((totalCheckedIn / totalAttendees) * 100)
        : 0

    // Per-event breakdown
    const eventBreakdowns: EventBreakdown[] = eventList.map((event) => {
      const eventAttendees = attendeeList.filter(
        (a) => a.event_id === event.id
      )
      const activeEventAttendees = eventAttendees.filter(
        (a) => a.status !== "cancelled" && a.status !== "waitlisted"
      )
      const checkedIn = eventAttendees.filter(
        (a) => a.status === "checked_in"
      ).length
      const registrations = activeEventAttendees.length
      const revenue = eventAttendees
        .filter((a) => a.payment_status === "paid")
        .reduce((sum, a) => sum + (a.payment_amount ?? 0), 0)

      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        start_date: event.start_date,
        status: event.status,
        totalRegistrations: registrations,
        totalCheckedIn: checkedIn,
        checkInRate:
          registrations > 0
            ? Math.round((checkedIn / registrations) * 100)
            : 0,
        revenue,
      }
    })

    // Top event by registrations
    let topEventByRegistrations: { title: string; count: number } | null = null
    if (eventBreakdowns.length > 0) {
      const sorted = [...eventBreakdowns].sort(
        (a, b) => b.totalRegistrations - a.totalRegistrations
      )
      if (sorted[0].totalRegistrations > 0) {
        topEventByRegistrations = {
          title: sorted[0].title,
          count: sorted[0].totalRegistrations,
        }
      }
    }

    return {
      success: true,
      data: {
        totalEvents,
        totalAttendees,
        totalRevenue,
        totalCheckedIn,
        overallCheckInRate,
        eventBreakdowns,
        topEventByRegistrations,
      },
    }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
