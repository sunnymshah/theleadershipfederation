"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

/* ── Helpers ─────────────────────────────────────────────────────────────── */

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

/** Get a Supabase client without requiring Supabase Auth (for sponsor portal). */
async function getClient() {
  const cookieStore = await cookies()
  return createClient(cookieStore)
}

/* ── Capture Lead (manual entry) ─────────────────────────────────────────── */

export async function captureLead(data: {
  sponsorId: string
  eventId: string
  attendeeId?: string
  name: string
  email?: string
  phone?: string
  company?: string
  designation?: string
  notes?: string
  interestLevel?: string
  capturedVia?: string
}) {
  try {
    const supabase = await getClient()

    if (!data.sponsorId || !data.eventId || !data.name) {
      return { success: false, error: "Sponsor, event, and lead name are required." }
    }

    const { data: lead, error } = await supabase
      .from("sponsor_leads")
      .insert({
        sponsor_id: data.sponsorId,
        event_id: data.eventId,
        attendee_id: data.attendeeId || null,
        lead_name: data.name,
        lead_email: data.email?.toLowerCase().trim() || null,
        lead_phone: data.phone || null,
        lead_company: data.company || null,
        lead_designation: data.designation || null,
        notes: data.notes || null,
        interest_level: data.interestLevel || "medium",
        captured_via: data.capturedVia || "manual",
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "This lead has already been captured." }
      }
      return { success: false, error: error.message }
    }

    return { success: true, lead }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Capture Lead from QR Scan ───────────────────────────────────────────── */

export async function captureLeadFromQr(sponsorId: string, eventId: string, qrToken: string) {
  try {
    const supabase = await getClient()

    if (!qrToken) {
      return { success: false, error: "QR token is required.", attendee: null }
    }

    // Look up attendee by qr_token
    const { data: attendee, error: lookupError } = await supabase
      .from("attendees")
      .select("id, name, email, company, designation, phone, event_id")
      .eq("qr_token", qrToken.trim())
      .single()

    if (lookupError || !attendee) {
      return { success: false, error: "No attendee found with this badge/QR code.", attendee: null }
    }

    return {
      success: true,
      attendee: {
        id: attendee.id,
        name: attendee.name,
        email: attendee.email,
        company: attendee.company,
        designation: attendee.designation,
        phone: attendee.phone,
        eventId: attendee.event_id,
      },
      error: null,
    }
  } catch (err) {
    return { success: false, error: (err as Error).message, attendee: null }
  }
}

/* ── Get Leads ───────────────────────────────────────────────────────────── */

export async function getLeads(sponsorId: string, eventId?: string) {
  try {
    const supabase = await getClient()

    let query = supabase
      .from("sponsor_leads")
      .select("*")
      .eq("sponsor_id", sponsorId)
      .order("captured_at", { ascending: false })

    if (eventId) {
      query = query.eq("event_id", eventId)
    }

    const { data, error } = await query

    if (error) return { success: false, error: error.message, leads: [] }

    return { success: true, leads: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message, leads: [] }
  }
}

/* ── Get All Leads (admin) ───────────────────────────────────────────────── */

export async function getAllLeads(eventId?: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    let query = supabase
      .from("sponsor_leads")
      .select("*, sponsors(name, tier, logo_url)")
      .order("captured_at", { ascending: false })

    if (eventId) {
      query = query.eq("event_id", eventId)
    }

    const { data, error } = await query

    if (error) return { success: false, error: error.message, leads: [] }

    return { success: true, leads: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message, leads: [] }
  }
}

/* ── Update Lead ─────────────────────────────────────────────────────────── */

