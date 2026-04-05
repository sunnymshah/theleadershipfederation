"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

const SPONSOR_COOKIE = "sponsor_session"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/* ── Sponsor login ────────────────────────────────────────────────────── */

export async function sponsorLogin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; sponsorId?: string }> {
  try {
    if (!email || !password) {
      return { success: false, error: "Email and password are required." }
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Look up sponsor by contact_email and portal_password
    const { data: sponsor, error } = await supabase
      .from("sponsors")
      .select("id, name, contact_email, portal_password")
      .eq("contact_email", email.toLowerCase().trim())
      .eq("portal_password", password)
      .single()

    if (error || !sponsor) {
      return { success: false, error: "Invalid email or password." }
    }

    // Update last_login_at
    await supabase
      .from("sponsors")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", sponsor.id)

    // Set session cookie
    cookieStore.set(SPONSOR_COOKIE, sponsor.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    })

    return { success: true, sponsorId: sponsor.id }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Sponsor logout ───────────────────────────────────────────────────── */

export async function sponsorLogout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SPONSOR_COOKIE)
}

/* ── Get sponsor session (from cookie) ────────────────────────────────── */

export async function getSponsorSession(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SPONSOR_COOKIE)?.value ?? null
}

/* ── Get sponsor profile ──────────────────────────────────────────────── */

export async function getSponsorProfile(sponsorId: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: sponsor, error } = await supabase
      .from("sponsors")
      .select(
        `
        id, event_id, name, tier, logo_url, website, description,
        contact_email, contact_phone, website_url, booth_details,
        last_login_at, created_at,
        events(id, title, slug, start_date, end_date, venue, status)
      `
      )
      .eq("id", sponsorId)
      .single()

    if (error || !sponsor) {
      return { success: false, error: "Sponsor not found.", sponsor: null }
    }

    return { success: true, sponsor }
  } catch (err) {
    return { success: false, error: (err as Error).message, sponsor: null }
  }
}

/* ── Update sponsor profile (limited fields) ──────────────────────────── */

export async function updateSponsorProfile(
  sponsorId: string,
  formData: FormData
) {
  try {
    // Verify the cookie matches the sponsor being updated
    const sessionId = await getSponsorSession()
    if (sessionId !== sponsorId) {
      return { success: false, error: "Unauthorized." }
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const websiteUrl = formData.get("website_url") as string
    const boothDetails = formData.get("booth_details") as string
    const contactPhone = formData.get("contact_phone") as string

    const { error } = await supabase
      .from("sponsors")
      .update({
        website_url: websiteUrl || null,
        booth_details: boothDetails || null,
        contact_phone: contactPhone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sponsorId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Upload sponsor logo ──────────────────────────────────────────────── */

export async function uploadSponsorLogo(sponsorId: string, formData: FormData) {
  try {
    // Verify the cookie matches the sponsor being updated
    const sessionId = await getSponsorSession()
    if (sessionId !== sponsorId) {
      return { success: false, error: "Unauthorized." }
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const file = formData.get("logo") as File | null
    if (!file || file.size === 0) {
      return { success: false, error: "No file provided." }
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "File size must be under 5MB." }
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png"
    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase()
      .slice(0, 50)
    const path = `sponsors/${safeName}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("public_images")
      .upload(path, file, { cacheControl: "3600", upsert: false })

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("public_images").getPublicUrl(path)

    // Update sponsor logo_url
    const { error: updateError } = await supabase
      .from("sponsors")
      .update({
        logo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sponsorId)

    if (updateError) return { success: false, error: updateError.message }
    return { success: true, logoUrl: publicUrl }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── Admin: Set portal access for a sponsor ───────────────────────────── */

export async function setSponsorPortalAccess(
  sponsorId: string,
  contactEmail: string,
  portalPassword: string
) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    if (!contactEmail || !portalPassword) {
      return {
        success: false,
        error: "Contact email and portal password are required.",
      }
    }

    const { error } = await supabase
      .from("sponsors")
      .update({
        contact_email: contactEmail.toLowerCase().trim(),
        portal_password: portalPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sponsorId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
