"use server"

/**
 * ─── CAMPAIGN SERVER ACTIONS ─────────────────────────────────────────────
 *
 * Bulk email campaign system with audience segmentation and tracking.
 * Uses the same Resend pattern as emailActions.ts / emailTemplateActions.ts.
 */

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { Resend } from "resend"

/* ── Auth helper ─────────────────────────────────────────────────────── */

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

/* ── Resend client (lazy, null-safe) ─────────────────────────────────── */

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn(
      "[campaignActions] RESEND_API_KEY is not set. Emails will not be sent."
    )
    return null
  }
  return new Resend(apiKey)
}

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS ||
  "The Leadership Federation <events@theleadershipfederation.com>"

const FALLBACK_FROM = "The Leadership Federation <onboarding@resend.dev>"

/* ── Types ───────────────────────────────────────────────────────────── */

export interface Campaign {
  id: string
  name: string
  subject: string
  body_html: string
  event_id: string | null
  template_id: string | null
  status: string
  segment: string
  custom_filter: Record<string, unknown>
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number
  sent_count: number
  opened_count: number
  clicked_count: number
  failed_count: number
  created_by: string | null
  created_at: string
  updated_at: string
  events?: { title: string } | null
}

export interface CampaignRecipient {
  id: string
  campaign_id: string
  attendee_id: string
  email: string
  status: string
  sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
  error_message: string | null
  attendees?: { name: string; email: string } | null
}

export interface CreateCampaignData {
  name: string
  subject: string
  body_html: string
  event_id?: string | null
  template_id?: string | null
  segment?: string
  scheduled_at?: string | null
}

/* ── getCampaigns ────────────────────────────────────────────────────── */

