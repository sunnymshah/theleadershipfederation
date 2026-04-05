"use client"

/**
 * ─── SPONSOR PORTAL DASHBOARD ───────────────────────────────────────────
 *
 * Self-service portal for sponsors to view and edit their profile,
 * upload a new logo, and manage booth details.
 *
 * Light theme: white bg, gold #e7ab1c accents.
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  getSponsorSession,
  getSponsorProfile,
  updateSponsorProfile,
  uploadSponsorLogo,
  sponsorLogout,
} from "@/app/actions/sponsorPortalActions"
import {
  Building2,
  Upload,
  Globe,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  LogOut,
  Check,
  AlertCircle,
  X,
  Edit3,
} from "lucide-react"

interface SponsorData {
  id: string
  event_id: string
  name: string
  tier: string
  logo_url: string | null
  website: string | null
  description: string | null
  contact_email: string | null
  contact_phone: string | null
  website_url: string | null
  booth_details: string | null
  last_login_at: string | null
  created_at: string
  events: {
    id: string
    title: string
    slug: string
    start_date: string
    end_date: string
    venue: string
    status: string
  }[] | null
}

const TIER_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  title:    { bg: "bg-[#e7ab1c]/10", text: "text-[#e7ab1c]", label: "Title Sponsor" },
  platinum: { bg: "bg-gray-100",     text: "text-gray-600",   label: "Platinum" },
  gold:     { bg: "bg-yellow-50",    text: "text-yellow-700", label: "Gold" },
  silver:   { bg: "bg-gray-50",      text: "text-gray-500",   label: "Silver" },
  bronze:   { bg: "bg-orange-50",    text: "text-orange-700", label: "Bronze" },
  partner:  { bg: "bg-blue-50",      text: "text-blue-600",   label: "Partner" },
}

export default function SponsorDashboardPage() {
  const [sponsor, setSponsor] = useState<SponsorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const loadProfile = useCallback(async () => {
    const sessionId = await getSponsorSession()
    if (!sessionId) {
      router.push("/sponsor-portal")
      return
    }

    const result = await getSponsorProfile(sessionId)
    if (result.success && result.sponsor) {
      setSponsor(result.sponsor as SponsorData)
    } else {
      router.push("/sponsor-portal")
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function handleProfileUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!sponsor) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const result = await updateSponsorProfile(sponsor.id, formData)

    if (result.success) {
      setSuccess("Profile updated successfully")
      setEditing(false)
      await loadProfile()
    } else {
      setError(result.error ?? "Failed to update profile")
    }
    setSaving(false)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !sponsor) return

    setUploadingLogo(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.set("logo", file)

    const result = await uploadSponsorLogo(sponsor.id, formData)
    if (result.success) {
      setSuccess("Logo updated successfully")
      await loadProfile()
    } else {
      setError(result.error ?? "Failed to upload logo")
    }
    setUploadingLogo(false)
  }

  async function handleLogout() {
    await sponsorLogout()
    router.push("/sponsor-portal")
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#888]">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading your portal...</span>
        </div>
      </div>
    )
  }

  if (!sponsor) return null

  const tier = TIER_STYLES[sponsor.tier] ?? TIER_STYLES.gold
  const event = sponsor.events?.[0] ?? null

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold text-[#1a1a2e]"
            style={{ fontFamily: "-apple-system, 'SF Pro Display', system-ui, sans-serif" }}
          >
            Sponsor Portal
          </h1>
          <p className="text-sm text-[#888] mt-1">
            Welcome back, {sponsor.name}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[#888] hover:text-[#555] hover:bg-gray-100 transition-colors"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>

      {/* Status messages */}
      {error && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}
      {success && (
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
          <div className="flex items-center gap-2">
            <Check size={14} />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column: Profile Card ─────────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">
          {/* Logo & Basic Info */}
          <div className="bg-white rounded-2xl border border-[#e8e8e8] p-6 shadow-sm">
            <div className="text-center">
              {/* Logo */}
              <div className="relative inline-block mb-4">
                {sponsor.logo_url ? (
                  <img
                    src={sponsor.logo_url}
                    alt={sponsor.name}
                    className="w-24 h-24 rounded-2xl object-contain bg-gray-50 border border-[#e8e8e8] p-2"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gray-50 border border-[#e8e8e8] flex items-center justify-center">
                    <Building2 size={32} className="text-[#ccc]" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#e7ab1c] text-white flex items-center justify-center shadow-lg hover:bg-[#d49c16] transition-colors disabled:opacity-50"
                  title="Upload new logo"
                >
                  {uploadingLogo ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              <h2 className="text-lg font-bold text-[#1a1a2e]">{sponsor.name}</h2>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mt-2 ${tier.bg} ${tier.text}`}
              >
                {tier.label}
              </span>

              {sponsor.description && (
                <p className="text-[12px] text-[#888] mt-3 leading-relaxed">
                  {sponsor.description}
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#e8e8e8] space-y-3">
              {sponsor.contact_email && (
                <div className="flex items-center gap-2 text-[12px] text-[#666]">
                  <span className="text-[#bbb]">@</span>
                  {sponsor.contact_email}
                </div>
              )}
              {(sponsor.contact_phone || sponsor.website_url || sponsor.website) && (
                <>
                  {sponsor.contact_phone && (
                    <div className="flex items-center gap-2 text-[12px] text-[#666]">
                      <Phone size={12} className="text-[#bbb]" />
                      {sponsor.contact_phone}
                    </div>
                  )}
                  {(sponsor.website_url || sponsor.website) && (
                    <div className="flex items-center gap-2 text-[12px] text-[#666]">
                      <Globe size={12} className="text-[#bbb]" />
                      <a
                        href={sponsor.website_url || sponsor.website || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#e7ab1c] hover:underline truncate"
                      >
                        {(sponsor.website_url || sponsor.website || "")
                          .replace(/https?:\/\/(www\.)?/, "")
                          .slice(0, 40)}
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Event Info */}
          {event && (
            <div className="bg-white rounded-2xl border border-[#e8e8e8] p-6 shadow-sm">
              <h3 className="text-[11px] text-[#888] uppercase tracking-wider font-semibold mb-3">
                Sponsoring Event
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-[#1a1a2e] text-[14px]">
                    {event.title}
                  </h4>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1 ${
                      event.status === "published"
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-[12px] text-[#666]">
                  <Calendar size={12} className="text-[#bbb] mt-0.5 shrink-0" />
                  <div>
                    {new Date(event.start_date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    &mdash;{" "}
                    {new Date(event.end_date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="flex items-start gap-2 text-[12px] text-[#666]">
                  <MapPin size={12} className="text-[#bbb] mt-0.5 shrink-0" />
                  {event.venue}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Editable Details ────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#e8e8e8] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3
                className="text-lg font-bold text-[#1a1a2e]"
                style={{ fontFamily: "-apple-system, 'SF Pro Display', system-ui, sans-serif" }}
              >
                Your Details
              </h3>
              {!editing && (
                <button
                  onClick={() => {
                    setEditing(true)
                    setError(null)
                    setSuccess(null)
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e7ab1c] text-white text-sm font-medium hover:bg-[#d49c16] transition-colors"
                >
                  <Edit3 size={14} /> Edit Details
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <div>
                  <label className="block text-[11px] text-[#888] uppercase tracking-wider font-medium mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="url"
                    name="website_url"
                    defaultValue={sponsor.website_url ?? sponsor.website ?? ""}
                    className="w-full px-4 py-3 bg-white border border-[#e0e0e0] rounded-xl text-sm text-[#1a1a2e] placeholder-[#bbb] focus:outline-none focus:border-[#e7ab1c] focus:ring-2 focus:ring-[#e7ab1c]/10 transition-all"
                    placeholder="https://yourcompany.com"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#888] uppercase tracking-wider font-medium mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contact_phone"
                    defaultValue={sponsor.contact_phone ?? ""}
                    className="w-full px-4 py-3 bg-white border border-[#e0e0e0] rounded-xl text-sm text-[#1a1a2e] placeholder-[#bbb] focus:outline-none focus:border-[#e7ab1c] focus:ring-2 focus:ring-[#e7ab1c]/10 transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#888] uppercase tracking-wider font-medium mb-1.5">
                    Booth Details
                  </label>
                  <textarea
                    name="booth_details"
                    rows={4}
                    defaultValue={sponsor.booth_details ?? ""}
                    className="w-full px-4 py-3 bg-white border border-[#e0e0e0] rounded-xl text-sm text-[#1a1a2e] placeholder-[#bbb] focus:outline-none focus:border-[#e7ab1c] focus:ring-2 focus:ring-[#e7ab1c]/10 transition-all resize-none"
                    placeholder="Describe your booth setup, requirements, or special instructions..."
                  />
                  <p className="text-[11px] text-[#999] mt-1">
                    This info is shared with event organizers to prepare your booth.
                  </p>
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex-1 py-3 rounded-xl border border-[#e0e0e0] text-sm text-[#777] hover:text-[#444] hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-[#e7ab1c] text-white text-sm font-bold hover:bg-[#d49c16] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <DetailRow
                  label="Website URL"
                  value={sponsor.website_url || sponsor.website}
                  icon={<Globe size={14} className="text-[#bbb]" />}
                  isLink
                />
                <DetailRow
                  label="Contact Phone"
                  value={sponsor.contact_phone}
                  icon={<Phone size={14} className="text-[#bbb]" />}
                />
                <DetailRow
                  label="Booth Details"
                  value={sponsor.booth_details}
                  icon={<MapPin size={14} className="text-[#bbb]" />}
                  multiline
                />
              </div>
            )}
          </div>

          {/* Upload Instructions */}
          <div className="mt-6 bg-[#fffbeb] rounded-2xl border border-[#fde68a]/30 p-6">
            <h4 className="text-[13px] font-semibold text-[#92400e] mb-2">
              Logo Upload Guidelines
            </h4>
            <ul className="text-[12px] text-[#92400e]/80 space-y-1.5">
              <li>Maximum file size: 5 MB</li>
              <li>Recommended: PNG or SVG with transparent background</li>
              <li>Minimum dimensions: 400 x 400 pixels</li>
              <li>The logo will appear on the event website and printed materials</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Detail Row Component ─────────────────────────────────────────────── */

function DetailRow({
  label,
  value,
  icon,
  isLink,
  multiline,
}: {
  label: string
  value: string | null | undefined
  icon: React.ReactNode
  isLink?: boolean
  multiline?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-[11px] text-[#888] uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      {value ? (
        isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#e7ab1c] hover:underline ml-6"
          >
            {value}
          </a>
        ) : (
          <p className={`text-sm text-[#333] ml-6 ${multiline ? "whitespace-pre-wrap" : ""}`}>
            {value}
          </p>
        )
      ) : (
        <p className="text-sm text-[#ccc] italic ml-6">Not provided</p>
      )}
    </div>
  )
}
