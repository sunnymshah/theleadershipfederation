"use server"

/**
 * Badge Server Actions
 *
 * Fetch attendee data for badge generation and return badge data arrays.
 * Supports filtering by all / checked_in / vip.
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import type { BadgeData } from "@/lib/generateBadge"

/* ── Auth helper ─────────────────────────────────────────────────────── */

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

/* ── Get badge data for an event ─────────────────────────────────────── */

/**
 * Fetch all attendees for badge generation.
 * Supports filtering by status and VIP level.
 */
export async function getBadgeData(
  eventId: string,
  filter: "all" | "vip" | "checked_in" = "all"
): Promise<{
  success: boolean
  badges?: BadgeData[]
  eventTitle?: string
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch event title
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return { success: false, error: eventError?.message || "Event not found." }
    }

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

    const { data: attendees, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    if (!attendees || attendees.length === 0) {
      return { success: true, badges: [], eventTitle: event.title }
    }

    const badges: BadgeData[] = attendees.map((a, idx) => ({
      attendeeName: a.name,
      company: a.company,
      designation: a.designation,
      qrToken: a.qr_token || a.id,
      badgeNumber: idx + 1,
      vipLevel: a.vip_level,
    }))

    return { success: true, badges, eventTitle: event.title }
  } catch (err) {
    console.error("[badgeActions] getBadgeData error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── Generate event badges (returns badge data array) ─────────────────── */

export async function generateEventBadges(
  eventId: string,
  filter: "all" | "vip" | "checked_in" = "all"
): Promise<{
  success: boolean
  badges?: BadgeData[]
  count?: number
  eventTitle?: string
  error?: string
}> {
  try {
    const result = await getBadgeData(eventId, filter)
    if (!result.success || !result.badges) {
      return { success: false, error: result.error || "Failed to fetch badge data." }
    }

    return {
      success: true,
      badges: result.badges,
      count: result.badges.length,
      eventTitle: result.eventTitle,
    }
  } catch (err) {
    console.error("[badgeActions] generateEventBadges error:", err)
    return { success: false, error: (err as Error).message }
  }
}
