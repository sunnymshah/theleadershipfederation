"use server"

/**
 * ── CMS ACTIONS ───────────────────────────────────────────────────────
 *
 * Server actions for all CMS-style content that lives in the DB:
 *   • partners
 *   • platform_features
 *   • about_sections (pillar / stat / vision / founder)
 *   • contact_departments + contact_persons
 *   • office_locations
 *   • press_outlets + media_videos
 *   • inner_circle_content (value_prop / how_it_works / testimonial)
 *   • membership_comparison_rows
 *   • faqs
 *
 * All actions return { success, error?, data? } and call revalidatePath on
 * the admin page + the public page affected.
 */

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createStaticClient } from "@/utils/supabase/static"

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

/**
 * Cookie-free client for public reads. Using this keeps pages statically
 * cacheable — cookies() access would force dynamic rendering.
 */
function getPublicClient() {
  return createStaticClient()
}

function int(fd: FormData, key: string, fallback = 0): number {
  const raw = fd.get(key)
  if (raw === null || raw === undefined) return fallback
  const n = parseInt(String(raw), 10)
  return Number.isFinite(n) ? n : fallback
}

function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "true"
}

function str(fd: FormData, key: string): string | null {
  const raw = fd.get(key)
  if (raw === null || raw === undefined) return null
  const s = String(raw).trim()
  return s.length === 0 ? null : s
}

/* ═══════════════════════════════════════════════════════════════════════
   PARTNERS
═══════════════════════════════════════════════════════════════════════ */

