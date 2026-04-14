"use client"

import { useRef, useState, useEffect } from "react"
import { ArrowRight, Loader2, Check, Mail } from "lucide-react"
import { subscribeToNewsletter } from "@/app/actions/newsletterActions"

const sfDisplay = {
  fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}
const sfText = {
  fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

export function NewsletterSection() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus("loading")
    setErrorMsg("")

    const formData = new FormData()
    formData.set("name", name)
    formData.set("email", email)

    const result = await subscribeToNewsletter(formData)

    if (result.success) {
      setStatus("success")
      setName("")
      setEmail("")
      // Reset after 5 seconds
      setTimeout(() => setStatus("idle"), 5000)
    } else {
      setStatus("error")
      setErrorMsg(result.error || "Something went wrong.")
      setTimeout(() => setStatus("idle"), 4000)
    }
  }

  return (
    <section
      ref={ref}
      className="relative py-16 lg:py-20 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #fdf6e3 0%, #fef9ed 50%, #f8f0da 100%)" }}
    >
      {/* Decorative elements */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "800px",
          height: "400px",
          background: "radial-gradient(ellipse at center, rgba(231,171,28,0.08) 0%, transparent 55%)",
        }}
      />

      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #1a1a2e 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
        {/* Icon */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.9)",
            transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#e7ab1c]/10 border border-[#e7ab1c]/20 flex items-center justify-center mx-auto mb-6">
            <Mail size={24} className="text-[#e7ab1c]" strokeWidth={1.8} />
          </div>
        </div>

        {/* Header */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s",
          }}
        >
          <span
            className="text-[11px] tracking-[0.25em] uppercase text-[#e7ab1c] font-semibold"
            style={sfText}
          >
            Stay Connected
          </span>
          <h2
            className="mt-3 text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.08] text-[#1a1a2e] font-bold tracking-[-0.02em]"
            style={sfDisplay}
          >
            Join Our Community
          </h2>
          <p
            className="mt-4 text-[#1a1a2e]/65 text-[15px] leading-[1.7] max-w-md mx-auto"
            style={sfText}
          >
            Get event updates, leadership insights, speaker announcements,
            and exclusive invitations delivered to your inbox.
          </p>
        </div>

        {/* Form */}
        <div
          className="mt-10"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s",
          }}
        >
          {status === "success" ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check size={24} className="text-emerald-600" />
              </div>
              <p
                className="text-[16px] font-semibold text-[#1a1a2e]"
                style={sfText}
              >
                Thank you for subscribing!
              </p>
              <p
                className="text-[13px] text-[#1a1a2e]/60"
                style={sfText}
              >
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
                  className="flex-1 min-w-0 px-5 py-3 rounded-full bg-white border border-[#1a1a2e]/[0.08] text-[14px] text-[#1a1a2e] placeholder-[#1a1a2e]/40 focus:outline-none focus:border-[#e7ab1c]/50 focus:ring-2 focus:ring-[#e7ab1c]/10 transition-colors shadow-sm"
                  style={sfText}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 min-w-0 px-5 py-3 rounded-full bg-white border border-[#1a1a2e]/[0.08] text-[14px] text-[#1a1a2e] placeholder-[#1a1a2e]/40 focus:outline-none focus:border-[#e7ab1c]/50 focus:ring-2 focus:ring-[#e7ab1c]/10 transition-colors shadow-sm"
                  style={sfText}
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-[14px] font-semibold text-white bg-[#1a1a2e] hover:bg-[#2a2a4e] disabled:opacity-60 transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] shadow-[0_4px_16px_rgba(26,26,46,0.2)]"
                style={sfText}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Subscribing...
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
                <p className="text-[13px] text-red-600 mt-2" style={sfText}>
                  {errorMsg}
                </p>
              )}
            </form>
          )}
        </div>

        {/* Trust text */}
        <div
          className="mt-6"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.6s ease 0.4s",
          }}
        >
          <p className="text-[11px] text-[#1a1a2e]/40" style={sfText}>
            No spam, ever. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  )
}
