"use server"

/**
 * ─── MULTI-EVENT / TEMPLATE SERVER ACTIONS ───────────────────────────────
 *
 * Clone events as reusable templates, create new events from templates,
 * track event series lineage, cross-event attendee analytics, and a
 * unified calendar view.
 */

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

/* ── Auth helper ──────────────────────────────────────────────────────── */

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

function invalidateCaches() {
  revalidatePath("/admin/events", "page")
  revalidatePath("/admin/templates", "page")
  revalidatePath("/admin", "page")
  revalidatePath("/events", "page")
  revalidatePath("/", "layout")
}

/* ── 1. Save Event as Template ────────────────────────────────────────── */

export async function saveAsTemplate(eventId: string, templateName: string) {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    if (!eventId || !templateName) {
      return { success: false, error: "Event ID and template name are required." }
    }

    // Fetch source event
    const { data: source, error: fetchErr } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()

    if (fetchErr || !source) {
      return { success: false, error: fetchErr?.message ?? "Event not found." }
    }

    // Clone event as template
    const {
      id: _id,
      created_at: _ca,
      updated_at: _ua,
      slug: originalSlug,
      ...rest
    } = source

    const templateSlug = `template-${originalSlug}-${Date.now()}`

    const { data: template, error: insertErr } = await supabase
      .from("events")
      .insert({
        ...rest,
        slug: templateSlug,
        is_template: true,
        template_name: templateName,
        status: "draft",
        created_by: user.id,
      })
      .select()
      .single()

    if (insertErr) return { success: false, error: insertErr.message }

    const templateId = template.id

    // Clone tickets
    const { data: tickets } = await supabase
      .from("tickets")
      .select("*")
      .eq("event_id", eventId)

    if (tickets?.length) {
      const clonedTickets = tickets.map(({ id: _tid, created_at: _tca, event_id: _eid, ...t }) => ({
        ...t,
        event_id: templateId,
      }))
      await supabase.from("tickets").insert(clonedTickets)
    }

    // Clone sessions
    const { data: sessions } = await supabase
      .from("sessions")
      .select("*")
      .eq("event_id", eventId)

    if (sessions?.length) {
      const clonedSessions = sessions.map(({ id: _sid, created_at: _sca, event_id: _eid, ...s }) => ({
        ...s,
        event_id: templateId,
      }))
      await supabase.from("sessions").insert(clonedSessions)
    }

    // Clone custom fields
    const { data: fields } = await supabase
      .from("custom_fields")
      .select("*")
      .eq("event_id", eventId)

    if (fields?.length) {
      const clonedFields = fields.map(({ id: _fid, created_at: _fca, event_id: _eid, ...f }) => ({
        ...f,
        event_id: templateId,
      }))
      await supabase.from("custom_fields").insert(clonedFields)
    }

    invalidateCaches()
    return { success: true, template }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 2. Create Event from Template ────────────────────────────────────── */

export async function createFromTemplate(
  templateId: string,
  overrides: { title: string; start_date: string; end_date: string; venue: string }
) {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    if (!templateId || !overrides.title || !overrides.start_date || !overrides.end_date || !overrides.venue) {
      return { success: false, error: "Template ID and all override fields (title, start_date, end_date, venue) are required." }
    }

    // Fetch template event
    const { data: source, error: fetchErr } = await supabase
      .from("events")
      .select("*")
      .eq("id", templateId)
      .eq("is_template", true)
      .single()

    if (fetchErr || !source) {
      return { success: false, error: fetchErr?.message ?? "Template not found." }
    }

    // Build new event from template, applying overrides
    const {
      id: _id,
      created_at: _ca,
      updated_at: _ua,
      slug: _slug,
      is_template: _it,
      template_name: _tn,
      cloned_from: _cf,
      title: _title,
      start_date: _sd,
      end_date: _ed,
      venue: _venue,
      ...rest
    } = source

    const newSlug = overrides.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      + `-${Date.now()}`

    const { data: newEvent, error: insertErr } = await supabase
      .from("events")
      .insert({
        ...rest,
        title: overrides.title,
        slug: newSlug,
        start_date: new Date(overrides.start_date).toISOString(),
        end_date: new Date(overrides.end_date).toISOString(),
        venue: overrides.venue,
        is_template: false,
        template_name: null,
        cloned_from: templateId,
        status: "draft",
        created_by: user.id,
      })
      .select()
      .single()

    if (insertErr) return { success: false, error: insertErr.message }

    const newEventId = newEvent.id

    // Clone tickets
    const { data: tickets } = await supabase
      .from("tickets")
      .select("*")
      .eq("event_id", templateId)

    if (tickets?.length) {
      const cloned = tickets.map(({ id: _tid, created_at: _tca, event_id: _eid, ...t }) => ({
        ...t,
        event_id: newEventId,
      }))
      await supabase.from("tickets").insert(cloned)
    }

    // Clone sessions
    const { data: sessions } = await supabase
      .from("sessions")
      .select("*")
      .eq("event_id", templateId)

    if (sessions?.length) {
      const cloned = sessions.map(({ id: _sid, created_at: _sca, event_id: _eid, ...s }) => ({
        ...s,
        event_id: newEventId,
      }))
      await supabase.from("sessions").insert(cloned)
    }

    // Clone custom fields
    const { data: fields } = await supabase
      .from("custom_fields")
      .select("*")
      .eq("event_id", templateId)

    if (fields?.length) {
      const cloned = fields.map(({ id: _fid, created_at: _fca, event_id: _eid, ...f }) => ({
        ...f,
        event_id: newEventId,
      }))
      await supabase.from("custom_fields").insert(cloned)
    }

    // Clone email automations
    const { data: automations } = await supabase
      .from("email_automations")
      .select("*")
      .eq("event_id", templateId)

    if (automations?.length) {
      const cloned = automations.map(({
        id: _aid, created_at: _aca, updated_at: _aua, event_id: _eid,
        sent_count: _sc, last_triggered_at: _lt, ...a
      }) => ({
        ...a,
        event_id: newEventId,
        sent_count: 0,
        last_triggered_at: null,
      }))
      await supabase.from("email_automations").insert(cloned)
    }

    // Clone sponsor packages
    const { data: packages } = await supabase
      .from("sponsor_packages")
      .select("*")
      .eq("event_id", templateId)

    if (packages?.length) {
      const cloned = packages.map(({ id: _pid, created_at: _pca, event_id: _eid, ...p }) => ({
        ...p,
        event_id: newEventId,
      }))
      await supabase.from("sponsor_packages").insert(cloned)
    }

    invalidateCaches()
    return { success: true, event: newEvent }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 3. List Templates ────────────────────────────────────────────────── */

export async function getTemplates() {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("events")
      .select("id, title, template_name, slug, venue, description, cover_image_url, created_at")
      .eq("is_template", true)
      .order("created_at", { ascending: false })

    if (error) return { success: false, error: error.message, templates: [] }
    return { success: true, templates: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message, templates: [] }
  }
}

/* ── 4. Delete Template ───────────────────────────────────────────────── */

export async function deleteTemplate(templateId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    if (!templateId) return { success: false, error: "Template ID is required." }

    // Verify it is a template
    const { data: existing } = await supabase
      .from("events")
      .select("id, is_template")
      .eq("id", templateId)
      .single()

    if (!existing) return { success: false, error: "Template not found." }
    if (!existing.is_template) return { success: false, error: "Event is not a template." }

    // Delete cascades tickets, sessions, custom_fields, etc. via FK
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", templateId)

    if (error) return { success: false, error: error.message }

    invalidateCaches()
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 5. Get Event Series ──────────────────────────────────────────────── */

export async function getEventSeries(eventId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    if (!eventId) return { success: false, error: "Event ID is required.", series: [] }

    // Fetch the target event to find its cloned_from ancestor
    const { data: event } = await supabase
      .from("events")
      .select("id, cloned_from")
      .eq("id", eventId)
      .single()

    if (!event) return { success: false, error: "Event not found.", series: [] }

    // The common ancestor is either the event's cloned_from, or the event itself
    // if other events were cloned from it
    const ancestorId = event.cloned_from || eventId

    // Find all events that share this ancestor OR are the ancestor itself
    const { data: fromAncestor, error: err1 } = await supabase
      .from("events")
      .select("id, title, slug, start_date, end_date, venue, status, cloned_from, is_template, created_at")
      .eq("cloned_from", ancestorId)
      .eq("is_template", false)
      .order("start_date", { ascending: true })

    if (err1) return { success: false, error: err1.message, series: [] }

    // Also fetch the ancestor event itself
    const { data: ancestor } = await supabase
      .from("events")
      .select("id, title, slug, start_date, end_date, venue, status, cloned_from, is_template, created_at")
      .eq("id", ancestorId)
      .single()

    // If the queried event itself is a descendant, also find siblings
    // (events that share the same cloned_from)
    let siblings: typeof fromAncestor = []
    if (event.cloned_from) {
      const { data: siblingsData } = await supabase
        .from("events")
        .select("id, title, slug, start_date, end_date, venue, status, cloned_from, is_template, created_at")
        .eq("cloned_from", eventId)
        .eq("is_template", false)
        .order("start_date", { ascending: true })
      siblings = siblingsData ?? []
    }

    // Combine into unique set, ordered by start_date
    const allEvents = [
      ...(ancestor ? [ancestor] : []),
      ...(fromAncestor ?? []),
      ...siblings,
    ]

    // Deduplicate by id
    const seen = new Set<string>()
    const series = allEvents
      .filter((e) => {
        if (seen.has(e.id)) return false
        seen.add(e.id)
        return true
      })
      .sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0
        return dateA - dateB
      })

    return { success: true, series }
  } catch (err) {
    return { success: false, error: (err as Error).message, series: [] }
  }
}

