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
import { fireWebhooks } from "@/lib/webhooks"

export const runtime = "nodejs"

const Schema = z.object({
  eventId: z.string(),
  sourcePage: z.string().max(120).optional(),
  fields: z.record(z.string(), z.unknown()).default({}),
  webhookUrl: z.string().url().optional(),
})

export async function POST(req: Request) {
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
  if (webhookUrl) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 5000)
    void fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId, sourcePage, fields: cleanFields }),
      signal: ctrl.signal,
    }).catch((err) => {
      console.error("[builder-form] webhook failed:", (err as Error).message)
    }).finally(() => clearTimeout(t))
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
