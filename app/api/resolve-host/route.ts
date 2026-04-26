/**
 * Internal endpoint: maps a custom hostname → event slug.
 * Called from the Edge middleware (proxy.ts) so the Edge runtime
 * doesn't have to import the service-role Supabase client directly.
 *
 * GET /api/resolve-host?host=events.example.com
 * Response: { slug: "gcc-..." } or { slug: null }
 *
 * Cache-Control sends 300s shared cache; the middleware also caches in
 * memory for 5 minutes per Edge instance. Combined, lookups happen at
 * most a few times per minute per region per hostname.
 */

import { NextResponse } from "next/server"
import { resolveCustomDomain } from "@/app/actions/domainActions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const host = (searchParams.get("host") ?? "").trim().toLowerCase()
  if (!host || !/^[a-z0-9.-]+$/.test(host)) {
    return NextResponse.json({ slug: null }, { status: 400 })
  }
  const slug = await resolveCustomDomain(host)
  return NextResponse.json(
    { slug },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  )
}
