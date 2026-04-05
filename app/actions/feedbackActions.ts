"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

/* ── Public-facing: Submit feedback ─────────────────────────────────── */

export interface FeedbackData {
  event_id: string
  attendee_email: string
  attendee_name?: string
  overall_rating?: number
  content_rating?: number
  venue_rating?: number
  organization_rating?: number
  speaker_rating?: number
  would_recommend?: boolean
  best_part?: string
  improvement?: string
  additional_comments?: string
}

export async function submitFeedback(data: FeedbackData) {
  try {
    // Use an unauthenticated client for public submissions
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase
      .from("event_feedback")
      .insert({
        event_id: data.event_id,
        attendee_email: data.attendee_email,
        attendee_name: data.attendee_name || null,
        overall_rating: data.overall_rating ?? null,
        content_rating: data.content_rating ?? null,
        venue_rating: data.venue_rating ?? null,
        organization_rating: data.organization_rating ?? null,
        speaker_rating: data.speaker_rating ?? null,
        would_recommend: data.would_recommend ?? null,
        best_part: data.best_part || null,
        improvement: data.improvement || null,
        additional_comments: data.additional_comments || null,
      })

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "You have already submitted feedback for this event." }
      }
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Admin: Get feedback summary / aggregates ───────────────────────── */

export async function getFeedbackSummary(eventId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: feedback, error } = await supabase
      .from("event_feedback")
      .select("overall_rating, content_rating, venue_rating, organization_rating, speaker_rating, would_recommend")
      .eq("event_id", eventId)

    if (error) return { success: false, error: error.message, summary: null }

    const count = feedback?.length ?? 0
    if (count === 0) {
      return {
        success: true,
        summary: {
          responseCount: 0,
          averageOverall: 0,
          averageContent: 0,
          averageVenue: 0,
          averageOrganization: 0,
          averageSpeaker: 0,
          nps: 0,
        },
      }
    }

    const avg = (arr: (number | null)[]) => {
      const valid = arr.filter((n): n is number => n !== null)
      return valid.length > 0 ? Math.round((valid.reduce((s, v) => s + v, 0) / valid.length) * 10) / 10 : 0
    }

    const recommenders = feedback!.filter((f) => f.would_recommend === true).length
    const nps = Math.round((recommenders / count) * 100)

    return {
      success: true,
      summary: {
        responseCount: count,
        averageOverall: avg(feedback!.map((f) => f.overall_rating)),
        averageContent: avg(feedback!.map((f) => f.content_rating)),
        averageVenue: avg(feedback!.map((f) => f.venue_rating)),
        averageOrganization: avg(feedback!.map((f) => f.organization_rating)),
        averageSpeaker: avg(feedback!.map((f) => f.speaker_rating)),
        nps,
      },
    }
  } catch (err) {
    return { success: false, error: (err as Error).message, summary: null }
  }
}

/* ── Admin: Get all individual feedback responses ────────────────────── */

export async function getFeedbackList(eventId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("event_feedback")
      .select("*")
      .eq("event_id", eventId)
      .order("submitted_at", { ascending: false })

    if (error) return { success: false, error: error.message, feedback: [] }

    return { success: true, feedback: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message, feedback: [] }
  }
}

/* ── Admin: Export feedback as CSV ────────────────────────────────────── */

export async function exportFeedbackCSV(eventId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("event_feedback")
      .select("*")
      .eq("event_id", eventId)
      .order("submitted_at", { ascending: false })

    if (error) return { success: false, error: error.message, csv: "" }
    if (!data || data.length === 0) return { success: false, error: "No feedback to export.", csv: "" }

    const headers = [
      "Name", "Email", "Overall", "Content", "Venue", "Organization",
      "Speakers", "Would Recommend", "Best Part", "Improvement",
      "Additional Comments", "Submitted At",
    ]

    const escape = (v: unknown) => {
      const str = String(v ?? "")
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str
    }

    const rows = data.map((f) => [
      escape(f.attendee_name),
      escape(f.attendee_email),
      f.overall_rating ?? "",
      f.content_rating ?? "",
      f.venue_rating ?? "",
      f.organization_rating ?? "",
      f.speaker_rating ?? "",
      f.would_recommend === true ? "Yes" : f.would_recommend === false ? "No" : "",
      escape(f.best_part),
      escape(f.improvement),
      escape(f.additional_comments),
      f.submitted_at ? new Date(f.submitted_at).toLocaleString("en-IN") : "",
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")

    return { success: true, csv }
  } catch (err) {
    return { success: false, error: (err as Error).message, csv: "" }
  }
}

/* ── Admin: Send feedback request emails ─────────────────────────────── */

export async function sendFeedbackRequest(eventId: string, attendeeIds: string[]) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch event details for the link
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("slug, title")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return { success: false, error: "Event not found.", sent: 0 }
    }

    // Fetch attendees
    const { data: attendees, error: attError } = await supabase
      .from("attendees")
      .select("id, name, email")
      .in("id", attendeeIds)

    if (attError || !attendees || attendees.length === 0) {
      return { success: false, error: "No attendees found.", sent: 0 }
    }

    // For now, return the count that would be sent
    // In production, integrate with Resend similar to emailActions.ts
    const feedbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/feedback/${event.slug}`

    return {
      success: true,
      sent: attendees.length,
      feedbackUrl,
      message: `Feedback request prepared for ${attendees.length} attendees. Feedback URL: ${feedbackUrl}`,
    }
  } catch (err) {
    return { success: false, error: (err as Error).message, sent: 0 }
  }
}
