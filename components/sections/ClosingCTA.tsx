"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Loader2, Check, Mail } from "lucide-react"
import { MagneticButton } from "@/components/ui/MagneticButton"
import { SectionAmbient } from "@/components/ui/SectionAmbient"
import { subscribeToNewsletter } from "@/app/actions/newsletterActions"

/**
 * ClosingCTA — the single closing section of the homepage.
 *
 * Merges what used to be two separate sections (ExclusivityCTA +
 * NewsletterSection) into one cohesive dark band that:
 *   • carries the "As featured in" press trust-strip,
 *   • makes the primary "Your seat at the table awaits" call-to-action,
 *   • and folds the newsletter signup into a frosted-glass card.
 *
 * One dark navy band flows naturally into the dark footer. Content is
 * always rendered — no scroll-gated opacity (visibility must never
 * depend on an observer firing).
 */

const PRESS_LOGOS = [
  "Gulf News",
  "EIN Presswire",
  "Frost & Sullivan",
  "Business Standard",
  "Economic Times",
  "YourStory",
]

export function ClosingCTA() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus("loading")
    setErrorMsg("")
    const fd = new FormData()
    fd.set("name", name)
    fd.set("email", email)
    const res = await subscribeToNewsletter(fd)
    if (res.success) {
      setStatus("success")
      setName("")
      setEmail("")
      setTimeout(() => setStatus("idle"), 5000)
    } else {
      setStatus("error")
      setErrorMsg(res.error || "Something went wrong.")
      setTimeout(() => setStatus("idle"), 4000)
    }
  }

  return (
    <section className="relative overflow-hidden isolate bg-[#0a0a14]">
      {/* Aurora mesh — gives the dark band colour depth for the glass to
          refract, so it reads as liquid glass not a flat navy slab. */}
      <SectionAmbient variant="b" tone="dark" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 lg:px-16 py-16 lg:py-24">
        {/* ── Press trust strip ──────────────────────────────────── */}
        <div className="text-center">
          <span className="text-[10px] tracking-[0.24em] uppercase text-white/45 font-semibold">
            As Featured In
          </span>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {PRESS_LOGOS.map((name) => (
              <span
                key={name}
                className="text-[12px] font-semibold text-white/55 hover:text-white/90 transition-colors duration-300 whitespace-nowrap"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="w-12 h-px bg-white/10 mx-auto my-14" />

        {/* ── Primary call-to-action ─────────────────────────────── */}
        <div className="text-center">
          <h2 className="text-[clamp(2rem,4.6vw,3.3rem)] leading-[1.05] text-white font-bold tracking-[-0.03em]">
            Your seat at the
            <br />
            <span className="text-[#e7ab1c]">table awaits</span>
          </h2>
          <p className="mt-5 text-white/70 text-[16px] leading-relaxed max-w-md mx-auto">
            Whether you are a leader, enterprise, or institution — there is a
            place for you in the conversation that shapes tomorrow.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <MagneticButton>
              <Link
                href="/events"
                className="group inline-flex items-center gap-2.5 px-9 py-[15px] rounded-full font-bold text-[14px] text-[#1a1a2e] bg-[#e7ab1c] hover:bg-[#f0b93a] transition-all duration-200 shadow-[0_8px_30px_rgba(231,171,28,0.4)]"
              >
                Explore Events
                <ArrowRight
                  size={15}
                  className="group-hover:translate-x-1 transition-transform duration-200"
                />
              </Link>
            </MagneticButton>
            <Link
              href="/inner-circle"
              className="lf-glass-pill inline-flex items-center px-7 py-[14px] rounded-full text-[14px] font-bold text-white active:scale-[0.98]"
            >
              Join Inner Circle
            </Link>
            <Link
              href="/partners"
              className="lf-glass-pill inline-flex items-center px-7 py-[14px] rounded-full text-[14px] font-bold text-white active:scale-[0.98]"
            >
              Partner With Us
            </Link>
          </div>
        </div>

        {/* ── Newsletter — frosted-glass card ────────────────────── */}
        <div className="lf-glass-panel mt-16 max-w-xl mx-auto rounded-3xl px-7 py-9 sm:px-10 sm:py-10 text-center">
          <div className="w-13 h-13 rounded-2xl bg-[#e7ab1c]/15 border border-[#e7ab1c]/25 flex items-center justify-center mx-auto mb-5 p-3">
            <Mail size={22} className="text-[#e7ab1c]" strokeWidth={1.8} />
          </div>
          <span className="text-[11px] tracking-[0.24em] uppercase text-[#e7ab1c] font-bold">
            Stay Connected
          </span>
          <h3 className="mt-2.5 text-[clamp(1.5rem,3vw,2rem)] leading-[1.1] text-white font-bold tracking-[-0.02em]">
            Join Our Community
          </h3>
          <p className="mt-3 text-white/65 text-[14px] leading-[1.7] max-w-sm mx-auto">
            Event updates, leadership insights, speaker announcements, and
            exclusive invitations — straight to your inbox.
          </p>

          <div className="mt-7">
            {status === "success" ? (
              <div className="flex flex-col items-center gap-2.5 py-4">
                <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <Check size={22} className="text-emerald-400" />
                </div>
                <p className="text-[15px] font-semibold text-white">
                  Thank you for subscribing!
                </p>
                <p className="text-[13px] text-white/55">
                  You will receive our next update in your inbox.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="flex-1 min-w-0 px-5 py-3 rounded-full bg-white border border-white/10 text-[14px] text-[#1a1a2e] placeholder-[#1a1a2e]/40 focus:outline-none focus:ring-2 focus:ring-[#e7ab1c]/50 transition-shadow"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 min-w-0 px-5 py-3 rounded-full bg-white border border-white/10 text-[14px] text-[#1a1a2e] placeholder-[#1a1a2e]/40 focus:outline-none focus:ring-2 focus:ring-[#e7ab1c]/50 transition-shadow"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="group w-full inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-[14px] font-bold text-[#1a1a2e] bg-[#e7ab1c] hover:bg-[#f0b93a] disabled:opacity-60 transition-all duration-200 shadow-[0_6px_24px_rgba(231,171,28,0.35)]"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Subscribing…
                    </>
                  ) : (
                    <>
                      Subscribe
                      <ArrowRight
                        size={14}
                        className="group-hover:translate-x-1 transition-transform duration-200"
                      />
                    </>
                  )}
                </button>
                {status === "error" && (
                  <p className="text-[13px] text-red-300">{errorMsg}</p>
                )}
              </form>
            )}
          </div>

          <p className="mt-5 text-[11px] text-white/35">
            No spam, ever. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  )
}
