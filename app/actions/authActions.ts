"use server"

/**
 * ── ADMIN AUTH ACTIONS ───────────────────────────────────────────────
 *
 * Server-side login so we can enforce brute-force lockout and write
 * audit records. The page used to call supabase.auth directly from the
 * client — fine for functionality, useless for defense.
 */

import { cookies, headers } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import {
  isAccountLockedOut,
  recordLoginAttempt,
  writeAuditEvent,
  isIpBlocked,
  isValidEmail,
  adminIpAllowlist,
  ipMatchesAllowlist,
} from "@/lib/security"

function ipFromHeaders(h: Awaited<ReturnType<typeof headers>>): string | null {
  return (
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("cf-connecting-ip") ||
    null
  )
}

export async function adminSignIn(params: {
  email: string
  password: string
}): Promise<{ success: boolean; error?: string }> {
  const hdrs = await headers()
  const ip = ipFromHeaders(hdrs)
  const userAgent = hdrs.get("user-agent")

  // 0. IP blocklist check — admin-controlled deny list
  if (await isIpBlocked(ip)) {
    writeAuditEvent({
      action: "auth.signin.blocked_ip",
      ip,
      userAgent,
      metadata: { email: params.email?.slice(0, 254) },
    })
    // Generic error — don't tell attacker their IP is listed.
    return { success: false, error: "Unable to sign in. If this is unexpected, contact support." }
  }

  // 1. Optional admin IP allow-list (ADMIN_IP_ALLOWLIST env var)
  const allowlist = adminIpAllowlist()
  if (!ipMatchesAllowlist(ip, allowlist)) {
    writeAuditEvent({
      action: "auth.signin.not_in_allowlist",
      ip,
      userAgent,
      metadata: { email: params.email?.slice(0, 254) },
    })
    return { success: false, error: "Unable to sign in. If this is unexpected, contact support." }
  }

  // 2. Input validation
  if (!isValidEmail(params.email)) {
    return { success: false, error: "Invalid credentials." }
  }
  if (!params.password || params.password.length < 1 || params.password.length > 500) {
    return { success: false, error: "Invalid credentials." }
  }

  // 3. Lockout check (5 failures per email OR 10 failures per IP in 15 min)
  if (await isAccountLockedOut(params.email, ip)) {
    writeAuditEvent({
      action: "auth.signin.locked_out",
      ip,
      userAgent,
      metadata: { email: params.email.slice(0, 254) },
    })
    return {
      success: false,
      error: "Too many failed attempts. Try again in 15 minutes.",
    }
  }

  // 4. Actual Supabase auth call
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  })

  const success = !error

  // 5. Record attempt + audit
  await recordLoginAttempt({
    email: params.email,
    ip,
    userAgent,
    success,
  })

  writeAuditEvent({
    action: success ? "auth.signin.success" : "auth.signin.fail",
    actorEmail: params.email.slice(0, 254),
    ip,
    userAgent,
  })

  if (!success) {
    return { success: false, error: "Invalid credentials." }
  }
  return { success: true }
}

/**
 * Server-side sign-out. Wipes the Supabase session + writes a
 * Clear-Site-Data hint via a companion API route (client redirects
 * there after calling this).
 */
export async function adminSignOut(): Promise<{ success: boolean }> {
  const hdrs = await headers()
  const ip = ipFromHeaders(hdrs)
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  await supabase.auth.signOut()

  writeAuditEvent({
    actorId: user?.id ?? null,
    actorEmail: user?.email ?? null,
    action: "auth.signout",
    ip,
    userAgent: hdrs.get("user-agent"),
  })
  return { success: true }
}