export async function updateLead(
  leadId: string,
  data: {
    notes?: string
    interestLevel?: string
    followUpStatus?: string
    followUpNotes?: string
  }
) {
  try {
    const supabase = await getClient()

    const updatePayload: Record<string, unknown> = {}
    if (data.notes !== undefined) updatePayload.notes = data.notes
    if (data.interestLevel !== undefined) updatePayload.interest_level = data.interestLevel
    if (data.followUpStatus !== undefined) updatePayload.follow_up_status = data.followUpStatus
    if (data.followUpNotes !== undefined) updatePayload.follow_up_notes = data.followUpNotes

    const { data: lead, error } = await supabase
      .from("sponsor_leads")
      .update(updatePayload)
      .eq("id", leadId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    return { success: true, lead }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Delete Lead ─────────────────────────────────────────────────────────── */

export async function deleteLead(leadId: string) {
  try {
    const supabase = await getClient()

    const { error } = await supabase
      .from("sponsor_leads")
      .delete()
      .eq("id", leadId)

    if (error) return { success: false, error: error.message }

    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Export Leads CSV ────────────────────────────────────────────────────── */

export async function exportLeadsCSV(sponsorId: string, eventId: string) {
  try {
    const supabase = await getClient()

    const { data, error } = await supabase
      .from("sponsor_leads")
      .select("*")
      .eq("sponsor_id", sponsorId)
      .eq("event_id", eventId)
      .order("captured_at", { ascending: false })

    if (error) return { success: false, error: error.message, csv: "" }
    if (!data || data.length === 0) return { success: false, error: "No leads to export.", csv: "" }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Company",
      "Designation",
      "Interest Level",
      "Notes",
      "Captured Via",
      "Follow-up Status",
      "Follow-up Notes",
      "Captured At",
    ]

    const rows = data.map((lead) => [
      lead.lead_name ?? "",
      lead.lead_email ?? "",
      lead.lead_phone ?? "",
      lead.lead_company ?? "",
      lead.lead_designation ?? "",
      lead.interest_level ?? "",
      (lead.notes ?? "").replace(/"/g, '""'),
      lead.captured_via ?? "",
      lead.follow_up_status ?? "",
      (lead.follow_up_notes ?? "").replace(/"/g, '""'),
      lead.captured_at ? new Date(lead.captured_at).toLocaleString("en-IN") : "",
    ])

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    return { success: true, csv }
  } catch (err) {
    return { success: false, error: (err as Error).message, csv: "" }
  }
}

/* ── Export All Leads CSV (admin) ────────────────────────────────────────── */

export async function exportAllLeadsCSV(eventId?: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    let query = supabase
      .from("sponsor_leads")
      .select("*, sponsors(name)")
      .order("captured_at", { ascending: false })

    if (eventId) {
      query = query.eq("event_id", eventId)
    }

    const { data, error } = await query

    if (error) return { success: false, error: error.message, csv: "" }
    if (!data || data.length === 0) return { success: false, error: "No leads to export.", csv: "" }

    const headers = [
      "Sponsor",
      "Name",
      "Email",
      "Phone",
      "Company",
      "Designation",
      "Interest Level",
      "Notes",
      "Captured Via",
      "Follow-up Status",
      "Follow-up Notes",
      "Captured At",
    ]

    const rows = data.map((lead: Record<string, unknown>) => {
      const sponsors = lead.sponsors as { name: string } | null
      return [
        sponsors?.name ?? "",
        (lead.lead_name as string) ?? "",
        (lead.lead_email as string) ?? "",
        (lead.lead_phone as string) ?? "",
        (lead.lead_company as string) ?? "",
        (lead.lead_designation as string) ?? "",
        (lead.interest_level as string) ?? "",
        ((lead.notes as string) ?? "").replace(/"/g, '""'),
        (lead.captured_via as string) ?? "",
        (lead.follow_up_status as string) ?? "",
        ((lead.follow_up_notes as string) ?? "").replace(/"/g, '""'),
        lead.captured_at ? new Date(lead.captured_at as string).toLocaleString("en-IN") : "",
      ]
    })

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    return { success: true, csv }
  } catch (err) {
    return { success: false, error: (err as Error).message, csv: "" }
  }
}

/* ── Lead Stats ──────────────────────────────────────────────────────────── */

export async function getLeadStats(sponsorId: string, eventId: string) {
  try {
    const supabase = await getClient()

    const { data, error } = await supabase
      .from("sponsor_leads")
      .select("interest_level, follow_up_status")
      .eq("sponsor_id", sponsorId)
      .eq("event_id", eventId)

    if (error) return { success: false, error: error.message, stats: null }
    if (!data) return { success: true, stats: { total: 0, byInterest: {}, byStatus: {} } }

    const byInterest: Record<string, number> = { hot: 0, warm: 0, medium: 0, cold: 0 }
    const byStatus: Record<string, number> = {
      pending: 0,
      contacted: 0,
      meeting_set: 0,
      closed: 0,
      not_interested: 0,
    }

    for (const row of data) {
      if (row.interest_level && byInterest[row.interest_level] !== undefined) {
        byInterest[row.interest_level]++
      }
      if (row.follow_up_status && byStatus[row.follow_up_status] !== undefined) {
        byStatus[row.follow_up_status]++
      }
    }

    return {
      success: true,
      stats: {
        total: data.length,
        byInterest,
        byStatus,
      },
    }
  } catch (err) {
    return { success: false, error: (err as Error).message, stats: null }
  }
}

/* ── Admin: Get lead counts per sponsor ──────────────────────────────────── */

export async function getLeadCountsBySponsor() {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("sponsor_leads")
      .select("sponsor_id, id")

    if (error) return { success: false, error: error.message, counts: {} }

    const counts: Record<string, number> = {}
    for (const row of data ?? []) {
      counts[row.sponsor_id] = (counts[row.sponsor_id] || 0) + 1
    }

    return { success: true, counts }
  } catch (err) {
    return { success: false, error: (err as Error).message, counts: {} }
  }
}

/* ── Admin: Get all lead stats ───────────────────────────────────────────── */

export async function getAllLeadStats(eventId?: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    let query = supabase
      .from("sponsor_leads")
      .select("interest_level, follow_up_status, captured_via")

    if (eventId) {
      query = query.eq("event_id", eventId)
    }

    const { data, error } = await query

    if (error) return { success: false, error: error.message, stats: null }
    if (!data) return { success: true, stats: { total: 0, byInterest: {}, byStatus: {}, byCapturedVia: {} } }

    const byInterest: Record<string, number> = { hot: 0, warm: 0, medium: 0, cold: 0 }
    const byStatus: Record<string, number> = {
      pending: 0,
      contacted: 0,
      meeting_set: 0,
      closed: 0,
      not_interested: 0,
    }
    const byCapturedVia: Record<string, number> = { qr_scan: 0, manual: 0, badge_scan: 0 }

    for (const row of data) {
      if (row.interest_level && byInterest[row.interest_level] !== undefined) {
        byInterest[row.interest_level]++
      }
      if (row.follow_up_status && byStatus[row.follow_up_status] !== undefined) {
        byStatus[row.follow_up_status]++
      }
      if (row.captured_via && byCapturedVia[row.captured_via] !== undefined) {
        byCapturedVia[row.captured_via]++
      }
    }

    return {
      success: true,
      stats: {
        total: data.length,
        byInterest,
        byStatus,
        byCapturedVia,
      },
    }
  } catch (err) {
    return { success: false, error: (err as Error).message, stats: null }
  }
}