export async function getCampaigns(eventId?: string): Promise<{
  success: boolean
  campaigns?: Campaign[]
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    let query = supabase
      .from("email_campaigns")
      .select("*, events(title)")
      .order("created_at", { ascending: false })

    if (eventId) {
      query = query.eq("event_id", eventId)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, campaigns: (data ?? []) as Campaign[] }
  } catch (err) {
    console.error("[campaignActions] getCampaigns error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── getCampaign ─────────────────────────────────────────────────────── */

export async function getCampaign(id: string): Promise<{
  success: boolean
  campaign?: Campaign
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("email_campaigns")
      .select("*, events(title)")
      .eq("id", id)
      .single()

    if (error || !data) {
      return { success: false, error: error?.message || "Campaign not found." }
    }

    return { success: true, campaign: data as Campaign }
  } catch (err) {
    console.error("[campaignActions] getCampaign error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── createCampaign ──────────────────────────────────────────────────── */

export async function createCampaign(data: CreateCampaignData): Promise<{
  success: boolean
  campaign?: Campaign
  error?: string
}> {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    const { data: created, error } = await supabase
      .from("email_campaigns")
      .insert({
        name: data.name,
        subject: data.subject,
        body_html: data.body_html,
        event_id: data.event_id || null,
        template_id: data.template_id || null,
        segment: data.segment || "all",
        scheduled_at: data.scheduled_at || null,
        status: data.scheduled_at ? "scheduled" : "draft",
        created_by: user.id,
      })
      .select("*, events(title)")
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, campaign: created as Campaign }
  } catch (err) {
    console.error("[campaignActions] createCampaign error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── updateCampaign ──────────────────────────────────────────────────── */

export async function updateCampaign(
  id: string,
  data: Partial<CreateCampaignData>
): Promise<{
  success: boolean
  campaign?: Campaign
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Only allow updating draft campaigns
    const { data: existing } = await supabase
      .from("email_campaigns")
      .select("status")
      .eq("id", id)
      .single()

    if (existing?.status !== "draft" && existing?.status !== "scheduled") {
      return { success: false, error: "Can only edit draft or scheduled campaigns." }
    }

    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (data.name !== undefined) updateObj.name = data.name
    if (data.subject !== undefined) updateObj.subject = data.subject
    if (data.body_html !== undefined) updateObj.body_html = data.body_html
    if (data.event_id !== undefined) updateObj.event_id = data.event_id || null
    if (data.template_id !== undefined) updateObj.template_id = data.template_id || null
    if (data.segment !== undefined) updateObj.segment = data.segment
    if (data.scheduled_at !== undefined) {
      updateObj.scheduled_at = data.scheduled_at || null
      updateObj.status = data.scheduled_at ? "scheduled" : "draft"
    }

    const { data: updated, error } = await supabase
      .from("email_campaigns")
      .update(updateObj)
      .eq("id", id)
      .select("*, events(title)")
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, campaign: updated as Campaign }
  } catch (err) {
    console.error("[campaignActions] updateCampaign error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── deleteCampaign (draft only) ─────────────────────────────────────── */

export async function deleteCampaign(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Only allow deleting draft campaigns
    const { data: existing } = await supabase
      .from("email_campaigns")
      .select("status")
      .eq("id", id)
      .single()

    if (existing?.status !== "draft") {
      return { success: false, error: "Can only delete draft campaigns." }
    }

    const { error } = await supabase
      .from("email_campaigns")
      .delete()
      .eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error("[campaignActions] deleteCampaign error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── getSegmentCount ─────────────────────────────────────────────────── */

export async function getSegmentCount(
  eventId: string,
  segment: string
): Promise<{
  success: boolean
  count?: number
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    let query = supabase
      .from("attendees")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)

    switch (segment) {
      case "all":
        // All attendees for this event (with email)
        query = query.not("email", "is", null)
        break
      case "registered":
        query = query.in("status", ["registered", "confirmed"])
        break
      case "checked_in":
        query = query.eq("status", "checked_in")
        break
      case "waitlisted":
        query = query.eq("status", "waitlisted")
        break
      case "vip":
        query = query.not("vip_level", "is", null).neq("vip_level", "")
        break
      case "not_checked_in":
        query = query.in("status", ["registered", "confirmed"]).is("check_in_at", null)
        break
      default:
        query = query.not("email", "is", null)
    }

    const { count, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, count: count ?? 0 }
  } catch (err) {
    console.error("[campaignActions] getSegmentCount error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── sendCampaign ────────────────────────────────────────────────────── */

export async function sendCampaign(campaignId: string): Promise<{
  success: boolean
  sent: number
  failed: number
  errors: string[]
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // 1. Fetch campaign
    const { data: campaign, error: campError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single()

    if (campError || !campaign) {
      return {
        success: false, sent: 0, failed: 0,
        errors: [campError?.message || "Campaign not found."],
      }
    }

    if (campaign.status === "sent" || campaign.status === "sending") {
      return {
        success: false, sent: 0, failed: 0,
        errors: ["Campaign has already been sent or is currently sending."],
      }
    }

    // Mark as sending
    await supabase
      .from("email_campaigns")
      .update({ status: "sending", updated_at: new Date().toISOString() })
      .eq("id", campaignId)

    // 2. Fetch matching attendees based on segment
    let attendeeQuery = supabase
      .from("attendees")
      .select("id, name, email, event_id, events(title, start_date, venue)")
      .eq("event_id", campaign.event_id)
      .not("email", "is", null)

    switch (campaign.segment) {
      case "registered":
        attendeeQuery = attendeeQuery.in("status", ["registered", "confirmed"])
        break
      case "checked_in":
        attendeeQuery = attendeeQuery.eq("status", "checked_in")
        break
      case "waitlisted":
        attendeeQuery = attendeeQuery.eq("status", "waitlisted")
        break
      case "vip":
        attendeeQuery = attendeeQuery.not("vip_level", "is", null).neq("vip_level", "")
        break
      case "not_checked_in":
        attendeeQuery = attendeeQuery.in("status", ["registered", "confirmed"]).is("check_in_at", null)
        break
      // "all" — no additional filter
    }

    const { data: attendees, error: attError } = await attendeeQuery

    if (attError || !attendees) {
      await supabase
        .from("email_campaigns")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", campaignId)
      return {
        success: false, sent: 0, failed: 0,
        errors: [attError?.message || "Failed to fetch attendees."],
      }
    }

    // 3. Create recipient entries
    const recipientRows = attendees
      .filter((a) => a.email)
      .map((a) => ({
        campaign_id: campaignId,
        attendee_id: a.id,
        email: a.email!,
        status: "pending",
      }))

    if (recipientRows.length === 0) {
      await supabase
        .from("email_campaigns")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          total_recipients: 0,
          sent_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId)
      return { success: true, sent: 0, failed: 0, errors: [] }
    }

    // Insert recipients (ignore conflicts for re-runs)
    await supabase
      .from("email_campaign_recipients")
      .upsert(recipientRows, { onConflict: "campaign_id,attendee_id" })

    // Update total count
    await supabase
      .from("email_campaigns")
      .update({ total_recipients: recipientRows.length })
      .eq("id", campaignId)

    // 4. Send emails via Resend
    const resend = getResendClient()
    if (!resend) {
      await supabase
        .from("email_campaigns")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", campaignId)
      return {
        success: false, sent: 0, failed: 0,
        errors: ["Email service is not configured. Set RESEND_API_KEY environment variable."],
      }
    }

    const siteHost = process.env.NEXT_PUBLIC_SITE_URL || "https://theleadershipfederation.com"

    let sentCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (const attendee of attendees) {
      if (!attendee.email) continue

      const event = attendee.events as unknown as {
        title: string; start_date: string; venue: string
      } | null

      // Look up the recipient row id for tracking
      const { data: recipientRow } = await supabase
        .from("email_campaign_recipients")
        .select("id")
        .eq("campaign_id", campaignId)
        .eq("attendee_id", attendee.id)
        .single()

      const recipientId = recipientRow?.id ?? ""

      // Replace variables in subject and body
      const vars: Record<string, string> = {
        attendee_name: attendee.name,
        event_title: event?.title ?? "",
        event_date: event?.start_date
          ? new Date(event.start_date).toLocaleDateString("en-IN", {
              day: "numeric", month: "long", year: "numeric",
            })
          : "",
        event_venue: event?.venue ?? "",
      }

      let html = campaign.body_html
      let subject = campaign.subject
      for (const [key, value] of Object.entries(vars)) {
        const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g")
        html = html.replace(pattern, value)
        subject = subject.replace(pattern, value)
      }

      // Inject click tracking: wrap all <a href="..."> links
      if (recipientId) {
        html = html.replace(
          /href="(https?:\/\/[^"]+)"/gi,
          (_match: string, originalUrl: string) => {
            const encodedUrl = encodeURIComponent(originalUrl)
            return `href="${siteHost}/api/track/click/${campaignId}/${recipientId}?url=${encodedUrl}"`
          }
        )

        // Append invisible open tracking pixel at the end of the body
        const trackingPixel = `<img src="${siteHost}/api/track/open/${campaignId}/${recipientId}" width="1" height="1" style="display:none" />`
        if (html.includes("</body>")) {
          html = html.replace("</body>", `${trackingPixel}</body>`)
        } else {
          html += trackingPixel
        }
      }

      // Send via Resend (with fallback, same pattern as emailActions.ts)
      let emailFailed = false
      let errorMsg = ""

      const { error: emailError } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: [attendee.email],
        subject,
        html,
      })

      if (emailError) {
        // Retry with fallback from address
        const { error: retryError } = await resend.emails.send({
          from: FALLBACK_FROM,
          to: [attendee.email],
          subject,
          html,
        })

        if (retryError) {
          emailFailed = true
          errorMsg = retryError.message
        }
      }

      // 5. Update recipient status
      const now = new Date().toISOString()
      if (emailFailed) {
        failedCount++
        errors.push(`${attendee.name} (${attendee.email}): ${errorMsg}`)
        await supabase
          .from("email_campaign_recipients")
          .update({ status: "failed", error_message: errorMsg })
          .eq("campaign_id", campaignId)
          .eq("attendee_id", attendee.id)
      } else {
        sentCount++
        await supabase
          .from("email_campaign_recipients")
          .update({ status: "sent", sent_at: now })
          .eq("campaign_id", campaignId)
          .eq("attendee_id", attendee.id)
      }

      // Rate limit courtesy
      if (attendees.length > 5) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    // 6. Update campaign totals
    await supabase
      .from("email_campaigns")
      .update({
        status: failedCount === recipientRows.length ? "failed" : "sent",
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
        failed_count: failedCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId)

    return { success: failedCount === 0, sent: sentCount, failed: failedCount, errors }
  } catch (err) {
    console.error("[campaignActions] sendCampaign error:", err)
    return { success: false, sent: 0, failed: 0, errors: [(err as Error).message] }
  }
}

/* ── getCampaignStats ────────────────────────────────────────────────── */

export async function getCampaignStats(campaignId: string): Promise<{
  success: boolean
  stats?: {
    total: number
    sent: number
    opened: number
    clicked: number
    failed: number
    bounced: number
  }
  recipients?: CampaignRecipient[]
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch all recipients with attendee info
    const { data: recipients, error } = await supabase
      .from("email_campaign_recipients")
      .select("*, attendees(name, email)")
      .eq("campaign_id", campaignId)
      .order("sent_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    const recs = (recipients ?? []) as CampaignRecipient[]

    const stats = {
      total: recs.length,
      sent: recs.filter((r) => r.status === "sent" || r.status === "opened" || r.status === "clicked").length,
      opened: recs.filter((r) => r.status === "opened" || r.status === "clicked").length,
      clicked: recs.filter((r) => r.status === "clicked").length,
      failed: recs.filter((r) => r.status === "failed").length,
      bounced: recs.filter((r) => r.status === "bounced").length,
    }

    return { success: true, stats, recipients: recs }
  } catch (err) {
    console.error("[campaignActions] getCampaignStats error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── duplicateCampaign ───────────────────────────────────────────────── */

export async function duplicateCampaign(campaignId: string): Promise<{
  success: boolean
  campaign?: Campaign
  error?: string
}> {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    const { data: original, error: fetchError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single()

    if (fetchError || !original) {
      return { success: false, error: fetchError?.message || "Campaign not found." }
    }

    const { data: clone, error: insertError } = await supabase
      .from("email_campaigns")
      .insert({
        name: `${original.name} (Copy)`,
        subject: original.subject,
        body_html: original.body_html,
        event_id: original.event_id,
        template_id: original.template_id,
        segment: original.segment,
        custom_filter: original.custom_filter,
        status: "draft",
        created_by: user.id,
      })
      .select("*, events(title)")
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    return { success: true, campaign: clone as Campaign }
  } catch (err) {
    console.error("[campaignActions] duplicateCampaign error:", err)
    return { success: false, error: (err as Error).message }
  }
}
