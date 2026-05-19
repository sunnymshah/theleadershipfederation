"use client"

/**
 * ─── ADMIN LOGIN — LIQUID GLASS ──────────────────────────────────────────
 *
 * Profile-picker sign-in, re-skinned in the liquid-glass / white theme
 * that the admin console + public site now share.
 *
 *   Stage 1  — grid of team profiles fetched from /api/admin/profiles
 *              (no emails leak to anon clients)
 *   Stage 2  — click a profile → glass card with password field
 *   Stage 3  — submit → adminSignInByProfileId → /admin
 *
 * Fallback: "Sign in with email instead" jumps to the classic
 * email/password form (useful before team_members is seeded, or if a
 * profile is temporarily deactivated).
 *
 * Lives in the (auth) route group so it does NOT inherit the console
 * sidebar or auth gate. The auth LOGIC here is unchanged from the
 * previous version — only the surface design was rebuilt.
 */

import { useState, useEffect, Suspense, useRef, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { adminSignIn, adminSignInByProfileId } from "@/app/actions/authActions"

type TeamProfile = {
  id: string
  name: string
  avatar_url: string | null
  accent_color: string | null
  department: string | null
  title: string | null
  role: string
}

/** Theme accent — the Apple-blue used across the new admin + site. */
const ACCENT = "#0071e3"

const ROLE_PILL: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  check_in_staff: "Check-in",
  viewer: "Viewer",
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?"
}

