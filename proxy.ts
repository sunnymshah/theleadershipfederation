import { type NextRequest } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ["/admin/:path*"],
}

// Custom-domain rewriting (events.example.com → /events/<slug>) is
// implemented as a server action — `resolveCustomDomain` in
// app/actions/domainActions.ts. To enable, expand the `matcher` above
// to include "/" (or "/((?!_next|api|favicon).*)") AND inline a fetch
// to a small /api/resolve-host endpoint that calls resolveCustomDomain
// — middleware runs in the Edge runtime and the service-role Supabase
// client should be exercised via an internal API, not directly imported.
