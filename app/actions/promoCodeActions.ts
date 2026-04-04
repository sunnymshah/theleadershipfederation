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

function invalidateCaches(eventId: string) {
  revalidatePath("/admin/promo-codes", "page")
  revalidatePath("/admin", "page")
  revalidatePath(`/admin/events/${eventId}`, "page")
}

export async function createPromoCode(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const eventId       = formData.get("eventId") as string
    const code          = formData.get("code") as string
    const discountType  = formData.get("discountType") as string
    const discountValue = parseInt(formData.get("discountValue") as string) || 0
    const maxUses       = parseInt(formData.get("maxUses") as string) || null
    const validFrom     = formData.get("validFrom") as string
    const validUntil    = formData.get("validUntil") as string

    if (!eventId || !code || !discountValue) {
      return { success: false, error: "Event, code, and discount value are required." }
    }

    const { data, error } = await supabase
      .from("promo_codes")
      .insert({
        event_id: eventId,
        code: code.toUpperCase().trim(),
        discount_type: discountType || "percentage",
        discount_value: discountValue,
        max_uses: maxUses,
        valid_from: validFrom ? new Date(validFrom).toISOString() : null,
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        active: true,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateCaches(eventId)
    return { success: true, promoCode: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updatePromoCode(promoCodeId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: existing } = await supabase
      .from("promo_codes")
      .select("event_id")
      .eq("id", promoCodeId)
      .single()

    const code          = formData.get("code") as string
    const discountType  = formData.get("discountType") as string
    const discountValue = parseInt(formData.get("discountValue") as string) || 0
    const maxUses       = parseInt(formData.get("maxUses") as string) || null
    const validFrom     = formData.get("validFrom") as string
    const validUntil    = formData.get("validUntil") as string
    const active        = formData.get("active") === "true"

    if (!code || !discountValue) {
      return { success: false, error: "Code and discount value are required." }
    }

    const { data, error } = await supabase
      .from("promo_codes")
      .update({
        code: code.toUpperCase().trim(),
        discount_type: discountType || "percentage",
        discount_value: discountValue,
        max_uses: maxUses,
        valid_from: validFrom ? new Date(validFrom).toISOString() : null,
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        active,
      })
      .eq("id", promoCodeId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    if (existing?.event_id) invalidateCaches(existing.event_id)
    return { success: true, promoCode: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deletePromoCode(promoCodeId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: existing } = await supabase
      .from("promo_codes")
      .select("event_id")
      .eq("id", promoCodeId)
      .single()

    const { error } = await supabase.from("promo_codes").delete().eq("id", promoCodeId)
    if (error) return { success: false, error: error.message }
    if (existing?.event_id) invalidateCaches(existing.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
