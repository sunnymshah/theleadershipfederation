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

function invalidateCaches() {
  revalidatePath("/admin/tickets", "page")
  revalidatePath("/admin/events", "page")
  revalidatePath("/admin", "page")
}

export async function createTicket(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const eventId        = formData.get("eventId") as string
    const name           = formData.get("name") as string
    const description    = formData.get("description") as string
    const priceInr       = parseInt(formData.get("priceInr") as string) || 0
    const inventoryLimit = parseInt(formData.get("inventoryLimit") as string) || 0
    const status         = (formData.get("status") as string) || "draft"

    if (!eventId || !name) {
      return { success: false, error: "Event and ticket name are required." }
    }

    const { data, error } = await supabase
      .from("tickets")
      .insert({ event_id: eventId, name, description: description || null, price_inr: priceInr, inventory_limit: inventoryLimit, status })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true, ticket: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateTicket(ticketId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const name           = formData.get("name") as string
    const description    = formData.get("description") as string
    const priceInr       = parseInt(formData.get("priceInr") as string) || 0
    const inventoryLimit = parseInt(formData.get("inventoryLimit") as string) || 0
    const status         = (formData.get("status") as string) || "draft"

    if (!name) return { success: false, error: "Ticket name is required." }

    const { data, error } = await supabase
      .from("tickets")
      .update({ name, description: description || null, price_inr: priceInr, inventory_limit: inventoryLimit, status, updated_at: new Date().toISOString() })
      .eq("id", ticketId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true, ticket: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteTicket(ticketId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const { error } = await supabase.from("tickets").delete().eq("id", ticketId)
    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