function LoginFlow() {
  const [profiles, setProfiles]       = useState<TeamProfile[] | null>(null)
  const [loadError, setLoadError]     = useState<string | null>(null)
  const [selected, setSelected]       = useState<TeamProfile | null>(null)
  const [password, setPassword]       = useState("")
  const [hp, setHp]                   = useState("")
  const [email, setEmail]             = useState("")
  const [mode, setMode]               = useState<"picker" | "email">("picker")
  const [localError, setLocalError]   = useState<string | null>(null)
  const [submitting, setSubmitting]   = useState(false)

  const passwordRef                   = useRef<HTMLInputElement | null>(null)
  const router                        = useRouter()
  const searchParams                  = useSearchParams()

  // Surface ?error=... sent from the console gate. Computed during render
  // (not in an effect) so React doesn't complain about cascading setState.
  const urlError = useMemo(() => {
    const e = searchParams.get("error")
    if (e === "access-denied") {
      return "This account isn't authorised for the admin console. Contact your super admin."
    }
    return null
  }, [searchParams])

  // Local error (from submits) takes precedence over URL error.
  const error = localError ?? urlError
  const setError = setLocalError

  // Fetch profiles once on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/admin/profiles", { cache: "no-store" })
        if (!res.ok) {
          setLoadError("Profile list unavailable — use email sign-in below.")
          setProfiles([])
          return
        }
        const json = await res.json()
        if (!cancelled) {
          const list = (json.profiles ?? []) as TeamProfile[]
          setProfiles(list)
          // Empty team_members → fresh install: flip to email mode so the
          // bootstrap admin can sign in for the first time.
          if (list.length === 0) setMode("email")
        }
      } catch {
        if (!cancelled) {
          setLoadError("Couldn't load profiles — use email sign-in below.")
          setProfiles([])
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Focus the password field as soon as a profile is selected
  useEffect(() => {
    if (selected) {
      requestAnimationFrame(() => passwordRef.current?.focus())
    }
  }, [selected])

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setError(null)
    if (hp) { setError("Invalid credentials."); return }
    setSubmitting(true)
    const res = await adminSignInByProfileId({ profileId: selected.id, password })
    if (!res.success) {
      setError(res.error ?? "Invalid credentials.")
      setSubmitting(false)
      return
    }
    router.push("/admin")
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (hp) { setError("Invalid credentials."); return }
    setSubmitting(true)
    const res = await adminSignIn({ email, password })
    if (!res.success) {
      setError(res.error ?? "Invalid credentials.")
      setSubmitting(false)
      return
    }
    router.push("/admin")
  }

  /* ──────────────────────────────────────────────────────────────────── *
   *  RENDER — liquid glass on white                                      *
   * ──────────────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] relative overflow-hidden">
      {/* Ambient tonal wash — soft blue blooms give the glass cards real
          colour to refract behind their backdrop blur. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(48% 42% at 16% 12%, rgba(0,113,227,0.10) 0%, transparent 64%), " +
            "radial-gradient(46% 44% at 88% 86%, rgba(0,113,227,0.08) 0%, transparent 66%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 pt-12 pb-8 px-6 text-center">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
          style={{ background: ACCENT }}
        >
          <span className="text-white text-sm font-black tracking-[0.18em]">TLF</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {mode === "email"
            ? "Admin sign in"
            : selected
              ? `Welcome back, ${selected.name.split(" ")[0]}`
              : "Who's working today?"}
        </h1>
        <p className="mt-2 text-sm text-[#6b7280]">
          {mode === "email"
            ? "Enter your credentials to continue."
            : selected
              ? "Enter your password to unlock the workspace."
              : "Select your profile to continue."}
        </p>
      </header>

      {/* Stage 1 — profile grid */}
      {mode === "picker" && !selected && (
        <div className="relative z-10 px-6 pb-20 max-w-5xl mx-auto">
          {profiles === null && <GridSkeleton />}
          {profiles && profiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {profiles.map((p) => (
                <ProfileCard
                  key={p.id}
                  profile={p}
                  onSelect={() => { setSelected(p); setPassword(""); setError(null) }}
                />
              ))}
            </div>
          )}
          {profiles && profiles.length === 0 && !loadError && (
            <div className="max-w-md mx-auto text-center text-[#6b7280] text-sm">
              No team profiles yet. Sign in with your email to bootstrap.
            </div>
          )}
          {loadError && (
            <div className="max-w-md mx-auto text-center text-amber-600 text-xs mt-6">
              {loadError}
            </div>
          )}

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => { setMode("email"); setError(null) }}
              className="text-xs uppercase tracking-[0.2em] text-[#9ca3af] hover:text-[#0071e3] transition-colors"
            >
              Sign in with email instead
            </button>
          </div>
        </div>
      )}

      {/* Stage 2 — password for selected profile */}
      {mode === "picker" && selected && (
        <div className="relative z-10 px-6 pb-20 max-w-md mx-auto">
          <form onSubmit={submitProfile} className="lf-glass-strong rounded-3xl p-8">
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar profile={selected} size={96} />
              <div className="mt-4 text-lg font-semibold">{selected.name}</div>
              {selected.title && (
                <div className="text-xs text-[#6b7280] mt-0.5">{selected.title}</div>
              )}
              {selected.department && (
                <div className="mt-3 inline-flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: selected.accent_color ?? ACCENT }}
                  />
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[#6b7280]">
                    {selected.department}
                  </span>
                </div>
              )}
              <span className="mt-3 inline-block px-2.5 py-0.5 rounded-full bg-[#0071e3]/[0.08] border border-[#0071e3]/15 text-[10px] uppercase tracking-[0.18em] text-[#0071e3]">
                {ROLE_PILL[selected.role] ?? selected.role}
              </span>
            </div>

            {/* Honeypot */}
            <input
              type="text"
              name="company_website"
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
            />

            <label htmlFor="pwd" className="block text-[10px] uppercase tracking-[0.2em] text-[#9ca3af] mb-2">
              Password
            </label>
            <input
              id="pwd"
              ref={passwordRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 h-12 bg-white border border-[#ededf0] rounded-xl text-sm text-[#1d1d1f] placeholder-[#9ca3af] focus:outline-none focus:border-[#0071e3] focus:ring-[3px] focus:ring-[#0071e3]/12 transition-all"
              placeholder="••••••••"
            />

            {error && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full h-12 rounded-xl bg-[#0071e3] text-white text-sm font-semibold tracking-wide hover:bg-[#0077ed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in…" : "Enter workspace"}
            </button>

            <button
              type="button"
              onClick={() => { setSelected(null); setPassword(""); setError(null) }}
              className="mt-4 w-full text-[11px] uppercase tracking-[0.2em] text-[#9ca3af] hover:text-[#1d1d1f] transition-colors"
            >
              ← Choose a different profile
            </button>
          </form>
        </div>
      )}

      {/* Email fallback mode */}
      {mode === "email" && (
        <div className="relative z-10 px-6 pb-20 max-w-md mx-auto">
          <form onSubmit={submitEmail} className="lf-glass-strong rounded-3xl p-8">
            <input
              type="text"
              name="company_website"
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
            />

            <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.2em] text-[#9ca3af] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 h-12 bg-white border border-[#ededf0] rounded-xl text-sm text-[#1d1d1f] placeholder-[#9ca3af] focus:outline-none focus:border-[#0071e3] focus:ring-[3px] focus:ring-[#0071e3]/12 transition-all mb-4"
              placeholder="admin@theleadershipfederation.com"
            />

            <label htmlFor="pwd2" className="block text-[10px] uppercase tracking-[0.2em] text-[#9ca3af] mb-2">
              Password
            </label>
            <input
              id="pwd2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 h-12 bg-white border border-[#ededf0] rounded-xl text-sm text-[#1d1d1f] placeholder-[#9ca3af] focus:outline-none focus:border-[#0071e3] focus:ring-[3px] focus:ring-[#0071e3]/12 transition-all"
              placeholder="••••••••"
            />

            {error && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full h-12 rounded-xl bg-[#0071e3] text-white text-sm font-semibold tracking-wide hover:bg-[#0077ed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>

            {profiles && profiles.length > 0 && (
              <button
                type="button"
                onClick={() => { setMode("picker"); setError(null) }}
                className="mt-4 w-full text-[11px] uppercase tracking-[0.2em] text-[#9ca3af] hover:text-[#1d1d1f] transition-colors"
              >
                ← Back to profile picker
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  )
}

/* ────────── subcomponents ─────────────────────────────────────────── */

function ProfileCard({ profile, onSelect }: { profile: TeamProfile; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="lf-glass group rounded-2xl p-4 flex flex-col items-center transition-transform duration-200 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
    >
      <Avatar profile={profile} size={96} />
      <div className="mt-3 text-sm font-semibold text-[#1d1d1f] transition-colors text-center truncate max-w-full">
        {profile.name}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#9ca3af] truncate max-w-full">
        {profile.department || ROLE_PILL[profile.role] || profile.role}
      </div>
    </button>
  )
}

function Avatar({
  profile,
  size = 80,
  rounded = true,
}: {
  profile: TeamProfile
  size?: number
  rounded?: boolean
}) {
  const color = profile.accent_color || ACCENT
  const className = rounded ? "rounded-full" : "rounded-2xl"
  if (profile.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatar_url}
        alt={profile.name}
        width={size}
        height={size}
        className={`${className} object-cover`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className={`${className} flex items-center justify-center font-bold`}
      style={{
        width: size,
        height: size,
        background: color,
        color: "#ffffff",
        fontSize: Math.round(size * 0.38),
        letterSpacing: "0.04em",
      }}
    >
      {initials(profile.name)}
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="lf-glass rounded-2xl p-4 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-[#0071e3]/[0.06] animate-pulse" />
          <div className="mt-3 h-3 w-24 rounded-full bg-black/[0.05] animate-pulse" />
          <div className="mt-2 h-2 w-16 rounded-full bg-black/[0.04] animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginFlow />
    </Suspense>
  )
}
