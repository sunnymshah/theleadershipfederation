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

export async function getCustomFields(eventId: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
      .from("custom_fields")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order")

    if (error) return { success: false, error: error.message, fields: [] }
    return { success: true, fields: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message, fields: [] }
  }
}

export async function createCustomField(eventId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const field_label = formData.get("field_label") as string
    const field_name = formData.get("field_name") as string
    const field_type = formData.get("field_type") as string
    const optionsRaw = formData.get("options") as string
    const is_required = formData.get("is_required") === "on" || formData.get("is_required") === "true"
    const sort_order = parseInt(formData.get("sort_order") as string, 10) || 0

    if (!field_label || !field_name || !field_type) {
      return { success: false, error: "Label, name, and type are required." }
    }

    const options = optionsRaw
      ? optionsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : null

    const { data, error } = await supabase
      .from("custom_fields")
      .insert({
        event_id: eventId,
        field_label,
        field_name,
        field_type,
        options,
        is_required,
        sort_order,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath(`/admin/events/${eventId}`, "page")
    return { success: true, field: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateCustomField(fieldId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const field_label = formData.get("field_label") as string
    const field_name = formData.get("field_name") as string
    const field_type = formData.get("field_type") as string
    const optionsRaw = formData.get("options") as string
    const is_required = formData.get("is_required") === "on" || formData.get("is_required") === "true"
    const sort_order = parseInt(formData.get("sort_order") as string, 10) || 0

    if (!field_label || !field_name || !field_type) {
      return { success: false, error: "Label, name, and type are required." }
    }

    const options = optionsRaw
      ? optionsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : null

    const { data, error } = await supabase
      .from("custom_fields")
      .update({
        field_label,
        field_name,
        field_type,
        options,
        is_required,
        sort_order,
      })
      .eq("id", fieldId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, field: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteCustomField(fieldId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { error } = await supabase
      .from("custom_fields")
      .delete()
      .eq("id", fieldId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function saveFieldValues(attendeeId: string, values: { fieldId: string; value: string }[]) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Upsert each field value
    for (const { fieldId, value } of values) {
      const { error } = await supabase
        .from("custom_field_values")
        .upsert(
          {
            custom_field_id: fieldId,
            attendee_id: attendeeId,
            value,
          },
          { onConflict: "custom_field_id,attendee_id" }
        )

      if (error) return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function getFieldValues(attendeeId: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
      .from("custom_field_values")
      .select("*, custom_fields(*)")
      .eq("attendee_id", attendeeId)

    if (error) return { success: false, error: error.message, values: [] }
    return { success: true, values: data ?? [] }
  } catch (err) {
    return { success: false, error: (err as Error).message, values: [] }
  }
}

export async function reorderCustomFields(fieldOrders: { id: string; sort_order: number }[]) {
  try {
    const { supabase } = await getAuthenticatedClient()

    for (const { id, sort_order } of fieldOrders) {
      const { error } = await supabase
        .from("custom_fields")
        .update({ sort_order })
        .eq("id", id)

      if (error) return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