export async function getPartners(activeOnly = false) {
  try {
    const supabase = activeOnly ? getPublicClient() : (await getAuthenticatedClient()).supabase
    let q = supabase.from("partners").select("*").order("sort_order", { ascending: true })
    if (activeOnly) q = q.eq("is_active", true)
    const { data, error } = await q
    if (error) return { success: false, error: error.message }
    return { success: true, partners: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function createPartner(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const name     = str(formData, "name")
    const category = str(formData, "category")
    if (!name || !category) return { success: false, error: "Name and category are required." }

    const { data, error } = await supabase.from("partners").insert({
      name,
      category,
      logo_url:    str(formData, "logo_url"),
      website_url: str(formData, "website_url"),
      description: str(formData, "description"),
      sort_order:  int(formData, "sort_order"),
      is_active:   bool(formData, "is_active"),
    }).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/partners", "page")
    revalidatePath("/partners", "page")
    return { success: true, partner: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updatePartner(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const id = str(formData, "id")
    if (!id) return { success: false, error: "Partner ID is required." }
    const name     = str(formData, "name")
    const category = str(formData, "category")
    if (!name || !category) return { success: false, error: "Name and category are required." }

    const { data, error } = await supabase.from("partners").update({
      name,
      category,
      logo_url:    str(formData, "logo_url"),
      website_url: str(formData, "website_url"),
      description: str(formData, "description"),
      sort_order:  int(formData, "sort_order"),
      is_active:   bool(formData, "is_active"),
      updated_at:  new Date().toISOString(),
    }).eq("id", id).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/partners", "page")
    revalidatePath("/partners", "page")
    return { success: true, partner: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deletePartner(id: string) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const { error } = await supabase.from("partners").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/partners", "page")
    revalidatePath("/partners", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}


/* ═══════════════════════════════════════════════════════════════════════
   PLATFORM FEATURES
═══════════════════════════════════════════════════════════════════════ */

export async function getPlatformFeatures(activeOnly = false) {
  try {
    const supabase = activeOnly ? getPublicClient() : (await getAuthenticatedClient()).supabase
    let q = supabase.from("platform_features").select("*").order("sort_order", { ascending: true })
    if (activeOnly) q = q.eq("is_active", true)
    const { data, error } = await q
    if (error) return { success: false, error: error.message }
    return { success: true, features: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function createPlatformFeature(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const platform = str(formData, "platform")
    const title    = str(formData, "title")
    if (!platform || !title) return { success: false, error: "Platform and title are required." }

    const { data, error } = await supabase.from("platform_features").insert({
      platform,
      title,
      icon:       str(formData, "icon"),
      sort_order: int(formData, "sort_order"),
      is_active:  bool(formData, "is_active"),
    }).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/platforms", "page")
    revalidatePath("/platforms", "page")
    return { success: true, feature: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updatePlatformFeature(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const id = str(formData, "id")
    if (!id) return { success: false, error: "Feature ID is required." }
    const platform = str(formData, "platform")
    const title    = str(formData, "title")
    if (!platform || !title) return { success: false, error: "Platform and title are required." }

    const { data, error } = await supabase.from("platform_features").update({
      platform,
      title,
      icon:       str(formData, "icon"),
      sort_order: int(formData, "sort_order"),
      is_active:  bool(formData, "is_active"),
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/platforms", "page")
    revalidatePath("/platforms", "page")
    return { success: true, feature: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deletePlatformFeature(id: string) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const { error } = await supabase.from("platform_features").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/platforms", "page")
    revalidatePath("/platforms", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}


/* ═══════════════════════════════════════════════════════════════════════
   ABOUT SECTIONS (pillars, stats, vision, founder)
═══════════════════════════════════════════════════════════════════════ */

export async function getAboutSections(activeOnly = false) {
  try {
    const supabase = activeOnly ? getPublicClient() : (await getAuthenticatedClient()).supabase
    let q = supabase.from("about_sections").select("*")
      .order("section_type", { ascending: true })
      .order("sort_order",   { ascending: true })
    if (activeOnly) q = q.eq("is_active", true)
    const { data, error } = await q
    if (error) return { success: false, error: error.message }
    return { success: true, sections: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function createAboutSection(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const section_type = str(formData, "section_type")
    const title        = str(formData, "title")
    if (!section_type || !title) return { success: false, error: "Section type and title are required." }

    const { data, error } = await supabase.from("about_sections").insert({
      section_type,
      title,
      subtitle:     str(formData, "subtitle"),
      description:  str(formData, "description"),
      icon:         str(formData, "icon"),
      image_url:    str(formData, "image_url"),
      metric_value: str(formData, "metric_value"),
      metric_label: str(formData, "metric_label"),
      link_url:     str(formData, "link_url"),
      sort_order:   int(formData, "sort_order"),
      is_active:    bool(formData, "is_active"),
    }).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/about", "page")
    revalidatePath("/about", "page")
    return { success: true, section: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateAboutSection(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const id = str(formData, "id")
    if (!id) return { success: false, error: "Section ID is required." }
    const section_type = str(formData, "section_type")
    const title        = str(formData, "title")
    if (!section_type || !title) return { success: false, error: "Section type and title are required." }

    const { data, error } = await supabase.from("about_sections").update({
      section_type,
      title,
      subtitle:     str(formData, "subtitle"),
      description:  str(formData, "description"),
      icon:         str(formData, "icon"),
      image_url:    str(formData, "image_url"),
      metric_value: str(formData, "metric_value"),
      metric_label: str(formData, "metric_label"),
      link_url:     str(formData, "link_url"),
      sort_order:   int(formData, "sort_order"),
      is_active:    bool(formData, "is_active"),
      updated_at:   new Date().toISOString(),
    }).eq("id", id).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/about", "page")
    revalidatePath("/about", "page")
    return { success: true, section: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteAboutSection(id: string) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const { error } = await supabase.from("about_sections").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/about", "page")
    revalidatePath("/about", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}


/* ═══════════════════════════════════════════════════════════════════════
   CONTACT DEPARTMENTS + PEOPLE + OFFICES
═══════════════════════════════════════════════════════════════════════ */

export async function getContactData(activeOnly = false) {
  try {
    const supabase = activeOnly ? getPublicClient() : (await getAuthenticatedClient()).supabase

    let deptQ = supabase.from("contact_departments").select("*").order("sort_order", { ascending: true })
    if (activeOnly) deptQ = deptQ.eq("is_active", true)
    const { data: departments, error: deptErr } = await deptQ
    if (deptErr) return { success: false, error: deptErr.message }

    let peopleQ = supabase.from("contact_persons").select("*").order("sort_order", { ascending: true })
    if (activeOnly) peopleQ = peopleQ.eq("is_active", true)
    const { data: persons, error: persErr } = await peopleQ
    if (persErr) return { success: false, error: persErr.message }

    let officeQ = supabase.from("office_locations").select("*").order("sort_order", { ascending: true })
    if (activeOnly) officeQ = officeQ.eq("is_active", true)
    const { data: offices, error: offErr } = await officeQ
    if (offErr) return { success: false, error: offErr.message }

    return { success: true, departments, persons, offices }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function createContactDepartment(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const name = str(formData, "name")
    if (!name) return { success: false, error: "Name is required." }

    const { data, error } = await supabase.from("contact_departments").insert({
      name,
      description: str(formData, "description"),
      icon:        str(formData, "icon"),
      sort_order:  int(formData, "sort_order"),
      is_active:   bool(formData, "is_active"),
    }).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/contact", "page")
    revalidatePath("/contact", "page")
    return { success: true, department: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateContactDepartment(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const id = str(formData, "id")
    const name = str(formData, "name")
    if (!id || !name) return { success: false, error: "ID and name are required." }

    const { data, error } = await supabase.from("contact_departments").update({
      name,
      description: str(formData, "description"),
      icon:        str(formData, "icon"),
      sort_order:  int(formData, "sort_order"),
      is_active:   bool(formData, "is_active"),
      updated_at:  new Date().toISOString(),
    }).eq("id", id).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/contact", "page")
    revalidatePath("/contact", "page")
    return { success: true, department: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteContactDepartment(id: string) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const { error } = await supabase.from("contact_departments").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/contact", "page")
    revalidatePath("/contact", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function createContactPerson(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const department_id = str(formData, "department_id")
    const name          = str(formData, "name")
    if (!department_id || !name) return { success: false, error: "Department and name are required." }

    const { data, error } = await supabase.from("contact_persons").insert({
      department_id,
      name,
      role:       str(formData, "role"),
      email:      str(formData, "email"),
      phone:      str(formData, "phone"),
      phone_raw:  str(formData, "phone_raw"),
      sort_order: int(formData, "sort_order"),
      is_active:  bool(formData, "is_active"),
    }).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/contact", "page")
    revalidatePath("/contact", "page")
    return { success: true, person: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateContactPerson(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const id = str(formData, "id")
    if (!id) return { success: false, error: "Person ID is required." }
    const department_id = str(formData, "department_id")
    const name          = str(formData, "name")
    if (!department_id || !name) return { success: false, error: "Department and name are required." }

    const { data, error } = await supabase.from("contact_persons").update({
      department_id,
      name,
      role:       str(formData, "role"),
      email:      str(formData, "email"),
      phone:      str(formData, "phone"),
      phone_raw:  str(formData, "phone_raw"),
      sort_order: int(formData, "sort_order"),
      is_active:  bool(formData, "is_active"),
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/contact", "page")
    revalidatePath("/contact", "page")
    return { success: true, person: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteContactPerson(id: string) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const { error } = await supabase.from("contact_persons").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/contact", "page")
    revalidatePath("/contact", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Office locations ─────────────────────────────────────────────── */

export async function createOfficeLocation(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const city = str(formData, "city")
    const addressRaw = str(formData, "address_lines") // newline-separated
    if (!city || !addressRaw) return { success: false, error: "City and address are required." }
    const address_lines = addressRaw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

    const { data, error } = await supabase.from("office_locations").insert({
      city,
      address_lines,
      timezone:   str(formData, "timezone"),
      phone:      str(formData, "phone"),
      email:      str(formData, "email"),
      is_primary: bool(formData, "is_primary"),
      sort_order: int(formData, "sort_order"),
      is_active:  bool(formData, "is_active"),
    }).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/contact", "page")
    revalidatePath("/contact", "page")
    return { success: true, office: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateOfficeLocation(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const id = str(formData, "id")
    if (!id) return { success: false, error: "Office ID is required." }
    const city = str(formData, "city")
    const addressRaw = str(formData, "address_lines")
    if (!city || !addressRaw) return { success: false, error: "City and address are required." }
    const address_lines = addressRaw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

    const { data, error } = await supabase.from("office_locations").update({
      city,
      address_lines,
      timezone:   str(formData, "timezone"),
      phone:      str(formData, "phone"),
      email:      str(formData, "email"),
      is_primary: bool(formData, "is_primary"),
      sort_order: int(formData, "sort_order"),
      is_active:  bool(formData, "is_active"),
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/contact", "page")
    revalidatePath("/contact", "page")
    return { success: true, office: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteOfficeLocation(id: string) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const { error } = await supabase.from("office_locations").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/contact", "page")
    revalidatePath("/contact", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}


/* ═══════════════════════════════════════════════════════════════════════
   PRESS OUTLETS + MEDIA VIDEOS
═══════════════════════════════════════════════════════════════════════ */

export async function getMediaData(activeOnly = false) {
  try {
    const supabase = activeOnly ? getPublicClient() : (await getAuthenticatedClient()).supabase

    let outletsQ = supabase.from("press_outlets").select("*").order("sort_order", { ascending: true })
    if (activeOnly) outletsQ = outletsQ.eq("is_active", true)
    const { data: outlets, error: outletsErr } = await outletsQ
    if (outletsErr) return { success: false, error: outletsErr.message }

    let videosQ = supabase.from("media_videos").select("*").order("sort_order", { ascending: true })
    if (activeOnly) videosQ = videosQ.eq("is_active", true)
    const { data: videos, error: videosErr } = await videosQ
    if (videosErr) return { success: false, error: videosErr.message }

    return { success: true, outlets, videos }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function createPressOutlet(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const name = str(formData, "name")
    if (!name) return { success: false, error: "Name is required." }

    const { data, error } = await supabase.from("press_outlets").insert({
      name,
      logo_url:    str(formData, "logo_url"),
      article_url: str(formData, "article_url"),
      sort_order:  int(formData, "sort_order"),
      is_active:   bool(formData, "is_active"),
    }).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/media", "page")
    revalidatePath("/media", "page")
    return { success: true, outlet: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updatePressOutlet(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const id = str(formData, "id")
    const name = str(formData, "name")
    if (!id || !name) return { success: false, error: "ID and name are required." }

    const { data, error } = await supabase.from("press_outlets").update({
      name,
      logo_url:    str(formData, "logo_url"),
      article_url: str(formData, "article_url"),
      sort_order:  int(formData, "sort_order"),
      is_active:   bool(formData, "is_active"),
      updated_at:  new Date().toISOString(),
    }).eq("id", id).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/media", "page")
    revalidatePath("/media", "page")
    return { success: true, outlet: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deletePressOutlet(id: string) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const { error } = await supabase.from("press_outlets").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/media", "page")
    revalidatePath("/media", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function createMediaVideo(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const title = str(formData, "title")
    if (!title) return { success: false, error: "Title is required." }

    const { data, error } = await supabase.from("media_videos").insert({
      title,
      description:   str(formData, "description"),
      youtube_id:    str(formData, "youtube_id"),
      thumbnail_url: str(formData, "thumbnail_url"),
      label:         str(formData, "label"),
      sort_order:    int(formData, "sort_order"),
      is_active:     bool(formData, "is_active"),
    }).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/media", "page")
    revalidatePath("/media", "page")
    return { success: true, video: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateMediaVideo(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const id = str(formData, "id")
    const title = str(formData, "title")
    if (!id || !title) return { success: false, error: "ID and title are required." }

    const { data, error } = await supabase.from("media_videos").update({
      title,
      description:   str(formData, "description"),
      youtube_id:    str(formData, "youtube_id"),
      thumbnail_url: str(formData, "thumbnail_url"),
      label:         str(formData, "label"),
      sort_order:    int(formData, "sort_order"),
      is_active:     bool(formData, "is_active"),
      updated_at:    new Date().toISOString(),
    }).eq("id", id).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/media", "page")
    revalidatePath("/media", "page")
    return { success: true, video: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteMediaVideo(id: string) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const { error } = await supabase.from("media_videos").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/media", "page")
    revalidatePath("/media", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}


/* ═══════════════════════════════════════════════════════════════════════
   INNER CIRCLE CONTENT
═══════════════════════════════════════════════════════════════════════ */

export async function getInnerCircleContent(activeOnly = false) {
  try {
    const supabase = activeOnly ? getPublicClient() : (await getAuthenticatedClient()).supabase
    let q = supabase.from("inner_circle_content").select("*")
      .order("content_type", { ascending: true })
      .order("sort_order",   { ascending: true })
    if (activeOnly) q = q.eq("is_active", true)
    const { data, error } = await q
    if (error) return { success: false, error: error.message }
    return { success: true, items: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function createInnerCircleItem(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const content_type = str(formData, "content_type")
    const title        = str(formData, "title")
    if (!content_type || !title) return { success: false, error: "Type and title are required." }

    const { data, error } = await supabase.from("inner_circle_content").insert({
      content_type,
      title,
      description: str(formData, "description"),
      subtitle:    str(formData, "subtitle"),
      icon:        str(formData, "icon"),
      accent:      str(formData, "accent"),
      image_url:   str(formData, "image_url"),
      sort_order:  int(formData, "sort_order"),
      is_active:   bool(formData, "is_active"),
    }).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/inner-circle", "page")
    revalidatePath("/inner-circle", "page")
    return { success: true, item: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateInnerCircleItem(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const id = str(formData, "id")
    if (!id) return { success: false, error: "Item ID is required." }
    const content_type = str(formData, "content_type")
    const title        = str(formData, "title")
    if (!content_type || !title) return { success: false, error: "Type and title are required." }

    const { data, error } = await supabase.from("inner_circle_content").update({
      content_type,
      title,
      description: str(formData, "description"),
      subtitle:    str(formData, "subtitle"),
      icon:        str(formData, "icon"),
      accent:      str(formData, "accent"),
      image_url:   str(formData, "image_url"),
      sort_order:  int(formData, "sort_order"),
      is_active:   bool(formData, "is_active"),
      updated_at:  new Date().toISOString(),
    }).eq("id", id).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/inner-circle", "page")
    revalidatePath("/inner-circle", "page")
    return { success: true, item: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteInnerCircleItem(id: string) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const { error } = await supabase.from("inner_circle_content").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/inner-circle", "page")
    revalidatePath("/inner-circle", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}


/* ═══════════════════════════════════════════════════════════════════════
   MEMBERSHIP COMPARISON ROWS
═══════════════════════════════════════════════════════════════════════ */

export async function getMembershipComparisonRows(activeOnly = false) {
  try {
    const supabase = activeOnly ? getPublicClient() : (await getAuthenticatedClient()).supabase
    let q = supabase.from("membership_comparison_rows").select("*").order("sort_order", { ascending: true })
    if (activeOnly) q = q.eq("is_active", true)
    const { data, error } = await q
    if (error) return { success: false, error: error.message }
    return { success: true, rows: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function createComparisonRow(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const feature = str(formData, "feature")
    if (!feature) return { success: false, error: "Feature name is required." }

    const { data, error } = await supabase.from("membership_comparison_rows").insert({
      feature,
      silver_value:   str(formData, "silver_value"),
      gold_value:     str(formData, "gold_value"),
      platinum_value: str(formData, "platinum_value"),
      titanium_value: str(formData, "titanium_value"),
      sort_order:     int(formData, "sort_order"),
      is_active:      bool(formData, "is_active"),
    }).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/memberships", "page")
    revalidatePath("/memberships", "page")
    return { success: true, row: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateComparisonRow(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const id = str(formData, "id")
    const feature = str(formData, "feature")
    if (!id || !feature) return { success: false, error: "ID and feature name are required." }

    const { data, error } = await supabase.from("membership_comparison_rows").update({
      feature,
      silver_value:   str(formData, "silver_value"),
      gold_value:     str(formData, "gold_value"),
      platinum_value: str(formData, "platinum_value"),
      titanium_value: str(formData, "titanium_value"),
      sort_order:     int(formData, "sort_order"),
      is_active:      bool(formData, "is_active"),
      updated_at:     new Date().toISOString(),
    }).eq("id", id).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/memberships", "page")
    revalidatePath("/memberships", "page")
    return { success: true, row: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteComparisonRow(id: string) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const { error } = await supabase.from("membership_comparison_rows").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/memberships", "page")
    revalidatePath("/memberships", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}


/* ═══════════════════════════════════════════════════════════════════════
   FAQS
═══════════════════════════════════════════════════════════════════════ */

export async function getFaqs(page?: string, activeOnly = false) {
  try {
    const supabase = activeOnly ? getPublicClient() : (await getAuthenticatedClient()).supabase
    let q = supabase.from("faqs").select("*")
      .order("page",       { ascending: true })
      .order("sort_order", { ascending: true })
    if (activeOnly) q = q.eq("is_active", true)
    if (page) q = q.eq("page", page)
    const { data, error } = await q
    if (error) return { success: false, error: error.message }
    return { success: true, faqs: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function createFaq(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const page     = str(formData, "page")
    const question = str(formData, "question")
    const answer   = str(formData, "answer")
    if (!page || !question || !answer) {
      return { success: false, error: "Page, question, and answer are required." }
    }

    const { data, error } = await supabase.from("faqs").insert({
      page,
      question,
      answer,
      sort_order: int(formData, "sort_order"),
      is_active:  bool(formData, "is_active"),
    }).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/faqs", "page")
    revalidatePath(`/${page}`, "page")
    return { success: true, faq: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateFaq(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const id = str(formData, "id")
    const page     = str(formData, "page")
    const question = str(formData, "question")
    const answer   = str(formData, "answer")
    if (!id || !page || !question || !answer) {
      return { success: false, error: "ID, page, question, and answer are required." }
    }

    const { data, error } = await supabase.from("faqs").update({
      page,
      question,
      answer,
      sort_order: int(formData, "sort_order"),
      is_active:  bool(formData, "is_active"),
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single()
    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/faqs", "page")
    revalidatePath(`/${page}`, "page")
    return { success: true, faq: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteFaq(id: string) {
  try {
    const { supabase } = await getAuthenticatedClient()
    const { error } = await supabase.from("faqs").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/faqs", "page")
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
