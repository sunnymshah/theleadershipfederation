/**
 * ─── PUBLIC PROFILE LIST ────────────────────────────────────────────────
 *
 * Returns the list of active team members for the Netflix-style login
 * profile picker. Deliberately omits email addresses — we don't want
 * the login page to leak the full admin roster to anonymous visitors.
 *
 * The picker sends (profileId, password) back to `adminSignInByProfileId`,
 * which resolves profileId → email server-side.
 *
 * Rate limits: per-IP sliding window (20 req / minute). A scraper that
 * hits harder gets 429. This is per-serverless-instance so effective
 * limit is somewhat higher in wild — sufficient to stop casual spidering
 * without tripping up the real login page on a shared network.
 */

import { NextResponse } from "next/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { rateLimit, clientIp } from "@/lib/rate-limit"

export const runtime = "nodejs"
// Ensure we don't cache stale profile lists (new hire won't show up otherwise).
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const ip = clientIp(req)
  const rl = rateLimit({
    key: `profiles:${ip}`,
    limit: 20,
    windowMs: 60_000,
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": Math.ceil(rl.retryAfterMs / 1000).toString() } },
    )
  }

  try {
    const admin = createAdminClient()
    // `public_team_profiles` is a view (see migration enhance-team-profiles.sql)
    // that already omits email. We also exclude `user_id` — the picker
    // never needs it, and not surfacing auth UUIDs to anon clients is the
    // safer default.
    const { data, error } = await admin
      .from("public_team_profiles")
      .select("id, name, avatar_url, accent_color, department, title, role")
      .order("name", { ascending: true })

    if (error) {
      // Fall back to team_members directly if the view migration hasn't
      // been applied yet — this keeps the login page working during the
      // deployment window between push and "run the SQL in Supabase".
      const { data: fallback, error: fbErr } = await admin
        .from("team_members")
        .select("id, name, role")
        .order("name", { ascending: true })
      if (fbErr) {
        return NextResponse.json({ error: "Profile list unavailable." }, { status: 500 })
      }
      return NextResponse.json(
        {
          profiles: (fallback ?? []).map((m) => ({
            id: m.id,
            name: m.name,
            avatar_url: null,
            accent_color: "#c9a84c",
            department: null,
            title: null,
            role: m.role,
          })),
          degraded: true,
        },
        {
          headers: {
            // Prevent CDN caching so a new team member shows up immediately
            "Cache-Control": "private, no-store",
          },
        },
      )
    }

    return NextResponse.json(
      { profiles: data ?? [] },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (err) {
    const msg = (err as Error).message ?? "unknown"
    // Don't leak env-var hints to unauthenticated callers.
    console.error("[api/admin/profiles] failed:", msg)
    return NextResponse.json({ error: "Profile list unavailable." }, { status: 500 })
  }
}
