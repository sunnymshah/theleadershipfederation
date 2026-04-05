"use client"

/**
 * Admin Badge Designer Page (WYSIWYG)
 *
 * Full visual badge designer with live preview canvas, design controls,
 * template presets, and PDF generation. Comparable to Zoho Backstage's
 * drag-and-drop badge editor.
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/utils/supabase/client"
import { getBadgeData } from "@/app/actions/badgeActions"
import type { BadgeDesign } from "@/lib/generateBadge"
import {
  CreditCard,
  Download,
  Palette,
  Layout,
  Type,
  Eye,
  ChevronDown,
  RotateCcw,
  Loader2,
} from "lucide-react"

/* ── Types ──────────────────────────────────────────────────────────── */

interface EventOption {
  id: string
  title: string
  start_date: string
  status: string
}

type BadgeFilter = "all" | "vip" | "checked_in"

type BorderStyle = "none" | "thin" | "gold" | "double"

interface DesignState {
  layout: "landscape" | "portrait"
  bgColor: string
  accentColor: string
  textColor: string
  nameSize: number
  showCompany: boolean
  showDesignation: boolean
  showVip: boolean
  showQr: boolean
  borderStyle: BorderStyle
}

/* ── Template Presets ───────────────────────────────────────────────── */

const PRESETS: Record<string, DesignState & { label: string }> = {
  "professional-white": {
    label: "Professional White",
    layout: "landscape",
    bgColor: "#ffffff",
    accentColor: "#e7ab1c",
    textColor: "#1e1e1e",
    nameSize: 32,
    borderStyle: "gold",
    showCompany: true,
    showDesignation: true,
    showVip: true,
    showQr: true,
  },
  "executive-dark": {
    label: "Executive Dark",
    layout: "landscape",
    bgColor: "#1a1a2e",
    accentColor: "#c9a84c",
    textColor: "#ffffff",
    nameSize: 36,
    borderStyle: "thin",
    showCompany: true,
    showDesignation: true,
    showVip: true,
    showQr: true,
  },
  "gold-premium": {
    label: "Gold Premium",
    layout: "landscape",
    bgColor: "#f8f4e8",
    accentColor: "#e7ab1c",
    textColor: "#1e1e1e",
    nameSize: 40,
    borderStyle: "double",
    showCompany: true,
    showDesignation: true,
    showVip: true,
    showQr: true,
  },
  minimal: {
    label: "Minimal",
    layout: "landscape",
    bgColor: "#ffffff",
    accentColor: "#333333",
    textColor: "#1e1e1e",
    nameSize: 28,
    borderStyle: "none",
    showCompany: true,
    showDesignation: true,
    showVip: false,
    showQr: true,
  },
}

/* ── Sample badge data for preview ─────────────────────────────────── */

const SAMPLE_BADGES = [
  { name: "John Smith", designation: "CEO", company: "Acme Corp", vip: "vip" },
  { name: "Priya Sharma", designation: "CTO", company: "TechStar", vip: "speaker" },
  { name: "David Chen", designation: "VP Marketing", company: "GlobalBrands", vip: null },
  { name: "Fatima Al-Rashid", designation: "Director", company: "Nexus Partners", vip: "vvip" },
]

/* ── Preset color swatches ─────────────────────────────────────────── */

const BG_SWATCHES = ["#ffffff", "#f8f4e8", "#1a1a2e", "#0d1117", "#f0f4f8", "#fef3c7"]
const ACCENT_SWATCHES = ["#e7ab1c", "#c9a84c", "#333333", "#1a73e8", "#dc2626", "#059669"]

/* ── VIP color map (mirroring generateBadge.ts) ────────────────────── */

const VIP_DISPLAY: Record<string, { bg: string; text: string; label: string }> = {
  vip:     { bg: "#e7ab1c", text: "#ffffff", label: "VIP" },
  vvip:    { bg: "#b43232", text: "#ffffff", label: "VVIP" },
  speaker: { bg: "#3264b4", text: "#ffffff", label: "SPEAKER" },
  sponsor: { bg: "#288c50", text: "#ffffff", label: "SPONSOR" },
  media:   { bg: "#783ca0", text: "#ffffff", label: "MEDIA" },
}

/* ── localStorage key ──────────────────────────────────────────────── */

const STORAGE_KEY = "tlf-badge-design"

/* ── Helper: determine if hex color is dark ────────────────────────── */

function isDarkColor(hex: string): boolean {
  const h = hex.replace("#", "")
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5
}

/* ── Single Badge Preview Component ────────────────────────────────── */

