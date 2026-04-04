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
  revalidatePath("/admin/sponsors", "page")
  revalidatePath("/admin", "page")
}

export async function createSponsor(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const eventId     = formData.get("eventId") as string
    const name        = formData.get("name") as string
    const tier        = formData.get("tier") as string
    const logoUrl     = formData.get("logoUrl") as string
    const website     = formData.get("website") as string
    const description = formData.get("description") as string
    const sortOrder   = parseInt(formData.get("sortOrder") as string) || 0

    if (!eventId || !name) {
      return { success: false, error: "Event and sponsor name are required." }
    }

    const { data, error } = await supabase
      .from("sponsors")
      .insert({ event_id: eventId, name, tier: tier || "gold", logo_url: logoUrl || null, website: website || null, description: description || null, sort_order: sortOrder })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true, sponsor: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateSponsor(sponsorId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const name        = formData.get("name") as string
    const tier        = formData.get("tier") as string
    const logoUrl     = formData.get("logoUrl") as string
    const website     = formData.get("website") as string
    const description = formData.get("description") as string
    const sortOrder   = parseInt(formData.get("sortOrder") as string) || 0

    if (!name) return { success: false, error: "Sponsor name is required." }

    const { data, error } = await supabase
      .from("sponsors")
      .update({ name, tier: tier || "gold", logo_url: logoUrl || null, website: website || null, description: description || null, sort_order: sortOrder, updated_at: new Date().toISOString() })
      .eq("id", sponsorId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true, sponsor: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteSponsor(sponsorId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const { error } = await supabase.from("sponsors").delete().eq("id", sponsorId)
    if (error) return { success: false, error: error.message }
    invalidateCaches()
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
