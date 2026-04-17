import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

/**
 * Comma/whitespace-separated list of IPs allowed to reach /admin. If
 * unset, all IPs are allowed (auth still gates the console). When set,
 * requests from non-matching IPs get a 403 at the edge — before they
 * even reach the Supabase session check, before any login form is
 * shown. Defense in depth for targeted attackers.
 */
function adminIpAllowlist(): string[] {
  const raw = process.env.ADMIN_IP_ALLOWLIST
  if (!raw) return []
  return raw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)
}

function clientIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    null
  )
}

/** Generate a random 16-byte nonce for CSP script-src. */
function generateNonce(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Buffer.from(arr).toString("base64")
}

export async function updateSession(request: NextRequest) {
  // 0. Admin IP allow-list — blocks requests at the edge
  const allowlist = adminIpAllowlist()
  if (allowlist.length > 0 && request.nextUrl.pathname.startsWith("/admin")) {
    const ip = clientIp(request)
    if (!ip || !allowlist.includes(ip)) {
      return new NextResponse("Forbidden", {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "text/plain",
        },
      })
    }
  }

  // Forward the pathname + a per-request CSP nonce to Server Components.
  // Admin pages can render their inline scripts with the nonce so we can
  // tighten the CSP over time without `'unsafe-inline'`.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", request.nextUrl.pathname)
  const nonce = generateNonce()
  requestHeaders.set("x-nonce", nonce)

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  )

  // Refresh the auth token — keeps sessions alive across requests
  await supabase.auth.getUser()

  return supabaseResponse
}
