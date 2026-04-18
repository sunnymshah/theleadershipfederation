"use client"

/**
 * ─── ADMIN LOGIN PAGE ────────────────────────────────────────────────────
 *
 * Netflix-style profile picker:
 *   Stage 1  — grid of team profiles fetched from /api/admin/profiles
 *              (no emails leak to anon clients)
 *   Stage 2  — click a profile → zoomed card with password field
 *   Stage 3  — submit → adminSignInByProfileId → /admin
 *
 * Fallback: a "Sign in with email instead" link jumps to the classic
 * email/password form (useful before the team_members table is seeded,
 * or if an admin's profile is temporarily deactivated).
 *
 * Lives in the (auth) route group so it does NOT inherit the console
 * sidebar or auth gate. The (console)/layout.tsx enforces authorization.
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
          // 429 or 500 — fall through to email mode so admin isn't locked out
          setLoadError("Profile list unavailable — use email sign-in below.")
          setProfiles([])
          return
        }
        const json = await res.json()
        if (!cancelled) {
          const list = (json.profiles ?? []) as TeamProfile[]
          setProfiles(list)
          // If the team_members table is empty this is a fresh install —
          // immediately flip to email mode so the bootstrap admin can
          // sign in for the first time.
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
   *  RENDER                                                              *
   * ──────────────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-[#c9a84c]/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 pt-10 pb-8 px-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#e7ab1c] shadow-[0_8px_32px_rgba(201,168,76,0.35)] mb-4">
          <span className="text-[#050505] text-sm font-black tracking-[0.2em]">TLF</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {mode === "email"
            ? "Admin sign in"
            : selected
              ? `Welcome back, ${selected.name.split(" ")[0]}`
              : "Who's working today?"}
        </h1>
        <p className="mt-2 text-sm text-white/50">
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
          {profiles === null && (
            <GridSkeleton />
          )}
          {profiles && profiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
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
            <div className="max-w-md mx-auto text-center text-white/60 text-sm">
              No team profiles yet. Sign in with your email to bootstrap.
            </div>
          )}
          {loadError && (
            <div className="max-w-md mx-auto text-center text-amber-300/80 text-xs mt-6">
              {loadError}
            </div>
          )}

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => { setMode("email"); setError(null) }}
              className="text-xs uppercase tracking-[0.2em] text-white/40 hover:text-[#c9a84c] transition-colors"
            >
              Sign in with email instead
            </button>
          </div>
        </div>
      )}

      {/* Stage 2 — password for selected profile */}
      {mode === "picker" && selected && (
        <div className="relative z-10 px-6 pb-20 max-w-md mx-auto">
          <form
            onSubmit={submitProfile}
            className="rounded-3xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl p-8"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar profile={selected} size={96} />
              <div className="mt-4 text-lg font-semibold">{selected.name}</div>
              {selected.title && (
                <div className="text-xs text-white/50 mt-0.5">{selected.title}</div>
              )}
              {selected.department && (
                <div className="mt-3 inline-flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: selected.accent_color ?? "#c9a84c" }}
                  />
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                    {selected.department}
                  </span>
                </div>
              )}
              <span className="mt-3 inline-block px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] uppercase tracking-[0.18em] text-white/60">
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

            <label htmlFor="pwd" className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
              Password
            </label>
            <input
              id="pwd"
              ref={passwordRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c9a84c]/70 focus:ring-2 focus:ring-[#c9a84c]/20 transition-all"
              placeholder="••••••••"
            />

            {error && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#e7ab1c] text-[#050505] text-sm font-bold tracking-wide shadow-[0_12px_36px_rgba(201,168,76,0.25)] hover:shadow-[0_16px_44px_rgba(201,168,76,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in…" : "Enter workspace"}
            </button>

            <button
              type="button"
              onClick={() => { setSelected(null); setPassword(""); setError(null) }}
              className="mt-4 w-full text-[11px] uppercase tracking-[0.2em] text-white/40 hover:text-white/70 transition-colors"
            >
              ← Choose a different profile
            </button>
          </form>
        </div>
      )}

      {/* Email fallback mode */}
      {mode === "email" && (
        <div className="relative z-10 px-6 pb-20 max-w-md mx-auto">
          <form
            onSubmit={submitEmail}
            className="rounded-3xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl p-8"
          >
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

            <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c9a84c]/70 focus:ring-2 focus:ring-[#c9a84c]/20 transition-all mb-4"
              placeholder="admin@theleadershipfederation.com"
            />

            <label htmlFor="pwd2" className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
              Password
            </label>
            <input
              id="pwd2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#c9a84c]/70 focus:ring-2 focus:ring-[#c9a84c]/20 transition-all"
              placeholder="••••••••"
            />

            {error && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#e7ab1c] text-[#050505] text-sm font-bold tracking-wide shadow-[0_12px_36px_rgba(201,168,76,0.25)] hover:shadow-[0_16px_44px_rgba(201,168,76,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>

            {profiles && profiles.length > 0 && (
              <button
                type="button"
                onClick={() => { setMode("picker"); setError(null) }}
                className="mt-4 w-full text-[11px] uppercase tracking-[0.2em] text-white/40 hover:text-white/70 transition-colors"
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
      className="group flex flex-col items-center focus:outline-none"
    >
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-200 group-hover:scale-[1.06] group-focus-visible:scale-[1.06] group-focus-visible:ring-2 group-focus-visible:ring-[#c9a84c]"
        style={{
          width: "140px",
          height: "140px",
          boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
        }}
      >
        <Avatar profile={profile} size={140} rounded={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="mt-3 text-sm font-medium text-white/85 group-hover:text-white transition-colors text-center truncate max-w-[140px]">
        {profile.name}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/40 truncate max-w-[140px]">
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
  const color = profile.accent_color || "#c9a84c"
  const className = rounded ? "rounded-full" : "rounded-2xl"
  if (profile.avatar_url) {
    const img = (
      <img
        src={profile.avatar_url}
        alt={profile.name}
        width={size}
        height={size}
        className={`${className} object-cover`}
        style={{ width: size, height: size }}
      />
    )
    return img
  }
  return (
    <div
      className={`${className} flex items-center justify-center font-bold`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        color: "#050505",
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-[140px] h-[140px] rounded-2xl bg-white/[0.04] animate-pulse" />
          <div className="mt-3 h-3 w-24 rounded-full bg-white/[0.04] animate-pulse" />
          <div className="mt-2 h-2 w-16 rounded-full bg-white/[0.03] animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <LoginFlow />
    </Suspense>
  )
}
