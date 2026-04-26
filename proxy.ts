import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"

const KNOWN_HOSTS = new Set<string>([
  "localhost", "127.0.0.1", "0.0.0.0",
  "leadershipfederation.com", "www.leadershipfederation.com",
  "theleadershipfederation.vercel.app",
])

// Per-Edge-instance hostname cache. 5-minute TTL — matches the
// Cache-Control on /api/resolve-host so the two layers stay in sync.
const domainCache = new Map<string, { slug: string | null; expires: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

async function resolveHostInternal(req: NextRequest, host: string): Promise<string | null> {
  const cached = domainCache.get(host)
  if (cached && cached.expires > Date.now()) return cached.slug
  try {
    const u = new URL("/api/resolve-host", req.nextUrl.origin)
    u.searchParams.set("host", host)
    const res = await fetch(u, { headers: { accept: "application/json" } })
    if (!res.ok) {
      domainCache.set(host, { slug: null, expires: Date.now() + CACHE_TTL_MS })
      return null
    }
    const json = (await res.json()) as { slug: string | null }
    domainCache.set(host, { slug: json.slug, expires: Date.now() + CACHE_TTL_MS })
    return json.slug
  } catch {
    domainCache.set(host, { slug: null, expires: Date.now() + CACHE_TTL_MS })
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostHeader = (request.headers.get("host") ?? "").toLowerCase().split(":")[0]

  if (pathname.startsWith("/admin")) {
    return await updateSession(request)
  }

  // Custom-domain rewrite — only when the host is NOT a known platform host
  // and the path isn't already namespaced under /events, /api, /_next.
  if (
    hostHeader &&
    !KNOWN_HOSTS.has(hostHeader) &&
    !hostHeader.endsWith(".vercel.app") &&
    !pathname.startsWith("/events/") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/admin/") &&
    pathname !== "/favicon.ico" &&
    pathname !== "/robots.txt" &&
    pathname !== "/sitemap.xml"
  ) {
    const slug = await resolveHostInternal(request, hostHeader)
    if (slug) {
      const target = pathname === "/" ? `/events/${slug}` : `/events/${slug}${pathname}`
      const url = request.nextUrl.clone()
      url.pathname = target
      const res = NextResponse.rewrite(url)
      res.headers.set("x-resolved-event", slug)
      return res
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    // Custom-domain hosts hit anything under "/" — exclude assets so we
    // don't run middleware on every static file.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2)$).*)",
  ],
}
