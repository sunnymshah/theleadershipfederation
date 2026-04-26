/**
 * POST /api/ab/convert — mark the most recent exposure as converted.
 * Called by the public site when a visitor performs the conversion
 * event (e.g. Register click). Idempotent: subsequent calls are no-ops.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/utils/supabase/admin"

export const runtime = "nodejs"

const Schema = z.object({
  testId: z.string(),
  visitorId: z.string().min(8).max(120),
})

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Bad body" }, { status: 400 }) }
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Bad payload" }, { status: 400 })
  try {
    const admin = createAdminClient()
    const { data: row } = await admin
      .from("event_ab_exposures")
      .select("id, converted")
      .eq("test_id", parsed.data.testId)
      .eq("visitor_id", parsed.data.visitorId)
      .order("exposed_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!row) return NextResponse.json({ ok: false, reason: "no_exposure" })
    if (row.converted) return NextResponse.json({ ok: true, dedup: true })
    await admin.from("event_ab_exposures")
      .update({ converted: true, converted_at: new Date().toISOString() })
      .eq("id", row.id as string)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[ab/convert]", (err as Error).message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
