"use client"

/**
 * ─── ADMIN LOGIN — SPLIT-SCREEN ──────────────────────────────────────────
 *
 * Premium split layout: a dark brand panel on the left, a clean white
 * sign-in column on the right.
 *
 *   Stage 1  — vertical list of team profiles fetched from
 *              /api/admin/profiles (no emails leak to anon clients)
 *   Stage 2  — pick a profile → password field
 *   Stage 3  — submit → adminSignInByProfileId → /admin
 *
 * Fallback: "Sign in with email instead" → classic email/password form
 * (used before team_members is seeded, or if a profile is deactivated).
 *
 * The auth LOGIC is unchanged from the previous version — only the
 * layout + surface were rebuilt.
 */

import { useState, useEffect, Suspense, useRef, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronRight, ArrowLeft } from "lucide-react"
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

  const urlError = useMemo(() => {
    const e = searchParams.get("error")
    if (e === "access-denied") {
      return "This account isn't authorised for the admin console. Contact your super admin."
    }
    return null
  }, [searchParams])

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

  const heading =
    mode === "email"
      ? "Admin sign in"
      : selected
        ? `Welcome back, ${selected.name.split(" ")[0]}`
        : "Who's working today?"
  const subheading =
    mode === "email"
      ? "Enter your credentials to continue."
      : selected
        ? "Enter your password to unlock the console."
        : "Choose your profile to continue."

  /* ──────────────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen flex bg-white text-[#1d1d1f]">
      {/* ══ LEFT — dark brand panel (desktop only) ══════════════════════ */}
      <aside className="hidden lg:flex w-[44%] max-w-[620px] relative overflow-hidden bg-[#0a0a14] text-white flex-col justify-between p-12 xl:p-16">
        {/* Aurora */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(46% 40% at 18% 16%, rgba(0,113,227,0.42) 0%, transparent 62%), " +
              "radial-gradient(50% 44% at 88% 90%, rgba(0,113,227,0.26) 0%, transparent 64%), " +
              "radial-gradient(40% 36% at 92% 8%, rgba(120,90,230,0.22) 0%, transparent 60%)",
          }}
        />

        {/* Brand mark */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: ACCENT }}
          >
            <span className="text-white text-[13px] font-black tracking-[0.16em]">TLF</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white/90">
            The Leadership Federation
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <h2 className="text-[34px] xl:text-[42px] font-semibold leading-[1.1] tracking-[-0.02em]">
            Run every conclave
            <br />
            from one console.
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-white/55 max-w-sm">
            Events, attendees, pipeline, payments and the public site — the
            entire Federation, managed in one place.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[12px] text-white/35">
          © {new Date().getFullYear()} The Leadership Federation · Admin console
        </div>
      </aside>

      {/* ══ RIGHT — sign-in column ══════════════════════════════════════ */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile brand mark */}
          <div className="lg:hidden flex items-center gap-2.5 mb-9">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: ACCENT }}
            >
              <span className="text-white text-[11px] font-black tracking-[0.14em]">TLF</span>
            </div>
            <span className="text-[14px] font-semibold tracking-tight">
              The Leadership Federation
            </span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            {selected && (
              <button
                type="button"
                onClick={() => { setSelected(null); setPassword(""); setError(null) }}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6b7280] hover:text-[#1d1d1f] transition-colors mb-4"
              >
                <ArrowLeft size={13} /> All profiles
              </button>
            )}
            <h1 className="text-[26px] sm:text-[28px] font-semibold tracking-tight">
              {heading}
            </h1>
            <p className="mt-1.5 text-[13.5px] text-[#6b7280]">{subheading}</p>
          </div>

          {/* ── Stage 1 — profile list ─────────────────────────────── */}
          {mode === "picker" && !selected && (
            <div>
              {profiles === null && <ListSkeleton />}

              {profiles && profiles.length > 0 && (
                <div className="space-y-2">
                  {profiles.map((p) => (
                    <ProfileRow
                      key={p.id}
                      profile={p}
                      onSelect={() => { setSelected(p); setPassword(""); setError(null) }}
                    />
                  ))}
                </div>
              )}

              {profiles && profiles.length === 0 && !loadError && (
                <p className="text-[13px] text-[#6b7280]">
                  No team profiles yet. Sign in with your email to bootstrap.
                </p>
              )}
              {loadError && (
                <p className="text-[12px] text-amber-600 mt-2">{loadError}</p>
              )}
              {error && <ErrorNote text={error} />}

              <button
                type="button"
                onClick={() => { setMode("email"); setError(null) }}
                className="mt-7 text-[12px] font-medium uppercase tracking-[0.16em] text-[#9ca3af] hover:text-[#0071e3] transition-colors"
              >
                Sign in with email instead
              </button>
            </div>
          )}

          {/* ── Stage 2 — password for selected profile ───────────── */}
          {mode === "picker" && selected && (
            <form onSubmit={submitProfile}>
              <div className="flex items-center gap-3.5 mb-6 p-3 rounded-2xl border border-[#ededf0] bg-[#fafbfc]">
                <Avatar profile={selected} size={48} />
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold truncate">{selected.name}</div>
                  <div className="text-[12px] text-[#6b7280] truncate">
                    {selected.title || selected.department || (ROLE_PILL[selected.role] ?? selected.role)}
                  </div>
                </div>
              </div>

              <Honeypot value={hp} onChange={setHp} />

              <Field label="Password">
                <input
                  ref={passwordRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={inputCls}
                  placeholder="••••••••"
                />
              </Field>

              {error && <ErrorNote text={error} />}

              <SubmitButton submitting={submitting} label="Enter console" />
            </form>
          )}

          {/* ── Stage 3 — email fallback ──────────────────────────── */}
          {mode === "email" && (
            <form onSubmit={submitEmail}>
              <Honeypot value={hp} onChange={setHp} />

              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputCls}
                  placeholder="admin@theleadershipfederation.com"
                />
              </Field>

              <div className="h-3.5" />

              <Field label="Password">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={inputCls}
                  placeholder="••••••••"
                />
              </Field>

              {error && <ErrorNote text={error} />}

              <SubmitButton submitting={submitting} label="Sign in" />

              {profiles && profiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setMode("picker"); setError(null) }}
                  className="mt-4 w-full text-[12px] font-medium uppercase tracking-[0.16em] text-[#9ca3af] hover:text-[#1d1d1f] transition-colors"
                >
                  ← Back to profile picker
                </button>
              )}
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

