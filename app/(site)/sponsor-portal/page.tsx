"use client"

/**
 * ─── SPONSOR PORTAL LOGIN ───────────────────────────────────────────────
 *
 * Public-facing login page for sponsors to access their self-service portal.
 * Uses simple email + portal password authentication (not Supabase Auth).
 * Light theme matching the public site with gold accents.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { sponsorLogin } from "@/app/actions/sponsorPortalActions"
import { Building2, Loader2 } from "lucide-react"

export default function SponsorPortalLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await sponsorLogin(email, password)

    if (result.success) {
      router.push("/sponsor-portal/dashboard")
    } else {
      setError(result.error ?? "Login failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#e7ab1c] mb-5 shadow-lg shadow-[#e7ab1c]/20">
            <Building2 size={24} className="text-white" />
          </div>
          <h1
            className="text-2xl font-bold text-[#1a1a2e] mb-2"
            style={{ fontFamily: "-apple-system, 'SF Pro Display', system-ui, sans-serif" }}
          >
            Sponsor Portal
          </h1>
          <p className="text-sm text-[#666]">
            Sign in to manage your sponsor profile, logo, and booth details
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-[11px] text-[#888] uppercase tracking-wider font-medium mb-1.5"
            >
              Contact Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white border border-[#e0e0e0] rounded-xl text-sm text-[#1a1a2e] placeholder-[#bbb] focus:outline-none focus:border-[#e7ab1c] focus:ring-2 focus:ring-[#e7ab1c]/10 transition-all"
              placeholder="sponsor@company.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] text-[#888] uppercase tracking-wider font-medium mb-1.5"
            >
              Portal Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white border border-[#e0e0e0] rounded-xl text-sm text-[#1a1a2e] placeholder-[#bbb] focus:outline-none focus:border-[#e7ab1c] focus:ring-2 focus:ring-[#e7ab1c]/10 transition-all"
              placeholder="Enter your portal password"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#e7ab1c] text-white text-sm font-bold tracking-wide hover:bg-[#d49c16] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#e7ab1c]/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-[#999] mt-8">
          Portal access is provided by event organizers. Contact{" "}
          <a
            href="mailto:info@theleadershipfederation.com"
            className="text-[#e7ab1c] hover:underline"
          >
            info@theleadershipfederation.com
          </a>{" "}
          for assistance.
        </p>
      </div>
    </div>
  )
}
