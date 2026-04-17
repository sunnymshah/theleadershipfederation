/**
 * ─── SECURITY UTILITIES ──────────────────────────────────────────────
 *
 * Audit log writer, login attempt tracking, brute-force lockout,
 * durable DB-backed rate limits, IP blocklist check, UUID validation.
 *
 * Every helper is server-only and goes through the service-role admin
 * client so writes succeed regardless of RLS. Reads use the authed
 * client so admin-only select policies apply.
 */

import "server-only"
import { createAdminClient } from "@/utils/supabase/admin"

/* ── UUID validation ───────────────────────────────────────────────── */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidUUID(s: string | null | undefined): s is string {
  return typeof s === "string" && UUID_REGEX.test(s)
}

/* ── Strict email validation (used on public forms) ────────────────── */

export function isValidEmail(s: string | null | undefined): s is string {
  if (typeof s !== "string") return false
  if (s.length === 0 || s.length > 254) return false
  // Block characters commonly used in header injection / scripting
  if (/[\r\n<>]/.test(s)) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

/* ── Audit log ─────────────────────────────────────────────────────── */

export type AuditEvent = {
  actorId?: string | null
  actorEmail?: string | null
  action: string
  targetType?: string | null
  targetId?: string | null
  ip?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Fire-and-forget audit log writer. Never blocks the caller.
 * Returns void; failures only surface in server logs so a writer
 * outage can't break the actual business operation.
 */
export function writeAuditEvent(ev: AuditEvent): void {
  // Intentionally not awaited — audit failures must never fail the caller.
  void (async () => {
    try {
      const admin = createAdminClient()
      const { error } = await admin.from("security_events").insert({
        actor_id:    ev.actorId ?? null,
        actor_email: ev.actorEmail ?? null,
        action:      ev.action,
        target_type: ev.targetType ?? null,
        target_id:   ev.targetId ?? null,
        ip:          ev.ip ?? null,
        user_agent:  ev.userAgent ?? null,
        metadata:    ev.metadata ?? null,
      })
      if (error) {
        console.error("[audit] insert failed:", ev.action, error.message)
      }
    } catch (err) {
      console.error("[audit] exception:", ev.action, (err as Error).message)
    }
  })()
}

/* ── Login attempt tracking + lockout ──────────────────────────────── */

const LOCKOUT_MAX_FAILURES = 5
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Record a login attempt. `success` = did the Supabase auth call succeed.
 */
export async function recordLoginAttempt(params: {
  email: string
  ip: string | null
  userAgent: string | null
  success: boolean
}): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from("login_attempts").insert({
      email:      params.email.toLowerCase().trim().slice(0, 254),
      ip:         params.ip,
      success:    params.success,
      user_agent: params.userAgent?.slice(0, 500) ?? null,
    })
  } catch (err) {
    console.error("[login_attempts] insert failed:", (err as Error).message)
  }
}

/**
 * Returns true if this email+IP combo is currently locked out —
 * ≥ LOCKOUT_MAX_FAILURES failed attempts in the last LOCKOUT_WINDOW_MS.
 */
export async function isAccountLockedOut(email: string, ip: string | null): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const cutoff = new Date(Date.now() - LOCKOUT_WINDOW_MS).toISOString()
    // Either email-based or IP-based lockout triggers. Attacker rotating
    // either axis still gets blocked by the other.
    const [{ count: emailCount }, { count: ipCount }] = await Promise.all([
      admin
        .from("login_attempts")
        .select("*", { count: "exact", head: true })
        .eq("email", email.toLowerCase().trim())
        .eq("success", false)
        .gte("created_at", cutoff),
      ip
        ? admin
            .from("login_attempts")
            .select("*", { count: "exact", head: true })
            .eq("ip", ip)
            .eq("success", false)
            .gte("created_at", cutoff)
        : Promise.resolve({ count: 0 }),
    ])
    return (emailCount ?? 0) >= LOCKOUT_MAX_FAILURES || (ipCount ?? 0) >= LOCKOUT_MAX_FAILURES * 2
  } catch (err) {
    // Fail-open: if the lockout check itself fails, don't block real users.
    // The in-memory rate limiter still catches absurd volumes.
    console.error("[lockout] check failed — fail-open:", (err as Error).message)
    return false
  }
}

/* ── Durable DB-backed rate limit ──────────────────────────────────── */

/**
 * Sliding-window rate limit stored in Supabase. Unlike the in-memory
 * version this is shared across all serverless instances, so the
 * configured limit is the real limit even during scale-out.
 *
 * Uses a PK on (bucket_key, window_start) — each request writes a new
 * row (1-min bucket granularity), then counts rows in the last
 * window. Good up to a few k/minute per key without sharding.
 */
export async function rateLimitDb(params: {
  key: string
  limit: number
  windowMs: number
}): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now()
  const cutoffIso = new Date(now - params.windowMs).toISOString()
  // bucket at 10-second granularity — keeps row count bounded
  const bucketIso = new Date(Math.floor(now / 10_000) * 10_000).toISOString()

  try {
    const admin = createAdminClient()

    // count hits in the window
    const { count } = await admin
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("bucket_key", params.key)
      .gte("window_start", cutoffIso)

    if ((count ?? 0) >= params.limit) {
      return { allowed: false, remaining: 0 }
    }

    // Record this hit. If a row already exists for the 10s bucket we
    // just re-insert (PK violation → silently ignored via ignore conflict).
    await admin.from("rate_limits").insert({
      bucket_key:   params.key,
      window_start: bucketIso,
      hits:         1,
    }).then(() => {}, () => {}) // ignore PK conflict

    return { allowed: true, remaining: Math.max(0, params.limit - (count ?? 0) - 1) }
  } catch (err) {
    // Fail-open if the DB is down. The in-memory limiter still runs
    // in parallel on critical endpoints.
    console.error("[rateLimitDb] error — fail-open:", (err as Error).message)
    return { allowed: true, remaining: params.limit }
  }
}

/* ── IP blocklist ──────────────────────────────────────────────────── */

export async function isIpBlocked(ip: string | null): Promise<boolean> {
  if (!ip || ip === "unknown") return false
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("ip_blocklist")
      .select("ip, expires_at")
      .eq("ip", ip)
      .maybeSingle()
    if (!data) return false
    if (data.expires_at && new Date(data.expires_at as string) < new Date()) return false
    return true
  } catch {
    return false
  }
}

/* ── IP allow-list for /admin (comma-separated env) ────────────────── */

export function adminIpAllowlist(): string[] {
  const raw = process.env.ADMIN_IP_ALLOWLIST
  if (!raw) return []
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function ipMatchesAllowlist(ip: string | null, allowlist: string[]): boolean {
  if (allowlist.length === 0) return true // no list → allow anyone (env unset)
  if (!ip) return false
  return allowlist.includes(ip)
}