function BadgePreview({
  design,
  name,
  designation,
  company,
  vip,
  badgeNumber,
  scale = 1,
}: {
  design: DesignState
  name: string
  designation: string
  company: string
  vip: string | null
  badgeNumber: number
  scale?: number
}) {
  const darkBg = isDarkColor(design.bgColor)
  const isLandscape = design.layout === "landscape"

  // A6 = 148mm x 105mm. We use 2px per mm for screen rendering.
  const baseW = isLandscape ? 296 : 210
  const baseH = isLandscape ? 210 : 296

  const grayColor = darkBg ? "#b4b4b4" : "#787878"
  const subtleColor = darkBg ? "#8c8c8c" : "#a0a0a0"
  const infoColor = darkBg ? "#c8c8c8" : "#505050"

  const borderStyles: Record<BorderStyle, React.CSSProperties> = {
    none: {},
    thin: {
      boxShadow: `inset 0 0 0 1px ${grayColor}`,
    },
    gold: {
      boxShadow: `inset 0 0 0 2px ${design.accentColor}`,
    },
    double: {
      boxShadow: `inset 0 0 0 1.5px ${design.accentColor}, inset 0 0 0 4px transparent, inset 0 0 0 5px ${design.accentColor}`,
    },
  }

  const vipInfo = vip ? VIP_DISPLAY[vip.toLowerCase()] : null

  return (
    <div
      style={{
        width: baseW * scale,
        height: baseH * scale,
        backgroundColor: design.bgColor,
        position: "relative",
        overflow: "hidden",
        borderRadius: 2 * scale,
        border: "1px solid #e0e0e0",
        ...borderStyles[design.borderStyle],
        // Scale inner content
        fontSize: `${scale * 100}%`,
      }}
    >
      {/* VIP Ribbon (top-right) */}
      {design.showVip && vipInfo && (
        <div
          style={{
            position: "absolute",
            top: 4 * scale,
            right: 6 * scale,
            backgroundColor: vipInfo.bg,
            color: vipInfo.text,
            fontSize: 10 * scale,
            fontWeight: 700,
            padding: `${2 * scale}px ${10 * scale}px`,
            borderRadius: 3 * scale,
            letterSpacing: 0.5,
          }}
        >
          {vipInfo.label}
        </div>
      )}

      {/* TLF Logo placeholder */}
      <div
        style={{
          margin: `${16 * scale}px auto ${0}px`,
          width: 100 * scale,
          height: 20 * scale,
          backgroundColor: design.accentColor,
          borderRadius: 4 * scale,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: 7 * scale,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          THE LEADERSHIP FEDERATION
        </span>
      </div>

      {/* Event title */}
      <div
        style={{
          textAlign: "center",
          marginTop: 8 * scale,
          fontSize: 10 * scale,
          color: grayColor,
          padding: `0 ${12 * scale}px`,
          lineHeight: 1.3,
        }}
      >
        Event Name
      </div>

      {/* Accent divider */}
      <div
        style={{
          width: `calc(100% - ${60 * scale}px)`,
          height: 1.2 * scale,
          backgroundColor: design.accentColor,
          margin: `${6 * scale}px auto`,
        }}
      />

      {/* Attendee name */}
      <div
        style={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: design.nameSize * scale * 0.65,
          color: design.textColor,
          padding: `${8 * scale}px ${10 * scale}px ${2 * scale}px`,
          lineHeight: 1.2,
          wordBreak: "break-word",
        }}
      >
        {name}
      </div>

      {/* Designation */}
      {design.showDesignation && (
        <div
          style={{
            textAlign: "center",
            fontSize: 11 * scale,
            color: infoColor,
            marginTop: 2 * scale,
          }}
        >
          {designation}
        </div>
      )}

      {/* Company */}
      {design.showCompany && (
        <div
          style={{
            textAlign: "center",
            fontSize: 11 * scale,
            fontWeight: 600,
            color: infoColor,
            marginTop: 2 * scale,
          }}
        >
          {company}
        </div>
      )}

      {/* Bottom section */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: `0 ${8 * scale}px ${8 * scale}px`,
        }}
      >
        {/* Bottom accent line */}
        <div
          style={{
            height: 2 * scale,
            backgroundColor: design.accentColor,
            margin: `0 ${4 * scale}px ${6 * scale}px`,
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          {/* Badge number */}
          <span
            style={{
              fontSize: 9 * scale,
              color: subtleColor,
              fontFamily: "monospace",
            }}
          >
            #{String(badgeNumber).padStart(4, "0")}
          </span>

          {/* QR Code placeholder */}
          {design.showQr && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  width: 26 * scale,
                  height: 26 * scale,
                  border: `1px solid ${subtleColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: "auto",
                  marginBottom: 2 * scale,
                }}
              >
                <span style={{ fontSize: 7 * scale, color: subtleColor }}>QR</span>
              </div>
              <span style={{ fontSize: 6 * scale, color: subtleColor }}>
                a1b2c3d4e5f6
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main Page Component ───────────────────────────────────────────── */

export default function AdminBadgesPage() {
  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [filter, setFilter] = useState<BadgeFilter>("all")
  const [badgeCount, setBadgeCount] = useState<number | null>(null)
  const [counting, setCounting] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Design state
  const [design, setDesign] = useState<DesignState>(() => {
    // Will be overwritten by useEffect localStorage load
    return { ...PRESETS["professional-white"] }
  })
  const [activePreset, setActivePreset] = useState("professional-white")

  const supabase = createClient()

  // ── Load design from localStorage on mount ──────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setDesign((prev) => ({ ...prev, ...parsed }))
        // Try to match a preset
        const matchedPreset = Object.entries(PRESETS).find(
          ([, p]) =>
            p.bgColor === parsed.bgColor &&
            p.accentColor === parsed.accentColor &&
            p.nameSize === parsed.nameSize &&
            p.borderStyle === parsed.borderStyle
        )
        if (matchedPreset) setActivePreset(matchedPreset[0])
        else setActivePreset("")
      }
    } catch {
      // ignore
    }
  }, [])

  // ── Save design to localStorage on change ──────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(design))
    } catch {
      // ignore
    }
  }, [design])

  // ── Fetch events ───────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true)
    const { data } = await supabase
      .from("events")
      .select("id, title, start_date, status")
      .order("start_date", { ascending: false })

    if (data) {
      setEvents(data)
      if (data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].id)
      }
    }
    setLoadingEvents(false)
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // ── Fetch badge count ──────────────────────────────────────────
  useEffect(() => {
    if (!selectedEventId) return
    let cancelled = false

    async function fetchCount() {
      setCounting(true)
      setBadgeCount(null)
      const result = await getBadgeData(selectedEventId, filter)
      if (!cancelled) {
        setBadgeCount(result.badges?.length ?? 0)
        setCounting(false)
      }
    }

    fetchCount()
    return () => {
      cancelled = true
    }
  }, [selectedEventId, filter])

  // ── Update design field ────────────────────────────────────────
  const updateDesign = useCallback(
    <K extends keyof DesignState>(key: K, value: DesignState[K]) => {
      setDesign((prev) => ({ ...prev, [key]: value }))
      setActivePreset("") // custom
    },
    []
  )

  // ── Apply preset ───────────────────────────────────────────────
  const applyPreset = useCallback((presetKey: string) => {
    const preset = PRESETS[presetKey]
    if (!preset) return
    setDesign({
      layout: preset.layout,
      bgColor: preset.bgColor,
      accentColor: preset.accentColor,
      textColor: preset.textColor,
      nameSize: preset.nameSize,
      showCompany: preset.showCompany,
      showDesignation: preset.showDesignation,
      showVip: preset.showVip,
      showQr: preset.showQr,
      borderStyle: preset.borderStyle,
    })
    setActivePreset(presetKey)
  }, [])

  // ── Build design config for PDF ────────────────────────────────
  const pdfDesign: BadgeDesign = useMemo(() => {
    const ev = events.find((e) => e.id === selectedEventId)
    return {
      ...design,
      eventTitle: ev?.title ?? "The Leadership Federation",
    }
  }, [design, events, selectedEventId])

  // ── Download PDF ───────────────────────────────────────────────
  const handleDownload = async () => {
    if (!selectedEventId) return
    setGenerating(true)

    try {
      const designParam = encodeURIComponent(JSON.stringify(pdfDesign))
      const url = `/api/badges/${selectedEventId}?filter=${filter}&design=${designParam}`
      const response = await fetch(url)

      if (!response.ok) {
        const err = await response.json()
        alert(err.error || "Failed to generate badges")
        setGenerating(false)
        return
      }

      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `badges-${selectedEventId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      alert("Failed to generate badges: " + (err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#333] mb-1 flex items-center gap-3">
            <CreditCard size={24} className="text-[#c9a84c]" />
            Badge Designer
          </h2>
          <p className="text-sm text-[#888]">
            Design and generate printable badge PDFs. Changes preview in real-time.
          </p>
        </div>
      </div>

      {/* Event Selector Row */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
            Select Event
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-4 py-2.5 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc] transition-colors min-w-[280px]"
          >
            {loadingEvents ? (
              <option>Loading events...</option>
            ) : events.length === 0 ? (
              <option>No events found</option>
            ) : (
              events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                  {ev.status !== "published" ? ` (${ev.status})` : ""}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-[#777] uppercase tracking-wider mb-1.5">
            Filter Attendees
          </label>
          <div className="flex gap-1.5">
            {(
              [
                { value: "all", label: "All Registered" },
                { value: "vip", label: "VIP Only" },
                { value: "checked_in", label: "Checked-In" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filter === opt.value
                    ? "bg-[#e8f0fe] text-[#1a73e8] border border-[#1a73e8]/30"
                    : "bg-[#f0f0f0] text-[#555] hover:bg-[#e8e8e8] border border-transparent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="text-sm text-[#555]">
            {counting ? (
              <span className="text-[#999]">Counting...</span>
            ) : (
              <>
                <span className="font-bold text-[#333]">{badgeCount ?? 0}</span> badges
              </>
            )}
          </div>
          <button
            onClick={handleDownload}
            disabled={generating || badgeCount === 0 || badgeCount === null}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              generating || badgeCount === 0 || badgeCount === null
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#1a73e8] text-white hover:bg-[#1557b0] shadow-sm"
            }`}
          >
            {generating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download size={14} />
                Generate &amp; Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main layout: Controls (left) + Canvas (right) */}
      <div className="flex gap-6" style={{ minHeight: 600 }}>
        {/* ── Left Panel: Design Controls ──────────────────────────── */}
        <div className="w-[300px] flex-shrink-0 space-y-4">
          {/* Template Presets */}
          <ControlSection title="Template Preset" icon={<Palette size={14} />}>
            <div className="relative">
              <select
                value={activePreset}
                onChange={(e) => applyPreset(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc] appearance-none pr-8"
              >
                <option value="">Custom</option>
                {Object.entries(PRESETS).map(([key, p]) => (
                  <option key={key} value={key}>
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none"
              />
            </div>
          </ControlSection>

          {/* Layout */}
          <ControlSection title="Layout" icon={<Layout size={14} />}>
            <div className="flex gap-2">
              {(["landscape", "portrait"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => updateDesign("layout", l)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors capitalize ${
                    design.layout === l
                      ? "bg-[#e8f0fe] text-[#1a73e8] border border-[#1a73e8]/30"
                      : "bg-[#f5f5f5] text-[#555] hover:bg-[#eee] border border-transparent"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </ControlSection>

          {/* Name Font Size */}
          <ControlSection title="Name Font Size" icon={<Type size={14} />}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={24}
                max={48}
                value={design.nameSize}
                onChange={(e) => updateDesign("nameSize", Number(e.target.value))}
                className="flex-1 accent-[#1a73e8]"
              />
              <span className="text-sm font-mono text-[#555] w-[36px] text-right">
                {design.nameSize}pt
              </span>
            </div>
          </ControlSection>

          {/* Toggles */}
          <ControlSection title="Visibility" icon={<Eye size={14} />}>
            <div className="space-y-2">
              <ToggleRow
                label="Company"
                checked={design.showCompany}
                onChange={(v) => updateDesign("showCompany", v)}
              />
              <ToggleRow
                label="Designation"
                checked={design.showDesignation}
                onChange={(v) => updateDesign("showDesignation", v)}
              />
              <ToggleRow
                label="VIP Badge"
                checked={design.showVip}
                onChange={(v) => updateDesign("showVip", v)}
              />
              <ToggleRow
                label="QR Code"
                checked={design.showQr}
                onChange={(v) => updateDesign("showQr", v)}
              />
            </div>
          </ControlSection>

          {/* Background Color */}
          <ControlSection title="Background Color">
            <div className="space-y-2">
              <div className="flex gap-1.5">
                {BG_SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      updateDesign("bgColor", c)
                      // Auto-adjust text color for dark backgrounds
                      if (isDarkColor(c)) updateDesign("textColor", "#ffffff")
                      else updateDesign("textColor", "#1e1e1e")
                    }}
                    className={`w-7 h-7 rounded-md border-2 transition-transform hover:scale-110 ${
                      design.bgColor === c ? "border-[#1a73e8] scale-110" : "border-[#e0e0e0]"
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={design.bgColor}
                  onChange={(e) => {
                    updateDesign("bgColor", e.target.value)
                    if (isDarkColor(e.target.value)) updateDesign("textColor", "#ffffff")
                    else updateDesign("textColor", "#1e1e1e")
                  }}
                  className="w-8 h-8 rounded border border-[#e0e0e0] cursor-pointer"
                />
                <input
                  type="text"
                  value={design.bgColor}
                  onChange={(e) => {
                    const val = e.target.value
                    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                      updateDesign("bgColor", val)
                      if (isDarkColor(val)) updateDesign("textColor", "#ffffff")
                      else updateDesign("textColor", "#1e1e1e")
                    }
                  }}
                  className="flex-1 px-2 py-1.5 border border-[#e0e0e0] rounded text-xs font-mono text-[#555] focus:outline-none focus:border-[#ccc]"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </ControlSection>

          {/* Accent Color */}
          <ControlSection title="Accent Color">
            <div className="space-y-2">
              <div className="flex gap-1.5">
                {ACCENT_SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateDesign("accentColor", c)}
                    className={`w-7 h-7 rounded-md border-2 transition-transform hover:scale-110 ${
                      design.accentColor === c ? "border-[#1a73e8] scale-110" : "border-[#e0e0e0]"
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={design.accentColor}
                  onChange={(e) => updateDesign("accentColor", e.target.value)}
                  className="w-8 h-8 rounded border border-[#e0e0e0] cursor-pointer"
                />
                <input
                  type="text"
                  value={design.accentColor}
                  onChange={(e) => {
                    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                      updateDesign("accentColor", e.target.value)
                    }
                  }}
                  className="flex-1 px-2 py-1.5 border border-[#e0e0e0] rounded text-xs font-mono text-[#555] focus:outline-none focus:border-[#ccc]"
                  placeholder="#e7ab1c"
                />
              </div>
            </div>
          </ControlSection>

          {/* Border Style */}
          <ControlSection title="Border Style">
            <div className="relative">
              <select
                value={design.borderStyle}
                onChange={(e) => updateDesign("borderStyle", e.target.value as BorderStyle)}
                className="w-full px-3 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#333] focus:outline-none focus:border-[#ccc] appearance-none pr-8"
              >
                <option value="none">None</option>
                <option value="thin">Thin</option>
                <option value="gold">Gold Border</option>
                <option value="double">Double Border</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none"
              />
            </div>
          </ControlSection>

          {/* Reset */}
          <button
            onClick={() => applyPreset("professional-white")}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#888] hover:text-[#555] transition-colors"
          >
            <RotateCcw size={12} />
            Reset to default
          </button>
        </div>

        {/* ── Right Panel: Canvas & Preview ─────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Single large preview */}
          <div className="mb-6">
            <h3 className="text-[11px] text-[#777] uppercase tracking-wider mb-3">
              Badge Preview (A6 {design.layout === "landscape" ? "148mm x 105mm" : "105mm x 148mm"})
            </h3>
            <div className="bg-[#f0f0f0] rounded-xl p-6 flex items-center justify-center border border-[#e5e5e5]">
              <BadgePreview
                design={design}
                name="John Smith"
                designation="Chief Executive Officer"
                company="Acme Corporation"
                vip="vip"
                badgeNumber={1}
                scale={1.4}
              />
            </div>
          </div>

          {/* 2x2 sample grid */}
          <div>
            <h3 className="text-[11px] text-[#777] uppercase tracking-wider mb-3">
              Sample Grid (4 per A4 Sheet)
            </h3>
            <div className="bg-[#f0f0f0] rounded-xl p-4 border border-[#e5e5e5]">
              <div className="grid grid-cols-2 gap-3 max-w-[640px] mx-auto">
                {SAMPLE_BADGES.map((sample, idx) => (
                  <BadgePreview
                    key={idx}
                    design={design}
                    name={sample.name}
                    designation={sample.designation}
                    company={sample.company}
                    vip={sample.vip}
                    badgeNumber={idx + 1}
                    scale={0.85}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Generation info */}
          {selectedEventId && badgeCount !== null && badgeCount > 0 && (
            <div className="mt-4 p-3 bg-[#f8f8f8] rounded-lg border border-[#e5e5e5] text-xs text-[#777]">
              {badgeCount} badge{badgeCount !== 1 ? "s" : ""} will be generated across{" "}
              {Math.ceil(badgeCount / 4)} A4 page{Math.ceil(badgeCount / 4) !== 1 ? "s" : ""} (4
              badges per sheet).
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Control Section Wrapper ───────────────────────────────────────── */

function ControlSection({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
      <label className="flex items-center gap-1.5 text-[11px] text-[#777] uppercase tracking-wider mb-2.5">
        {icon}
        {title}
      </label>
      {children}
    </div>
  )
}

/* ── Toggle Row ────────────────────────────────────────────────────── */

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#555]">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${
          checked ? "bg-[#1a73e8]" : "bg-[#ccc]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}
