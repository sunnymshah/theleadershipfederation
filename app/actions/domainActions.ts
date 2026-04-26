"use server"

/**
 * Custom-domain admin actions.
 * Stores hostname + status under events.builder_settings.domain.
 * Reaches out to the Vercel Domains API for add / verify / remove.
 */

import { createAdminClient } from "@/utils/supabase/admin"
import { requirePermission } from "@/lib/server-permissions"
import { addDomain, getDomainStatus, removeDomain } from "@/lib/vercel-domains"

function isValidHostname(h: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(h)
}

async function patchDomainSettings(
  eventId: string,
  patch: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()
  const { data: row } = await admin
    .from("events")
    .select("builder_settings")
    .eq("id", eventId)
    .maybeSingle()
  const settings = (row?.builder_settings ?? {}) as Record<string, unknown>
  const current = (settings.domain ?? {}) as Record<string, unknown>
  const next = { ...settings, domain: { ...current, ...patch } }
  const { error } = await admin
    .from("events")
    .update({ builder_settings: next, updated_at: new Date().toISOString() })
    .eq("id", eventId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function addCustomDomain(
  eventId: string,
  hostname: string,
): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const h = hostname.trim().toLowerCase()
    if (!isValidHostname(h)) return { success: false, error: "Invalid hostname." }
    const res = await addDomain(h)
    const status = res.ok ? "pending" : "error"
    await patchDomainSettings(eventId, { domain: h, status, last_response: res.body })
    return res.ok
      ? { success: true, status }
      : { success: false, status, error: `Vercel responded ${res.status}` }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function verifyCustomDomain(
  eventId: string,
  hostname: string,
): Promise<{ success: boolean; verified: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const res = await getDomainStatus(hostname)
    await patchDomainSettings(eventId, {
      status: res.verified ? "verified" : "pending",
      verified_at: res.verified ? new Date().toISOString() : null,
      last_response: res.body,
    })
    return { success: true, verified: res.verified }
  } catch (err) {
    return { success: false, verified: false, error: (err as Error).message }
  }
}

export async function removeCustomDomain(
  eventId: string,
  hostname: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    await removeDomain(hostname)
    await patchDomainSettings(eventId, { domain: null, status: null, verified_at: null })
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/** Edge-side resolver: returns event slug for a custom domain, or null. */
export async function resolveCustomDomain(hostname: string): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("events")
      .select("slug, builder_settings")
      .filter("builder_settings->domain->>domain", "eq", hostname)
      .maybeSingle()
    if (!data) return null
    return (data.slug as string) ?? null
  } catch {
    return null
  }
}
