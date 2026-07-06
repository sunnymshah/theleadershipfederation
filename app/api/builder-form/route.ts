/**
 * POST /api/builder-form — receives submissions from the Form builder
 * block (B23). Validates with zod, inserts into builder_form_submissions
 * via the service-role client, then optionally fans out to the block's
 * webhookUrl (fire-and-forget, 5s timeout).
 *
 * The body shape:
 *   { eventId: uuid, sourcePage: string, fields: Record<string, unknown>, webhookUrl?: string }
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/utils/supabase/admin"
import { isValidUUID } from "@/lib/security"
import { rateLimit } from "@/lib/rate-limit"
import { fireWebhooks } from "@/lib/webhooks"

export const runtime = "nodejs"

const Schema = z.object({
  eventId: z.string(),
  sourcePage: z.string().max(120).optional(),
  fields: z.record(z.string(), z.unknown()).default({}),
  webhookUrl: z.string().url().optional(),
})

/**
 * SSRF guard for the client-supplied per-block webhook URL: https only,
 * a real hostname (never an IP literal, localhost or internal-looking
 * name). Without this, anyone could make the server POST form data to
 * arbitrary internal/external targets.
 */
function isSafeWebhookUrl(raw: string): boolean {
  let u: URL
  try { u = new URL(raw) } catch { return false }
  if (u.protocol !== "https:") return false
  const host = u.hostname.toLowerCase()
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false
  // IPv4 literal or bracketed IPv6 literal → reject
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false
  if (host.includes(":")) return false
  return host.includes(".")
}

export async function POST(req: Request) {
  // Rate limit per IP: 10 per minute.
  const ip =
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  const rl = rateLimit({ key: `builder-form:${ip}`, limit: 10, windowMs: 60 * 1000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many submissions" }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
  }
  const { eventId, sourcePage, fields, webhookUrl } = parsed.data
  if (!isValidUUID(eventId)) {
    return NextResponse.json({ error: "Invalid eventId" }, { status: 400 })
  }
  // Strip honeypot field if present (block-level convention).
  const cleanFields = Object.fromEntries(
    Object.entries(fields).filter(([k]) => k !== "company_website")
  )
  if ("company_website" in fields && typeof fields.company_website === "string" && fields.company_website.length > 0) {
    // Bot — silently succeed.
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from("builder_form_submissions")
    .insert({
      event_id: eventId,
      form_data: cleanFields,
      source_page: sourcePage ?? null,
    })
  if (error) {
    console.error("[builder-form] insert failed:", error.message)
    return NextResponse.json({ error: "Failed to record submission" }, { status: 500 })
  }

  // Fan out to all microsite webhooks subscribed to form.submitted.
  void fireWebhooks(eventId, "form.submitted", {
    event_id: eventId,
    source_page: sourcePage ?? null,
    fields: cleanFields,
  })

  // Optional per-block webhook fan-out (fire and forget, 5s timeout).
  // SSRF-guarded: https-only, no IP-literal/localhost/internal hosts,
  // and redirects are refused so the target can't bounce us elsewhere.
  if (webhookUrl && isSafeWebhookUrl(webhookUrl)) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 5000)
    void fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId, sourcePage, fields: cleanFields }),
      signal: ctrl.signal,
      redirect: "error",
    }).catch((err) => {
      console.error("[builder-form] webhook failed:", (err as Error).message)
    }).finally(() => clearTimeout(t))
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
