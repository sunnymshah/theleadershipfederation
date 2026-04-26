/**
 * POST /api/ab/expose — record that a visitor has been shown a variant.
 * Idempotent on (test_id, visitor_id, variant). Insert returns 200; the
 * unique constraint at the DB level isn't enforced (we'd dedupe via the
 * constraint if it existed) so we filter at insert time with a quick
 * lookup. Failure is silently swallowed — exposures are best-effort.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/utils/supabase/admin"
import { isValidUUID } from "@/lib/security"

export const runtime = "nodejs"

const Schema = z.object({
  testId: z.string(),
  visitorId: z.string().min(8).max(120),
  variant: z.string().min(1).max(40),
})

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Bad body" }, { status: 400 }) }
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Bad payload" }, { status: 400 })
  if (!isValidUUID(parsed.data.testId)) return NextResponse.json({ error: "Bad testId" }, { status: 400 })

  try {
    const admin = createAdminClient()
    // Cheap dedupe — no UNIQUE constraint, so look first.
    const { data: existing } = await admin
      .from("event_ab_exposures")
      .select("id")
      .eq("test_id", parsed.data.testId)
      .eq("visitor_id", parsed.data.visitorId)
      .eq("variant", parsed.data.variant)
      .limit(1)
      .maybeSingle()
    if (existing) return NextResponse.json({ ok: true, dedup: true })
    await admin.from("event_ab_exposures").insert({
      test_id: parsed.data.testId,
      visitor_id: parsed.data.visitorId,
      variant: parsed.data.variant,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[ab/expose]", (err as Error).message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