/* ── 6. Cross-Event Attendees ─────────────────────────────────────────── */

export async function getCrossEventAttendees(eventIds: string[]) {
  try {
    const { supabase } = await getAuthenticatedClient()

    if (!eventIds?.length || eventIds.length < 2) {
      return { success: false, error: "At least two event IDs are required.", attendees: [] }
    }

    // Fetch attendees for all specified events
    const { data: attendees, error } = await supabase
      .from("attendees")
      .select("id, name, email, event_id, events(title)")
      .in("event_id", eventIds)

    if (error) return { success: false, error: error.message, attendees: [] }
    if (!attendees?.length) return { success: true, attendees: [] }

    // Group by email to find cross-event attendees
    const emailMap = new Map<
      string,
      { name: string; email: string; eventNames: string[]; eventIds: string[]; count: number }
    >()

    for (const att of attendees) {
      const email = att.email?.toLowerCase()
      if (!email) continue

      const eventTitle =
        (att.events as unknown as { title: string } | null)?.title ?? "Unknown Event"

      if (emailMap.has(email)) {
        const entry = emailMap.get(email)!
        if (!entry.eventIds.includes(att.event_id)) {
          entry.eventIds.push(att.event_id)
          entry.eventNames.push(eventTitle)
          entry.count++
        }
      } else {
        emailMap.set(email, {
          name: att.name,
          email,
          eventNames: [eventTitle],
          eventIds: [att.event_id],
          count: 1,
        })
      }
    }

    // Filter to only those who attended 2+ events
    const crossAttendees = Array.from(emailMap.values())
      .filter((a) => a.count >= 2)
      .sort((a, b) => b.count - a.count)

    return { success: true, attendees: crossAttendees }
  } catch (err) {
    return { success: false, error: (err as Error).message, attendees: [] }
  }
}

/* ── 7. Unified Calendar ──────────────────────────────────────────────── */

export async function getUnifiedCalendar() {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: events, error } = await supabase
      .from("events")
      .select("id, title, slug, start_date, end_date, venue, status, cover_image_url, is_featured")
      .eq("is_template", false)
      .order("start_date", { ascending: true })

    if (error) return { success: false, error: error.message, events: [] }
    if (!events?.length) return { success: true, events: [] }

    // Fetch attendee counts for each event
    const eventIds = events.map((e) => e.id)
    const { data: countData } = await supabase
      .from("attendees")
      .select("event_id")
      .in("event_id", eventIds)

    // Build count map
    const countMap = new Map<string, number>()
    if (countData) {
      for (const row of countData) {
        countMap.set(row.event_id, (countMap.get(row.event_id) || 0) + 1)
      }
    }

    const calendarEvents = events.map((e) => ({
      ...e,
      attendee_count: countMap.get(e.id) || 0,
    }))

    return { success: true, events: calendarEvents }
  } catch (err) {
    return { success: false, error: (err as Error).message, events: [] }
  }
}