/* ────────── shared bits ────────────────────────────────────────────── */

const inputCls =
  "w-full px-4 h-12 bg-white border border-[#ededf0] rounded-xl text-[14px] text-[#1d1d1f] " +
  "placeholder-[#9ca3af] focus:outline-none focus:border-[#0071e3] focus:ring-[3px] " +
  "focus:ring-[#0071e3]/12 transition-all"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af] mb-1.5">
        {label}
      </span>
      {children}
    </label>
  )
}

function SubmitButton({ submitting, label }: { submitting: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="mt-6 w-full h-12 rounded-xl bg-[#0071e3] text-white text-[14px] font-semibold tracking-wide hover:bg-[#0077ed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {submitting ? "Signing in…" : label}
    </button>
  )
}

function ErrorNote({ text }: { text: string }) {
  return (
    <div className="mt-3.5 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[12.5px]">
      {text}
    </div>
  )
}

function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      name="company_website"
      autoComplete="off"
      tabIndex={-1}
      aria-hidden="true"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
    />
  )
}

function ProfileRow({ profile, onSelect }: { profile: TeamProfile; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-full flex items-center gap-3.5 p-3 rounded-2xl border border-[#ededf0] bg-white hover:border-[#0071e3]/40 hover:bg-[#0071e3]/[0.03] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
    >
      <Avatar profile={profile} size={44} />
      <div className="min-w-0 flex-1 text-left">
        <div className="text-[14px] font-semibold text-[#1d1d1f] truncate">{profile.name}</div>
        <div className="text-[12px] text-[#9ca3af] truncate">
          {profile.department || ROLE_PILL[profile.role] || profile.role}
        </div>
      </div>
      <ChevronRight
        size={16}
        className="shrink-0 text-[#c4c4cc] group-hover:text-[#0071e3] group-hover:translate-x-0.5 transition-all"
      />
    </button>
  )
}

function Avatar({ profile, size = 44 }: { profile: TeamProfile; size?: number }) {
  const color = profile.accent_color || ACCENT
  if (profile.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatar_url}
        alt={profile.name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: color,
        color: "#ffffff",
        fontSize: Math.round(size * 0.38),
        letterSpacing: "0.03em",
      }}
    >
      {initials(profile.name)}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5 p-3 rounded-2xl border border-[#ededf0]">
          <div className="w-11 h-11 rounded-full bg-black/[0.05] animate-pulse" />
          <div className="flex-1">
            <div className="h-3 w-32 rounded-full bg-black/[0.05] animate-pulse" />
            <div className="mt-2 h-2 w-20 rounded-full bg-black/[0.04] animate-pulse" />
          </div>
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
