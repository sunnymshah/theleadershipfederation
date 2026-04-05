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

async function invalidateCaches(ticketId: string) {
  revalidatePath("/admin/tickets", "page")
  revalidatePath("/admin/events", "page")
  revalidatePath("/events", "page")
}

/* ── Create a new price tier ─────────────────────────────────────────── */

export async function createPriceTier(
  ticketId: string,
  data: { name: string; price_inr: number; starts_at: string; ends_at: string }
) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: tier, error } = await supabase
      .from("ticket_price_tiers")
      .insert({
        ticket_id: ticketId,
        name: data.name,
        price_inr: data.price_inr,
        starts_at: new Date(data.starts_at).toISOString(),
        ends_at: new Date(data.ends_at).toISOString(),
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    await invalidateCaches(ticketId)
    return { success: true, tier }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Update an existing price tier ───────────────────────────────────── */

export async function updatePriceTier(
  tierId: string,
  data: { name?: string; price_inr?: number; starts_at?: string; ends_at?: string; is_active?: boolean }
) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const updates: Record<string, unknown> = {}
    if (data.name !== undefined) updates.name = data.name
    if (data.price_inr !== undefined) updates.price_inr = data.price_inr
    if (data.starts_at !== undefined) updates.starts_at = new Date(data.starts_at).toISOString()
    if (data.ends_at !== undefined) updates.ends_at = new Date(data.ends_at).toISOString()
    if (data.is_active !== undefined) updates.is_active = data.is_active

    const { data: tier, error } = await supabase
      .from("ticket_price_tiers")
      .update(updates)
      .eq("id", tierId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    // Get ticket_id for cache invalidation
    if (tier?.ticket_id) await invalidateCaches(tier.ticket_id)
    return { success: true, tier }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Delete a price tier ─────────────────────────────────────────────── */

export async function deletePriceTier(tierId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Fetch for cache invalidation
    const { data: existing } = await supabase
      .from("ticket_price_tiers")
      .select("ticket_id")
      .eq("id", tierId)
      .single()

    const { error } = await supabase
      .from("ticket_price_tiers")
      .delete()
      .eq("id", tierId)

    if (error) return { success: false, error: error.message }
    if (existing?.ticket_id) await invalidateCaches(existing.ticket_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Get all price tiers for a ticket ────────────────────────────────── */

export async function getPriceTiers(ticketId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("ticket_price_tiers")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("starts_at", { ascending: true })

    if (error) return { success: false, error: error.message, tiers: [] }
    return { success: true, tiers: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message, tiers: [] }
  }
}

/* ── Get current active price for a ticket ───────────────────────────── */

export async function getCurrentPrice(ticketId: string) {
  try {
    // Use unauthenticated client since this is called from public pages
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const now = new Date().toISOString()

    // Check for an active tier that covers the current date
    const { data: activeTier } = await supabase
      .from("ticket_price_tiers")
      .select("*")
      .eq("ticket_id", ticketId)
      .eq("is_active", true)
      .lte("starts_at", now)
      .gte("ends_at", now)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (activeTier) {
      return {
        success: true,
        currentPrice: activeTier.price_inr,
        tierName: activeTier.name,
        tierEndsAt: activeTier.ends_at,
        isDiscounted: true,
      }
    }

    // No active tier — fall back to the base price
    const { data: ticket } = await supabase
      .from("tickets")
      .select("price_inr")
      .eq("id", ticketId)
      .single()

    return {
      success: true,
      currentPrice: ticket?.price_inr ?? 0,
      tierName: null,
      tierEndsAt: null,
      isDiscounted: false,
    }
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      currentPrice: 0,
      tierName: null,
      tierEndsAt: null,
      isDiscounted: false,
    }
  }
}
