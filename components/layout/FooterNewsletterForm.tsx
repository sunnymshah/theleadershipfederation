"use client"

import { useState } from "react"
import { ArrowRight, Loader2, Check } from "lucide-react"
import { subscribeToNewsletter } from "@/app/actions/newsletterActions"

const sfText = {
  fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

export function FooterNewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus("loading")
    setErrorMsg("")

    const formData = new FormData()
    formData.set("name", "")
    formData.set("email", email)

    const result = await subscribeToNewsletter(formData)

    if (result.success) {
      setStatus("success")
      setEmail("")
      setTimeout(() => setStatus("idle"), 3000)
    } else {
      setStatus("error")
      setErrorMsg(result.error || "Something went wrong.")
      setTimeout(() => setStatus("idle"), 4000)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubscribe} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 min-w-0 px-4 py-2.5 rounded-full bg-white/[0.08] border border-white/[0.15] text-[13px] text-white placeholder-white/55 focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-colors"
          style={sfText}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[12px] font-bold bg-[#e7ab1c] text-[#1a1a2e] hover:bg-[#d49c10] disabled:opacity-60 transition-all duration-200 shadow-[0_2px_12px_rgba(231,171,28,0.2)]"
          style={sfText}
        >
          {status === "loading" ? (
            <Loader2 size={13} className="animate-spin" />
          ) : status === "success" ? (
            <><Check size={13} /> Subscribed</>
          ) : (
            <>Subscribe <ArrowRight size={12} /></>
          )}
        </button>
      </form>
      {status === "error" && (
        <p className="text-[11px] text-red-400 mt-2 pl-1" style={sfText}>
          {errorMsg}
        </p>
      )}
    </div>
  )
}
