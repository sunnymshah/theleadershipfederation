"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Loader2,
  Check,
  Mail,
  CalendarDays,
  Crown,
  Handshake,
} from "lucide-react"
import { subscribeToNewsletter } from "@/app/actions/newsletterActions"

/**
 * ClosingCTA — the creative closing finale of the homepage.
 *
 *   • A bold closing headline.
 *   • A "where do you fit?" liquid-glass card with three path rows.
 *   • A liquid-glass newsletter card.
 *   • A quiet press trust-strip.
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

const PATHS = [
  {
    icon: CalendarDays,
    title: "Attend an event",
    desc: "Conclaves, summits & awards",
    href: "/events",
  },
  {
    icon: Crown,
    title: "Join the Inner Circle",
    desc: "Invite-only leadership network",
    href: "/inner-circle",
  },
  {
    icon: Handshake,
    title: "Partner with us",
    desc: "Sponsorship & collaboration",
    href: "/partners",
  },
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
    <section className="relative bg-[#f5f5f7] py-20 lg:py-28 overflow-hidden">
      {/* Tonal backdrop. */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(56% 50% at 50% -4%, rgba(255,255,255,0.95) 0%, transparent 70%), " +
            "radial-gradient(52% 56% at 10% 70%, rgba(0,113,227,0.12) 0%, transparent 70%), " +
            "radial-gradient(50% 54% at 92% 88%, rgba(0,113,227,0.09) 0%, transparent 72%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* ── Closing headline ───────────────────────────────────── */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[12px] tracking-[0.2em] uppercase text-[#0071e3] font-semibold">
            One Last Thing
          </span>
          <h2 className="mt-4 text-[clamp(2.4rem,5.4vw,4rem)] leading-[1.0] text-[#1d1d1f] font-bold tracking-[-0.04em]">
            Your seat at the
            <br />
            <span className="text-[#0071e3]">table awaits</span>
          </h2>
          <p className="mt-5 text-[#1d1d1f]/60 text-[17px] leading-relaxed max-w-md mx-auto">
            Leader, enterprise, or institution — there is a place for you in
            the conversation that shapes tomorrow.
          </p>
        </div>

        {/* ── Two creative glass cards ───────────────────────────── */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Paths card */}
          <div className="lf-glass-strong rounded-[28px] p-6 sm:p-8">
            <h3 className="text-[15px] font-bold text-[#1d1d1f] tracking-[-0.01em]">
              Where do you fit?
            </h3>
            <p className="mt-1 text-[13px] text-[#1d1d1f]/55">
              Pick the door that suits you.
            </p>
            <div className="mt-5 space-y-2.5">
              {PATHS.map(({ icon: Icon, title, desc, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-4 rounded-2xl bg-white/60 border border-black/[0.05] px-4 py-3.5 hover:bg-white transition-all duration-200"
                >
                  <span className="shrink-0 w-11 h-11 rounded-xl bg-[#0071e3]/[0.1] border border-[#0071e3]/15 flex items-center justify-center group-hover:bg-[#0071e3] transition-colors duration-200">
                    <Icon
                      size={19}
                      strokeWidth={1.9}
                      className="text-[#0071e3] group-hover:text-white transition-colors duration-200"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold text-[#1d1d1f] truncate">
                      {title}
                    </span>
                    <span className="block text-[12px] text-[#1d1d1f]/55 truncate">
                      {desc}
                    </span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-[#1d1d1f]/35 group-hover:text-[#0071e3] group-hover:translate-x-1 transition-all duration-200"
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter card */}
          <div className="lf-glass-strong rounded-[28px] p-6 sm:p-8 flex flex-col">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-[#0071e3] flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(0,113,227,0.6)]">
                <Mail size={19} className="text-white" strokeWidth={1.9} />
              </span>
              <div>
                <h3 className="text-[15px] font-bold text-[#1d1d1f] tracking-[-0.01em]">
                  Stay in the loop
                </h3>
                <p className="text-[12px] text-[#1d1d1f]/55">
                  Insights & invitations, monthly.
                </p>
              </div>
            </div>

            <div className="mt-6 flex-1 flex flex-col justify-center">
              {status === "success" ? (
                <div className="flex flex-col items-center gap-2.5 py-6 text-center">
                  <div className="w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                    <Check size={22} className="text-emerald-600" />
                  </div>
                  <p className="text-[15px] font-semibold text-[#1d1d1f]">
                    You&apos;re on the list.
                  </p>
                  <p className="text-[13px] text-[#1d1d1f]/55">
                    Our next update will land in your inbox.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-2.5">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-5 py-3.5 rounded-full bg-white border border-black/[0.08] text-[14px] text-[#1d1d1f] placeholder-[#1d1d1f]/40 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 transition-all"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-5 py-3.5 rounded-full bg-white border border-black/[0.08] text-[14px] text-[#1d1d1f] placeholder-[#1d1d1f]/40 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="group w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-[14px] font-bold text-white bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-60 transition-all duration-200 shadow-[0_12px_30px_-10px_rgba(0,113,227,0.6)]"
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
                    <p className="text-[13px] text-red-500 text-center">{errorMsg}</p>
                  )}
                  <p className="text-[11px] text-[#1d1d1f]/35 text-center pt-1">
                    No spam, ever. Unsubscribe anytime.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ── Press trust strip ──────────────────────────────────── */}
        <div className="mt-16 text-center">
          <span className="text-[10px] tracking-[0.24em] uppercase text-[#1d1d1f]/40 font-semibold">
            As Featured In
          </span>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2.5">
            {PRESS_LOGOS.map((logo) => (
              <span
                key={logo}
                className="text-[12px] font-semibold text-[#1d1d1f]/45 hover:text-[#1d1d1f]/80 transition-colors duration-300 whitespace-nowrap"
              >
                {logo}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
