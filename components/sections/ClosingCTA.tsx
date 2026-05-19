"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Loader2, Check, Mail } from "lucide-react"
import { MagneticButton } from "@/components/ui/MagneticButton"
import { subscribeToNewsletter } from "@/app/actions/newsletterActions"

/**
 * ClosingCTA — the single closing section of the homepage.
 *
 * One light band (Soft Monochrome) that:
 *   • carries the "As featured in" press trust-strip,
 *   • makes the primary "Your seat at the table awaits" call-to-action,
 *   • and folds the newsletter signup into a clean white card.
 *
 * Content is always rendered — no scroll-gated opacity.
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
    <section className="relative bg-[#f5f5f7]">
      <div className="relative max-w-4xl mx-auto px-6 sm:px-10 lg:px-16 py-16 lg:py-24">
        {/* ── Press trust strip ──────────────────────────────────── */}
        <div className="text-center">
          <span className="text-[10px] tracking-[0.24em] uppercase text-[#1d1d1f]/45 font-semibold">
            As Featured In
          </span>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {PRESS_LOGOS.map((name) => (
              <span
                key={name}
                className="text-[12px] font-semibold text-[#1d1d1f]/50 hover:text-[#1d1d1f]/85 transition-colors duration-300 whitespace-nowrap"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="w-12 h-px bg-[#1d1d1f]/12 mx-auto my-14" />

        {/* ── Primary call-to-action ─────────────────────────────── */}
        <div className="text-center">
          <h2 className="text-[clamp(2rem,4.6vw,3.3rem)] leading-[1.05] text-[#1d1d1f] font-bold tracking-[-0.03em]">
            Your seat at the
            <br />
            <span className="text-[#0071e3]">table awaits</span>
          </h2>
          <p className="mt-5 text-[#1d1d1f]/65 text-[16px] leading-relaxed max-w-md mx-auto">
            Whether you are a leader, enterprise, or institution — there is a
            place for you in the conversation that shapes tomorrow.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <MagneticButton>
              <Link
                href="/events"
                className="group inline-flex items-center gap-2.5 px-9 py-[15px] rounded-full font-bold text-[14px] text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-200 shadow-[0_10px_30px_-8px_rgba(0,113,227,0.45)]"
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
              className="inline-flex items-center px-7 py-[14px] rounded-full text-[14px] font-bold text-[#1d1d1f] bg-white border border-black/[0.08] hover:border-black/20 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              Join Inner Circle
            </Link>
            <Link
              href="/partners"
              className="inline-flex items-center px-7 py-[14px] rounded-full text-[14px] font-bold text-[#1d1d1f] bg-white border border-black/[0.08] hover:border-black/20 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              Partner With Us
            </Link>
          </div>
        </div>

        {/* ── Newsletter — clean white card ──────────────────────── */}
        <div className="mt-16 max-w-xl mx-auto rounded-3xl bg-white border border-black/[0.07] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.22)] px-7 py-9 sm:px-10 sm:py-10 text-center">
          <div className="w-13 h-13 rounded-2xl bg-[#0071e3]/[0.08] border border-[#0071e3]/15 flex items-center justify-center mx-auto mb-5 p-3">
            <Mail size={22} className="text-[#0071e3]" strokeWidth={1.8} />
          </div>
          <span className="text-[11px] tracking-[0.24em] uppercase text-[#0071e3] font-bold">
            Stay Connected
          </span>
          <h3 className="mt-2.5 text-[clamp(1.5rem,3vw,2rem)] leading-[1.1] text-[#1d1d1f] font-bold tracking-[-0.02em]">
            Join Our Community
          </h3>
          <p className="mt-3 text-[#1d1d1f]/60 text-[14px] leading-[1.7] max-w-sm mx-auto">
            Event updates, leadership insights, speaker announcements, and
            exclusive invitations — straight to your inbox.
          </p>

          <div className="mt-7">
            {status === "success" ? (
              <div className="flex flex-col items-center gap-2.5 py-4">
                <div className="w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <Check size={22} className="text-emerald-600" />
                </div>
                <p className="text-[15px] font-semibold text-[#1d1d1f]">
                  Thank you for subscribing!
                </p>
                <p className="text-[13px] text-[#1d1d1f]/55">
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
                    className="flex-1 min-w-0 px-5 py-3 rounded-full bg-[#f5f5f7] border border-black/[0.08] text-[14px] text-[#1d1d1f] placeholder-[#1d1d1f]/40 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:bg-white transition-all"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 min-w-0 px-5 py-3 rounded-full bg-[#f5f5f7] border border-black/[0.08] text-[14px] text-[#1d1d1f] placeholder-[#1d1d1f]/40 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:bg-white transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="group w-full inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-[14px] font-bold text-white bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-60 transition-all duration-200 shadow-[0_8px_24px_-8px_rgba(0,113,227,0.45)]"
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
                  <p className="text-[13px] text-red-500">{errorMsg}</p>
                )}
              </form>
            )}
          </div>

          <p className="mt-5 text-[11px] text-[#1d1d1f]/35">
            No spam, ever. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  )
}
