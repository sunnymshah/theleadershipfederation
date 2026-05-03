"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { requirePermission } from "@/lib/server-permissions"

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

async function invalidateCaches(supabase: ReturnType<typeof createClient>, eventId: string) {
  // Core admin paths
  revalidatePath("/admin/tickets", "page")
  revalidatePath("/admin/events", "page")
  revalidatePath("/admin", "page")
  revalidatePath(`/admin/events/${eventId}`, "page")

  // Resolve slug for public site invalidation
  const { data: event } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .single()

  if (event?.slug) {
    revalidatePath(`/events/${event.slug}`, "page")
  }
  revalidatePath("/events", "page")
}

export async function createTicket(formData: FormData) {
  try {
    await requirePermission("tickets", "create")
    const { supabase } = await getAuthenticatedClient()

    const eventId        = formData.get("eventId") as string
    const name           = formData.get("name") as string
    const description    = formData.get("description") as string
    const priceInr       = parseInt(formData.get("priceInr") as string) || 0
    const inventoryLimit = parseInt(formData.get("inventoryLimit") as string) || 0
    const status         = (formData.get("status") as string) || "published"
    const salesStart     = (formData.get("salesStart") as string) || ""
    const salesEnd       = (formData.get("salesEnd") as string) || ""
    const earlyBirdEnds  = (formData.get("earlyBirdEndsAt") as string) || ""
    const featuresRaw    = (formData.get("features") as string) || ""
    const mostPopular    = formData.get("mostPopular") === "on" || formData.get("mostPopular") === "true"

    if (!eventId || !name) {
      return { success: false, error: "Event and ticket name are required." }
    }

    const features = featuresRaw
      ? featuresRaw.split("\n").map((s) => s.trim()).filter(Boolean)
      : null

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        event_id: eventId,
        name,
        description: description || null,
        price_inr: priceInr,
        inventory_limit: inventoryLimit,
        status,
        sales_start_at: salesStart ? new Date(salesStart).toISOString() : null,
        sales_end_at:   salesEnd   ? new Date(salesEnd).toISOString()   : null,
        early_bird_ends_at: earlyBirdEnds ? new Date(earlyBirdEnds).toISOString() : null,
        features,
        most_popular: mostPopular,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    await invalidateCaches(supabase, eventId)
    return { success: true, ticket: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateTicket(ticketId: string, formData: FormData) {
  try {
    await requirePermission("tickets", "edit")
    const { supabase } = await getAuthenticatedClient()

    // Look up the event_id from the ticket for cache invalidation
    const { data: existing } = await supabase
      .from("tickets")
      .select("event_id")
      .eq("id", ticketId)
      .single()

    const name           = formData.get("name") as string
    const description    = formData.get("description") as string
    const priceInr       = parseInt(formData.get("priceInr") as string) || 0
    const inventoryLimit = parseInt(formData.get("inventoryLimit") as string) || 0
    const status         = (formData.get("status") as string) || "published"
    const salesStart     = (formData.get("salesStart") as string) || ""
    const salesEnd       = (formData.get("salesEnd") as string) || ""
    const earlyBirdEnds  = (formData.get("earlyBirdEndsAt") as string) || ""
    const featuresRaw    = (formData.get("features") as string) || ""
    const mostPopular    = formData.get("mostPopular") === "on" || formData.get("mostPopular") === "true"

    if (!name) return { success: false, error: "Ticket name is required." }

    const features = featuresRaw
      ? featuresRaw.split("\n").map((s) => s.trim()).filter(Boolean)
      : null

    // most_popular is enforced as a single-row flag per event — when
    // setting true, clear the flag on every other ticket for that event.
    if (mostPopular && existing?.event_id) {
      await supabase
        .from("tickets")
        .update({ most_popular: false })
        .eq("event_id", existing.event_id)
        .neq("id", ticketId)
    }

    const { data, error } = await supabase
      .from("tickets")
      .update({
        name, description: description || null, price_inr: priceInr,
        inventory_limit: inventoryLimit, status,
        sales_start_at: salesStart ? new Date(salesStart).toISOString() : null,
        sales_end_at:   salesEnd   ? new Date(salesEnd).toISOString()   : null,
        early_bird_ends_at: earlyBirdEnds ? new Date(earlyBirdEnds).toISOString() : null,
        features,
        most_popular: mostPopular,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    if (existing?.event_id) await invalidateCaches(supabase, existing.event_id)
    return { success: true, ticket: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteTicket(ticketId: string) {
  try {
    await requirePermission("tickets", "delete")
    const { supabase } = await getAuthenticatedClient()

    // Look up the event_id before deleting
    const { data: existing } = await supabase
      .from("tickets")
      .select("event_id")
      .eq("id", ticketId)
      .single()

    const { error } = await supabase.from("tickets").delete().eq("id", ticketId)
    if (error) return { success: false, error: error.message }
    if (existing?.event_id) await invalidateCaches(supabase, existing.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Manager parity helper ──────────────────────────────────────── */

export type TicketRow = {
  id: string
  event_id: string
  name: string
  description: string | null
  price_inr: number
  inventory_limit: number | null
  sold: number
  status: string
  sales_start_at: string | null
  sales_end_at: string | null
  early_bird_ends_at: string | null
  features: string[] | null
  most_popular: boolean
  sort_order: number
  created_at: string
}

export async function listTicketsFull(eventId: string): Promise<{ success: boolean; rows: TicketRow[]; error?: string }> {
  try {
    await requirePermission("tickets", "view")
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("tickets")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
      .order("price_inr", { ascending: true })
    if (error) return { success: false, rows: [], error: error.message }
    return { success: true, rows: (data ?? []) as TicketRow[] }
  } catch (err) {
    return { success: false, rows: [], error: (err as Error).message }
  }
}
