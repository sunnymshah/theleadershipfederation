"use client"

/**
 * ─── ADMIN LOGIN PAGE ────────────────────────────────────────────────────
 *
 * Clean, dark-mode login screen using Supabase email/password auth.
 * Lives in the (auth) route group so it does NOT inherit the
 * console sidebar or auth gate.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export default function AdminLoginPage() {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const router   = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/admin")
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F8FF] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#e7ab1c] mb-4 shadow-[0_8px_24px_rgba(231,171,28,0.30)]">
            <span className="text-white text-sm font-extrabold tracking-widest">
              TLF
            </span>
          </div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Admin Console</h1>
          <p className="text-sm text-[#1a1a2e]/55 mt-1">
            Sign in to manage events, tickets & speakers
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5 bg-white p-7 rounded-2xl shadow-sm border border-[#1a1a2e]/[0.06]">
          <div>
            <label
              htmlFor="email"
              className="block text-[11px] text-[#1a1a2e]/55 uppercase tracking-wider mb-1.5 font-medium"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#F4F8FF] border border-[#1a1a2e]/[0.08] rounded-lg text-sm text-[#1a1a2e] placeholder-[#1a1a2e]/35 focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all"
              placeholder="admin@theleadershipfederation.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] text-[#1a1a2e]/55 uppercase tracking-wider mb-1.5 font-medium"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#F4F8FF] border border-[#1a1a2e]/[0.08] rounded-lg text-sm text-[#1a1a2e] placeholder-[#1a1a2e]/35 focus:outline-none focus:border-[#e7ab1c]/60 focus:ring-2 focus:ring-[#e7ab1c]/15 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#e7ab1c] text-white text-sm font-bold tracking-wide hover:bg-[#d49c10] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_24px_rgba(231,171,28,0.25)]"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}
