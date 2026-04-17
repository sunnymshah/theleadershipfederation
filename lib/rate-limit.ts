/**
 * ─── RATE LIMITER ────────────────────────────────────────────────────
 *
 * In-memory sliding-window rate limiter. Zero dependencies, works on
 * serverless — each function instance has its own memory, so the actual
 * limit is "per instance" (usually 2–10× the configured limit in the
 * wild). For tighter enforcement you can swap this out for Upstash or
 * a Supabase rate_limits table later without touching call sites.
 *
 * Enough to stop:
 *   - Casual brute-forcing of the admin login (bots give up fast)
 *   - Contact-form spam bots mass-submitting in a loop
 *   - Attendee lookup email enumeration attempts
 *
 * NOT a substitute for:
 *   - Captcha on public forms (if you're under sustained attack)
 *   - WAF rules in Vercel / Cloudflare
 *
 * Usage:
 *   const res = rateLimit({ key: `contact:${ip}`, limit: 5, windowMs: 60_000 })
 *   if (!res.allowed) return NextResponse.json({ error: "slow down" }, { status: 429 })
 */

type Bucket = {
  hits: Array<number> // timestamps of recent hits
}

const BUCKETS = new Map<string, Bucket>()

/**
 * Garbage-collect buckets older than the longest window. Runs lazily —
 * we only GC when the map gets too big, so it doesn't thrash normal
 * requests.
 */
function gc() {
  if (BUCKETS.size < 500) return
  const oldestToKeep = Date.now() - 60 * 60 * 1000 // 1 hour
  for (const [k, b] of BUCKETS) {
    if (!b.hits.length || b.hits[b.hits.length - 1] < oldestToKeep) {
      BUCKETS.delete(k)
    }
  }
}

export function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string
  limit: number
  windowMs: number
}): { allowed: boolean; remaining: number; retryAfterMs: number } {
  gc()
  const now = Date.now()
  const cutoff = now - windowMs

  const bucket = BUCKETS.get(key) ?? { hits: [] }
  // Drop hits outside the window
  bucket.hits = bucket.hits.filter((t) => t > cutoff)

  if (bucket.hits.length >= limit) {
    const retryAfterMs = Math.max(0, bucket.hits[0] + windowMs - now)
    BUCKETS.set(key, bucket)
    return { allowed: false, remaining: 0, retryAfterMs }
  }

  bucket.hits.push(now)
  BUCKETS.set(key, bucket)
  return { allowed: true, remaining: limit - bucket.hits.length, retryAfterMs: 0 }
}

/**
 * Extract a best-effort client IP from a Next.js Request. Checks
 * common headers in preference order; Vercel always provides
 * x-forwarded-for.
 */
export function clientIp(req: { headers: Headers | { get: (k: string) => string | null } }): string {
  const get = (k: string) => req.headers.get(k)
  return (
    get("x-real-ip") ||
    get("x-forwarded-for")?.split(",")[0].trim() ||
    get("cf-connecting-ip") ||
    "unknown"
  )
}
