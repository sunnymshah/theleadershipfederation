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
import { createAdminClient } from "@/utils/supabase/admin"
import {
  isAccountLockedOut,
  recordLoginAttempt,
  writeAuditEvent,
  isIpBlocked,
  isValidEmail,
  isValidUUID,
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
 * ── Sign in by team_member profile id ───────────────────────────────
 *
 * Used by the Netflix-style profile picker. The client submits the
 * profile id (visible on the picker) and the password — never the email.
 *
 * We resolve profileId → email server-side via the service-role client
 * (bypasses team_members RLS recursion), then feed it into the standard
 * adminSignIn pipeline so all the existing defenses (IP allowlist,
 * blocklist, lockout, audit, honeypot-equivalent email validation) apply.
 *
 * Error messages stay deliberately generic ("Invalid credentials.") so
 * a bad profile id and a bad password look identical to the caller.
 * That's the whole point of not showing emails on the picker.
 */
export async function adminSignInByProfileId(params: {
  profileId: string
  password: string
}): Promise<{ success: boolean; error?: string }> {
  // 1. Validate profile id shape before any DB hit
  if (!isValidUUID(params.profileId)) {
    return { success: false, error: "Invalid credentials." }
  }
  if (!params.password || params.password.length < 1 || params.password.length > 500) {
    return { success: false, error: "Invalid credentials." }
  }

  // 2. Resolve id → email (service role; team_members has recursive RLS)
  let email: string | null = null
  try {
    const admin = createAdminClient()
    const { data: member } = await admin
      .from("team_members")
      .select("email, status")
      .eq("id", params.profileId)
      .maybeSingle()
    // Inactive / suspended profiles should not be able to sign in even
    // if they know the password — the membership table is the gate.
    if (member && (member.status ?? "active") === "active") {
      email = member.email
    }
  } catch (err) {
    console.error("[adminSignInByProfileId] lookup failed:", (err as Error).message)
  }

  // 3. If we couldn't map to an email, audit it as a profile-picker
  //    failure and return the same generic error the real path returns.
  if (!email) {
    const hdrs = await headers()
    writeAuditEvent({
      action: "auth.signin.profile_not_found",
      ip: ipFromHeaders(hdrs),
      userAgent: hdrs.get("user-agent"),
      metadata: { profileId: params.profileId },
    })
    return { success: false, error: "Invalid credentials." }
  }

  // 4. Delegate to the hardened email/password path so every single
  //    defense (blocklist, allowlist, lockout, attempt recording,
  //    audit trail) applies exactly once, in one place.
  return adminSignIn({ email, password: params.password })
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
