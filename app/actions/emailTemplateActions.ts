"use server"

/**
 * Email Template Server Actions
 *
 * CRUD for email templates with variable rendering and sending.
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

/* ── Resend client ───────────────────────────────────────────────────── */

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[emailTemplateActions] RESEND_API_KEY is not set.")
    return null
  }
  return new Resend(apiKey)
}

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS ||
  "The Leadership Federation <events@theleadershipfederation.com>"

const FALLBACK_FROM = "The Leadership Federation <onboarding@resend.dev>"

/* ── Types ───────────────────────────────────────────────────────────── */

export interface EmailTemplate {
  id: string
  name: string
  slug: string
  subject: string
  body_html: string
  body_text: string | null
  template_type: string
  is_default: boolean
  event_id: string | null
  variables: string[]
  created_at: string
  updated_at: string
}

export interface CreateTemplateData {
  name: string
  slug: string
  subject: string
  body_html: string
  body_text?: string | null
  template_type: string
  event_id?: string | null
  variables?: string[]
}

export interface UpdateTemplateData {
  name?: string
  slug?: string
  subject?: string
  body_html?: string
  body_text?: string | null
  template_type?: string
  event_id?: string | null
  variables?: string[]
}

/* ── List templates ──────────────────────────────────────────────────── */

export async function getEmailTemplates(eventId?: string): Promise<{
  success: boolean
  templates?: EmailTemplate[]
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    let query = supabase
      .from("email_templates")
      .select("*")
      .order("is_default", { ascending: false })
      .order("template_type")
      .order("name")

    if (eventId) {
      // Get global defaults + event-specific templates
      query = supabase
        .from("email_templates")
        .select("*")
        .or(`event_id.is.null,event_id.eq.${eventId}`)
        .order("is_default", { ascending: false })
        .order("template_type")
        .order("name")
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, templates: (data ?? []) as EmailTemplate[] }
  } catch (err) {
    console.error("[emailTemplateActions] getEmailTemplates error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── Get single template ─────────────────────────────────────────────── */

export async function getEmailTemplate(id: string): Promise<{
  success: boolean
  template?: EmailTemplate
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) {
      return { success: false, error: error?.message || "Template not found." }
    }

    return { success: true, template: data as EmailTemplate }
  } catch (err) {
    console.error("[emailTemplateActions] getEmailTemplate error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── Create template ─────────────────────────────────────────────────── */

export async function createEmailTemplate(data: CreateTemplateData): Promise<{
  success: boolean
  template?: EmailTemplate
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: created, error } = await supabase
      .from("email_templates")
      .insert({
        name: data.name,
        slug: data.slug,
        subject: data.subject,
        body_html: data.body_html,
        body_text: data.body_text || null,
        template_type: data.template_type,
        is_default: false,
        event_id: data.event_id || null,
        variables: data.variables || [],
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, template: created as EmailTemplate }
  } catch (err) {
    console.error("[emailTemplateActions] createEmailTemplate error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── Update template ─────────────────────────────────────────────────── */

export async function updateEmailTemplate(
  id: string,
  data: UpdateTemplateData
): Promise<{
  success: boolean
  template?: EmailTemplate
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const updateObj: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (data.name !== undefined) updateObj.name = data.name
    if (data.slug !== undefined) updateObj.slug = data.slug
    if (data.subject !== undefined) updateObj.subject = data.subject
    if (data.body_html !== undefined) updateObj.body_html = data.body_html
    if (data.body_text !== undefined) updateObj.body_text = data.body_text
    if (data.template_type !== undefined) updateObj.template_type = data.template_type
    if (data.event_id !== undefined) updateObj.event_id = data.event_id || null
    if (data.variables !== undefined) updateObj.variables = data.variables

    const { data: updated, error } = await supabase
      .from("email_templates")
      .update(updateObj)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, template: updated as EmailTemplate }
  } catch (err) {
    console.error("[emailTemplateActions] updateEmailTemplate error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── Delete template (not default) ───────────────────────────────────── */

export async function deleteEmailTemplate(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Check if it's a default template
    const { data: tmpl } = await supabase
      .from("email_templates")
      .select("is_default")
      .eq("id", id)
      .single()

    if (tmpl?.is_default) {
      return { success: false, error: "Cannot delete default system templates." }
    }

    const { error } = await supabase
      .from("email_templates")
      .delete()
      .eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error("[emailTemplateActions] deleteEmailTemplate error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── Render template with variables ──────────────────────────────────── */

export async function renderTemplate(
  templateId: string,
  variables: Record<string, string>
): Promise<{
  success: boolean
  html?: string
  subject?: string
  error?: string
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: tmpl, error } = await supabase
      .from("email_templates")
      .select("subject, body_html")
      .eq("id", templateId)
      .single()

    if (error || !tmpl) {
      return { success: false, error: error?.message || "Template not found." }
    }

    let html = tmpl.body_html
    let subject = tmpl.subject

    // Replace all {{variable}} placeholders
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g")
      html = html.replace(pattern, value)
      subject = subject.replace(pattern, value)
    }

    return { success: true, html, subject }
  } catch (err) {
    console.error("[emailTemplateActions] renderTemplate error:", err)
    return { success: false, error: (err as Error).message }
  }
}

/* ── Send templated email to attendees ───────────────────────────────── */

export async function sendTemplatedEmail(
  templateId: string,
  attendeeIds: string[]
): Promise<{
  success: boolean
  sent: number
  failed: number
  errors: string[]
}> {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch template
    const { data: tmpl, error: tmplError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("id", templateId)
      .single()

    if (tmplError || !tmpl) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: [tmplError?.message || "Template not found."],
      }
    }

    const resend = getResendClient()
    if (!resend) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: ["Email service is not configured. Set RESEND_API_KEY environment variable."],
      }
    }

    // Fetch attendees with event/ticket data
    const { data: attendees, error: attError } = await supabase
      .from("attendees")
      .select(`
        id, name, email, qr_token,
        events ( title, start_date, venue ),
        tickets ( name )
      `)
      .in("id", attendeeIds)

    if (attError || !attendees) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        errors: [attError?.message || "Failed to fetch attendees."],
      }
    }

    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const attendee of attendees) {
      if (!attendee.email) {
        failed++
        errors.push(`${attendee.name}: No email address`)
        continue
      }

      const event = attendee.events as unknown as {
        title: string; start_date: string; venue: string
      } | null
      const ticket = attendee.tickets as unknown as { name: string } | null

      // Build variables
      const vars: Record<string, string> = {
        attendee_name: attendee.name,
        event_title: event?.title ?? "",
        event_date: event?.start_date
          ? new Date(event.start_date).toLocaleDateString("en-IN", {
              day: "numeric", month: "long", year: "numeric",
            })
          : "",
        event_venue: event?.venue ?? "",
        ticket_name: ticket?.name ?? "",
        qr_token: attendee.qr_token ?? "",
      }

      // Render
      let html = tmpl.body_html
      let subject = tmpl.subject
      for (const [key, value] of Object.entries(vars)) {
        const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g")
        html = html.replace(pattern, value)
        subject = subject.replace(pattern, value)
      }

      // Send
      const { error: emailError } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: [attendee.email],
        subject,
        html,
      })

      if (emailError) {
        // Retry with fallback
        const { error: retryError } = await resend.emails.send({
          from: FALLBACK_FROM,
          to: [attendee.email],
          subject,
          html,
        })

        if (retryError) {
          failed++
          errors.push(`${attendee.name} (${attendee.email}): ${retryError.message}`)
          continue
        }
      }

      sent++

      // Rate limit courtesy
      if (attendees.length > 5) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    return { success: failed === 0, sent, failed, errors }
  } catch (err) {
    console.error("[emailTemplateActions] sendTemplatedEmail error:", err)
    return { success: false, sent: 0, failed: 0, errors: [(err as Error).message] }
  }
}
