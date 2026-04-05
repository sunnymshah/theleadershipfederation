"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

/**
 * Get live check-in statistics for the big-screen dashboard.
 * Returns aggregate stats plus the most recent check-ins.
 */
export async function getLiveStats(eventId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Run all queries in parallel
    const [totalRes, checkedInRes, vipRes, recentRes] = await Promise.all([
      // Total registered
      supabase
        .from("attendees")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId),

      // Total checked in
      supabase
        .from("attendees")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "checked_in"),

      // VIP checked in — tickets whose name contains "VIP" (case-insensitive)
      supabase
        .from("attendees")
        .select("id, tickets!inner(name)")
        .eq("event_id", eventId)
        .eq("status", "checked_in")
        .ilike("tickets.name", "%vip%"),

      // Recent 15 check-ins
      supabase
        .from("attendees")
        .select("id, name, company, check_in_at, tickets(name)")
        .eq("event_id", eventId)
        .eq("status", "checked_in")
        .order("check_in_at", { ascending: false })
        .limit(15),
    ])

    const totalRegistered = totalRes.count ?? 0
    const checkedIn = checkedInRes.count ?? 0
    const pending = totalRegistered - checkedIn
    const vipCheckedIn = vipRes.data?.length ?? 0
    const checkInRate = totalRegistered > 0
      ? Math.round((checkedIn / totalRegistered) * 100)
      : 0

    const recentCheckIns = (recentRes.data ?? []).map((a) => ({
      name: a.name ?? "Unknown",
      company: a.company ?? "",
      time: a.check_in_at ?? "",
      ticketName: (a.tickets as unknown as { name: string } | null)?.name ?? "General",
    }))

    return {
      success: true,
      stats: {
        totalRegistered,
        checkedIn,
        pending,
        vipCheckedIn,
        checkInRate,
        recentCheckIns,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      stats: {
        totalRegistered: 0,
        checkedIn: 0,
        pending: 0,
        vipCheckedIn: 0,
        checkInRate: 0,
        recentCheckIns: [],
      },
    }
  }
}
