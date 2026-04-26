/**
 * Vercel cron: every 5 minutes. Picks up any events whose
 * builder_scheduled_publish_at is in the past and publishes them.
 *
 * Protected by CRON_SECRET — Vercel sends `Authorization: Bearer <secret>`
 * automatically when the route is registered in vercel.json.
 */

import { NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { publishBuilderAtomic } from "@/app/actions/eventBuilderActions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization") ?? ""
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  let admin
  try { admin = createAdminClient() } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
  const nowIso = new Date().toISOString()
  const { data: due, error } = await admin
    .from("events")
    .select("id, slug")
    .lte("builder_scheduled_publish_at", nowIso)
    .not("builder_scheduled_publish_at", "is", null)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const results: Array<{ id: string; ok: boolean; error?: string }> = []
  for (const ev of (due ?? []) as Array<{ id: string; slug: string }>) {
    try {
      const res = await publishBuilderAtomic(ev.id, undefined, "Scheduled publish")
      // Clear the schedule once fired so it doesn't run again.
      await admin.from("events")
        .update({ builder_scheduled_publish_at: null })
        .eq("id", ev.id)
      results.push({ id: ev.id, ok: res.success, error: res.error })
    } catch (err) {
      results.push({ id: ev.id, ok: false, error: (err as Error).message })
    }
  }
  return NextResponse.json({ ran: results.length, results })
}
