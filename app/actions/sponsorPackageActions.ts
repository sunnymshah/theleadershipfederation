"use server"

/**
 * ─── ENHANCED SPONSOR PORTAL — PACKAGE & ANALYTICS ACTIONS ──────────────
 *
 * CRUD for sponsor_packages (tiered sponsorship), sponsor-to-package
 * assignment, ROI metrics, event-level sponsor analytics, and branded
 * page configuration.
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

async function invalidateCaches(supabase: ReturnType<typeof createClient>, eventId: string) {
  revalidatePath("/admin/sponsors", "page")
  revalidatePath("/admin/events", "page")
  revalidatePath("/admin", "page")
  revalidatePath(`/admin/events/${eventId}`, "page")

  const { data: event } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .single()

  if (event?.slug) {
    revalidatePath(`/events/${event.slug}`, "page")
  }
  revalidatePath("/events", "page")
  revalidatePath("/", "layout")
}

/* ── 1. Create Package ────────────────────────────────────────────────── */

export async function createPackage(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const event_id      = formData.get("event_id") as string
    const name          = formData.get("name") as string
    const tier          = formData.get("tier") as string
    const priceRaw      = formData.get("price") as string
    const currency      = (formData.get("currency") as string) || "INR"
    const benefitsRaw   = formData.get("benefits") as string
    const maxSponsorsRaw = formData.get("max_sponsors") as string
    const booth_size    = formData.get("booth_size") as string
    const logo_placement = formData.get("logo_placement") as string
    const speaking_slot = formData.get("speaking_slot") === "on" || formData.get("speaking_slot") === "true"
    const lead_access   = formData.get("lead_access") !== "false" // default true
    const displayOrderRaw = formData.get("display_order") as string

    if (!event_id || !name || !tier) {
      return { success: false, error: "Event, package name, and tier are required." }
    }

    const validTiers = ["platinum", "gold", "silver", "bronze", "custom"]
    if (!validTiers.includes(tier)) {
      return { success: false, error: `Tier must be one of: ${validTiers.join(", ")}` }
    }

    // Parse benefits: JSON array string or comma-separated
    let benefits: string[] = []
    if (benefitsRaw) {
      try {
        benefits = JSON.parse(benefitsRaw)
      } catch {
        benefits = benefitsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      }
    }

    const price = priceRaw ? parseFloat(priceRaw) : null
    const max_sponsors = maxSponsorsRaw ? parseInt(maxSponsorsRaw, 10) : null
    const display_order = displayOrderRaw ? parseInt(displayOrderRaw, 10) : 0

    const { data, error } = await supabase
      .from("sponsor_packages")
      .insert({
        event_id,
        name,
        tier,
        price,
        currency,
        benefits,
        max_sponsors,
        booth_size: booth_size || null,
        logo_placement: logo_placement || null,
        speaking_slot,
        lead_access,
        display_order,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    await invalidateCaches(supabase, event_id)
    return { success: true, package: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 2. Update Package ────────────────────────────────────────────────── */

export async function updatePackage(packageId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    if (!packageId) return { success: false, error: "Package ID is required." }

    const { data: existing } = await supabase
      .from("sponsor_packages")
      .select("event_id")
      .eq("id", packageId)
      .single()

    if (!existing) return { success: false, error: "Package not found." }

    const name          = formData.get("name") as string
    const tier          = formData.get("tier") as string
    const priceRaw      = formData.get("price") as string
    const currency      = formData.get("currency") as string
    const benefitsRaw   = formData.get("benefits") as string
    const maxSponsorsRaw = formData.get("max_sponsors") as string
    const booth_size    = formData.get("booth_size") as string
    const logo_placement = formData.get("logo_placement") as string
    const speaking_slot = formData.get("speaking_slot") === "on" || formData.get("speaking_slot") === "true"
    const lead_access   = formData.get("lead_access") !== "false"
    const displayOrderRaw = formData.get("display_order") as string

    if (tier) {
      const validTiers = ["platinum", "gold", "silver", "bronze", "custom"]
      if (!validTiers.includes(tier)) {
        return { success: false, error: `Tier must be one of: ${validTiers.join(", ")}` }
      }
    }

    let benefits: string[] | undefined
    if (benefitsRaw) {
      try {
        benefits = JSON.parse(benefitsRaw)
      } catch {
        benefits = benefitsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      }
    }

    const updates: Record<string, unknown> = {}
    if (name) updates.name = name
    if (tier) updates.tier = tier
    if (priceRaw !== null && priceRaw !== undefined) updates.price = parseFloat(priceRaw) || 0
    if (currency) updates.currency = currency
    if (benefits) updates.benefits = benefits
    if (maxSponsorsRaw) updates.max_sponsors = parseInt(maxSponsorsRaw, 10) || null
    if (booth_size !== null) updates.booth_size = booth_size || null
    if (logo_placement !== null) updates.logo_placement = logo_placement || null
    updates.speaking_slot = speaking_slot
    updates.lead_access = lead_access
    if (displayOrderRaw) updates.display_order = parseInt(displayOrderRaw, 10) || 0

    const { data, error } = await supabase
      .from("sponsor_packages")
      .update(updates)
      .eq("id", packageId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    await invalidateCaches(supabase, existing.event_id)
    return { success: true, package: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 3. Delete Package ────────────────────────────────────────────────── */

export async function deletePackage(packageId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    if (!packageId) return { success: false, error: "Package ID is required." }

    const { data: existing } = await supabase
      .from("sponsor_packages")
      .select("event_id")
      .eq("id", packageId)
      .single()

    if (!existing) return { success: false, error: "Package not found." }

    // Unlink any sponsors referencing this package
    await supabase
      .from("sponsors")
      .update({ package_id: null })
      .eq("package_id", packageId)

    const { error } = await supabase
      .from("sponsor_packages")
      .delete()
      .eq("id", packageId)

    if (error) return { success: false, error: error.message }
    await invalidateCaches(supabase, existing.event_id)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 4. Get Event Packages ────────────────────────────────────────────── */

export async function getEventPackages(eventId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    if (!eventId) return { success: false, error: "Event ID is required.", packages: [] }

    const { data: packages, error } = await supabase
      .from("sponsor_packages")
      .select("*")
      .eq("event_id", eventId)
      .order("display_order", { ascending: true })

    if (error) return { success: false, error: error.message, packages: [] }

    // Count sponsors assigned to each package
    const packageIds = (packages ?? []).map((p) => p.id)

    let sponsorCounts = new Map<string, number>()
    if (packageIds.length) {
      const { data: sponsors } = await supabase
        .from("sponsors")
        .select("package_id")
        .in("package_id", packageIds)

      if (sponsors) {
        for (const s of sponsors) {
          if (s.package_id) {
            sponsorCounts.set(s.package_id, (sponsorCounts.get(s.package_id) || 0) + 1)
          }
        }
      }
    }

    const enriched = (packages ?? []).map((p) => ({
      ...p,
      sponsor_count: sponsorCounts.get(p.id) || 0,
    }))

    return { success: true, packages: enriched }
  } catch (err) {
    return { success: false, error: (err as Error).message, packages: [] }
  }
}

/* ── 5. Assign Sponsor to Package ─────────────────────────────────────── */

export async function assignSponsorToPackage(sponsorId: string, packageId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    if (!sponsorId || !packageId) {
      return { success: false, error: "Sponsor ID and Package ID are required." }
    }

    // Verify package exists and check capacity
    const { data: pkg } = await supabase
      .from("sponsor_packages")
      .select("id, event_id, max_sponsors")
      .eq("id", packageId)
      .single()

    if (!pkg) return { success: false, error: "Package not found." }

    if (pkg.max_sponsors) {
      const { count } = await supabase
        .from("sponsors")
        .select("id", { count: "exact", head: true })
        .eq("package_id", packageId)

      if (count !== null && count >= pkg.max_sponsors) {
        return { success: false, error: "This package has reached its maximum number of sponsors." }
      }
    }

    const { data, error } = await supabase
      .from("sponsors")
      .update({ package_id: packageId })
      .eq("id", sponsorId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    await invalidateCaches(supabase, pkg.event_id)
    return { success: true, sponsor: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 6. Sponsor ROI ───────────────────────────────────────────────────── */

export async function getSponsorROI(sponsorId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    if (!sponsorId) return { success: false, error: "Sponsor ID is required." }

    // Fetch sponsor with package details
    const { data: sponsor, error: sponsorErr } = await supabase
      .from("sponsors")
      .select("id, name, package_id, booth_visits, event_id")
      .eq("id", sponsorId)
      .single()

    if (sponsorErr || !sponsor) {
      return { success: false, error: sponsorErr?.message ?? "Sponsor not found." }
    }

    // Get package price (investment)
    let totalInvestment = 0
    if (sponsor.package_id) {
      const { data: pkg } = await supabase
        .from("sponsor_packages")
        .select("price, currency")
        .eq("id", sponsor.package_id)
        .single()

      if (pkg?.price) totalInvestment = Number(pkg.price)
    }

    // Get leads captured
    const { data: leads } = await supabase
      .from("sponsor_leads")
      .select("id, follow_up_status")
      .eq("sponsor_id", sponsorId)

    const leadsCaptured = leads?.length ?? 0

    // Calculate lead conversion breakdown
    const statusCounts = { contacted: 0, meeting_set: 0, closed: 0 }
    if (leads) {
      for (const lead of leads) {
        const status = lead.follow_up_status as string
        if (status === "contacted") statusCounts.contacted++
        if (status === "meeting_set") statusCounts.meeting_set++
        if (status === "closed") statusCounts.closed++
      }
    }

    const conversionRate = leadsCaptured > 0
      ? {
          contacted: Math.round((statusCounts.contacted / leadsCaptured) * 100),
          meeting_set: Math.round((statusCounts.meeting_set / leadsCaptured) * 100),
          closed: Math.round((statusCounts.closed / leadsCaptured) * 100),
        }
      : { contacted: 0, meeting_set: 0, closed: 0 }

    return {
      success: true,
      roi: {
        sponsor_id: sponsorId,
        sponsor_name: sponsor.name,
        leads_captured: leadsCaptured,
        lead_conversion_rate: conversionRate,
        booth_visits: sponsor.booth_visits ?? 0,
        total_investment: totalInvestment,
        cost_per_lead: leadsCaptured > 0 ? Math.round(totalInvestment / leadsCaptured) : null,
      },
    }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 7. Event Sponsor Analytics ───────────────────────────────────────── */

export async function getEventSponsorAnalytics(eventId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    if (!eventId) return { success: false, error: "Event ID is required." }

    // Get all sponsors for this event with their packages
    const { data: sponsors, error: spErr } = await supabase
      .from("sponsors")
      .select("id, name, tier, package_id, booth_visits")
      .eq("event_id", eventId)

    if (spErr) return { success: false, error: spErr.message }

    const sponsorIds = (sponsors ?? []).map((s) => s.id)
    const packageIds = (sponsors ?? [])
      .map((s) => s.package_id)
      .filter((pid): pid is string => !!pid)

    // Get package prices for revenue calculation
    let totalRevenue = 0
    const tierBreakdown: Record<string, number> = {}

    if (packageIds.length) {
      const { data: packages } = await supabase
        .from("sponsor_packages")
        .select("id, price, tier")
        .in("id", packageIds)

      const priceMap = new Map<string, number>()
      if (packages) {
        for (const pkg of packages) {
          priceMap.set(pkg.id, Number(pkg.price) || 0)
        }
      }

      for (const s of sponsors ?? []) {
        const tier = s.tier || "custom"
        tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1

        if (s.package_id && priceMap.has(s.package_id)) {
          totalRevenue += priceMap.get(s.package_id)!
        }
      }
    } else {
      // Still count tier breakdown even without packages
      for (const s of sponsors ?? []) {
        const tier = s.tier || "custom"
        tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1
      }
    }

    // Get total leads captured across all sponsors for this event
    let totalLeads = 0
    if (sponsorIds.length) {
      const { count } = await supabase
        .from("sponsor_leads")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .in("sponsor_id", sponsorIds)

      totalLeads = count ?? 0
    }

    // Calculate average ROI (cost per lead across all sponsors)
    const averageROI = totalLeads > 0 ? Math.round(totalRevenue / totalLeads) : null

    return {
      success: true,
      analytics: {
        event_id: eventId,
        total_sponsors: sponsors?.length ?? 0,
        total_sponsorship_revenue: totalRevenue,
        sponsors_by_tier: tierBreakdown,
        total_leads_captured: totalLeads,
        average_cost_per_lead: averageROI,
        total_booth_visits: (sponsors ?? []).reduce((sum, s) => sum + (s.booth_visits ?? 0), 0),
      },
    }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ── 8. Update Sponsor Branded Page ───────────────────────────────────── */

export async function updateSponsorBrandedPage(
  sponsorId: string,
  slug: string,
  config: Record<string, unknown>
) {
  try {
    const { supabase } = await getAuthenticatedClient()

    if (!sponsorId) return { success: false, error: "Sponsor ID is required." }
    if (!slug) return { success: false, error: "Branded page slug is required." }

    // Ensure slug is URL-safe
    const safeSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/^-|-$/g, "")

    if (!safeSlug) return { success: false, error: "Slug must contain valid characters." }

    // Check slug uniqueness
    const { data: conflict } = await supabase
      .from("sponsors")
      .select("id")
      .eq("branded_page_slug", safeSlug)
      .neq("id", sponsorId)
      .maybeSingle()

    if (conflict) {
      return { success: false, error: "This branded page slug is already in use." }
    }

    const { data: sponsor, error } = await supabase
      .from("sponsors")
      .update({
        branded_page_slug: safeSlug,
        branded_page_config: config,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sponsorId)
      .select("id, name, event_id, branded_page_slug, branded_page_config")
      .single()

    if (error) return { success: false, error: error.message }

    if (sponsor?.event_id) {
      await invalidateCaches(supabase, sponsor.event_id)
    }
    // Also revalidate the branded page path
    revalidatePath(`/sponsors/${safeSlug}`, "page")

    return { success: true, sponsor }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
