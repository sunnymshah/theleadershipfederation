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

/* ── Public: fetch active tiers ────────────────────────────────────── */

export async function getMembershipTiers() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
      .from("membership_tiers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (error) return { success: false, error: error.message }
    return { success: true, tiers: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Admin: fetch all tiers (including inactive) ───────────────────── */

export async function getAllMembershipTiers() {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("membership_tiers")
      .select("*")
      .order("sort_order", { ascending: true })

    if (error) return { success: false, error: error.message }
    return { success: true, tiers: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Admin: fetch applications with optional status filter ─────────── */

export async function getMembershipApplications(filters?: {
  status?: string
  search?: string
}) {
  try {
    const { supabase } = await getAuthenticatedClient()

    let query = supabase
      .from("membership_applications")
      .select("*, membership_tiers(id, name, slug)")
      .order("created_at", { ascending: false })

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query

    if (error) return { success: false, error: error.message }
    return { success: true, applications: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Admin: update application status ──────────────────────────────── */

export async function updateApplicationStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
  notes?: string
) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (notes !== undefined) {
      updateData.notes = notes
    }

    const { error } = await supabase
      .from("membership_applications")
      .update(updateData)
      .eq("id", id)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/memberships")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Admin: tier CRUD ──────────────────────────────────────────────── */

function parseBenefits(raw: FormDataEntryValue | null): string[] {
  if (!raw) return []
  return String(raw)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export async function createMembershipTier(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const name = formData.get("name")?.toString().trim()
    const slug = formData.get("slug")?.toString().trim()
    if (!name || !slug) return { success: false, error: "Name and slug are required." }

    const { data, error } = await supabase.from("membership_tiers").insert({
      name,
      slug,
      price_inr:        parseInt(formData.get("price_inr")?.toString() ?? "0", 10) || 0,
      price_usd:        parseInt(formData.get("price_usd")?.toString() ?? "0", 10) || 0,
      discount_percent: parseInt(formData.get("discount_percent")?.toString() ?? "0", 10) || 0,
      benefits:         parseBenefits(formData.get("benefits")),
      is_popular:       formData.get("is_popular") === "true",
      is_active:        formData.get("is_active") === "true",
      sort_order:       parseInt(formData.get("sort_order")?.toString() ?? "0", 10) || 0,
    }).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/memberships", "page")
    revalidatePath("/memberships", "page")
    return { success: true, tier: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateMembershipTier(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const id = formData.get("id")?.toString()
    if (!id) return { success: false, error: "Tier ID is required." }
    const name = formData.get("name")?.toString().trim()
    const slug = formData.get("slug")?.toString().trim()
    if (!name || !slug) return { success: false, error: "Name and slug are required." }

    const { data, error } = await supabase.from("membership_tiers").update({
      name,
      slug,
      price_inr:        parseInt(formData.get("price_inr")?.toString() ?? "0", 10) || 0,
      price_usd:        parseInt(formData.get("price_usd")?.toString() ?? "0", 10) || 0,
      discount_percent: parseInt(formData.get("discount_percent")?.toString() ?? "0", 10) || 0,
      benefits:         parseBenefits(formData.get("benefits")),
      is_popular:       formData.get("is_popular") === "true",
      is_active:        formData.get("is_active") === "true",
      sort_order:       parseInt(formData.get("sort_order")?.toString() ?? "0", 10) || 0,
      updated_at:       new Date().toISOString(),
    }).eq("id", id).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/memberships", "page")
    revalidatePath("/memberships", "page")
    return { success: true, tier: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteMembershipTier(id: string) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const { error } = await supabase.from("membership_tiers").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/memberships", "page")
    revalidatePath("/memberships", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
