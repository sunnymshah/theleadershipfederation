"use client"

/**
 * Public-side gate that wraps the event microsite. Reads the privacy
 * settings (visibility / password / visibilityMessage) and renders one of:
 *
 *   public      → just renders children
 *   coming_soon → holding page with the event title, countdown, optional
 *                 message, and an email-capture CTA.
 *   password    → password entry form. On match, sets a cookie keyed by
 *                 event id. On mismatch, shows error.
 *
 * NOTE: this is "soft" gating — the password is plain-text in
 * builder_settings. Anyone with developer-tools could read it. This is
 * for pre-launch teasers, NOT a security boundary. Privileged content
 * (registration, payments, admin) lives on different routes that have
 * real auth.
 */

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { Lock, Calendar } from "lucide-react"

type Visibility = "public" | "coming_soon" | "password"

type Props = {
  eventId: string
  eventTitle: string
  eventStartDate: string | null
  visibility?: Visibility
  password?: string
  message?: string
  children: ReactNode
}

const COOKIE_PREFIX = "lf-microsite-pw-"

export function MicrositeVisibilityGate({
  eventId,
  eventTitle,
  eventStartDate,
  visibility = "public",
  password,
  message,
  children,
}: Props) {
  // Public visibility = no gate.
  if (visibility === "public") return <>{children}</>
  if (visibility === "coming_soon") {
    return (
      <ComingSoonGate eventTitle={eventTitle} eventStartDate={eventStartDate} message={message} />
    )
  }
  return (
    <PasswordGate
      eventId={eventId}
      eventTitle={eventTitle}
      password={password ?? ""}
      message={message}
    >
      {children}
    </PasswordGate>
  )
}

/* ─── Coming soon ─────────────────────────────────────────────────── */

function ComingSoonGate({
  eventTitle, eventStartDate, message,
}: {
  eventTitle: string
  eventStartDate: string | null
  message?: string
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const target = eventStartDate ? new Date(eventStartDate).getTime() : null
  const diffMs = target ? Math.max(0, target - now) : 0
  const days = Math.floor(diffMs / 86_400_000)
  const hours = Math.floor((diffMs / 3_600_000) % 24)
  const mins = Math.floor((diffMs / 60_000) % 60)
  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-[#0a0a14] text-white p-6">
      <div className="max-w-xl w-full text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#e7ab1c] mb-4">
          Coming soon
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
          {eventTitle}
        </h1>
        {message && (
          <p className="mt-5 text-[15px] leading-relaxed text-white/70 whitespace-pre-line">
            {message}
          </p>
        )}
        {target && (
          <div className="mt-10 flex items-center justify-center gap-6">
            {[
              { label: "Days", value: days },
              { label: "Hours", value: hours },
              { label: "Minutes", value: mins },
            ].map((u) => (
              <div key={u.label} className="text-center">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center mb-1.5"
                  style={{ background: "rgba(231,171,28,0.10)", border: "1px solid rgba(231,171,28,0.30)" }}>
                  <span className="text-3xl font-bold text-[#e7ab1c] tabular-nums">
                    {u.value.toString().padStart(2, "0")}
                  </span>
                </div>
                <span className="text-[11px] uppercase tracking-wider text-white/50">{u.label}</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-12 text-[12px] text-white/45 inline-flex items-center gap-1.5 justify-center">
          <Calendar size={12} />
          The Leadership Federation ·{" "}
          <Link href="/events" className="underline-offset-2 hover:underline">All events</Link>
        </p>
      </div>
    </main>
  )
}

/* ─── Password ───────────────────────────────────────────────────── */

function PasswordGate({
  eventId, eventTitle, password, message, children,
}: {
  eventId: string
  eventTitle: string
  password: string
  message?: string
  children: ReactNode
}) {
  const cookieKey = `${COOKIE_PREFIX}${eventId}`
  const [unlocked, setUnlocked] = useState<boolean | null>(null)
  const [input, setInput] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof document === "undefined") return
    const cookie = document.cookie.split("; ").find((c) => c.startsWith(`${cookieKey}=`))
    setUnlocked(!!cookie && cookie.split("=")[1] === "1")
  }, [cookieKey])

  if (unlocked === null) {
    return <main className="min-h-[100dvh] flex items-center justify-center bg-white" />
  }
  if (unlocked) return <>{children}</>

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (input.trim() === (password ?? "").trim() && password) {
      // 7-day cookie. Soft gate — not a security boundary.
      document.cookie = `${cookieKey}=1; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`
      setUnlocked(true)
    } else {
      setError("That password isn't right.")
    }
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-white p-6">
      <form onSubmit={submit} className="max-w-sm w-full text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1a1a2e]/5 mb-4">
          <Lock size={20} className="text-[#1a1a2e]/60" />
        </div>
        <h1 className="text-2xl font-bold text-[#1a1a2e]">{eventTitle}</h1>
        <p className="mt-2 text-[13px] text-[#1a1a2e]/65 leading-relaxed">
          {message || "This page is invitation only. Enter the password to view."}
        </p>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Password"
          autoFocus
          className="mt-6 w-full px-4 h-11 rounded-md border border-[#1a1a2e]/15 text-[14px] text-center"
        />
        {error && <p className="mt-2 text-[12px] text-red-700">{error}</p>}
        <button
          type="submit"
          className="mt-3 w-full inline-flex items-center justify-center h-11 rounded-md bg-[var(--lf-primary,#e7ab1c)] text-white text-[13px] font-bold uppercase tracking-wider hover:bg-[#d49c10]"
        >
          Continue
        </button>
      </form>
    </main>
  )
}
