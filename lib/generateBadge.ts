/**
 * Badge/Name Tag PDF Generation
 *
 * Generates printable A6 landscape badges (4 per A4 sheet, 2x2 grid).
 * Works server-side in Node.js (no browser APIs required).
 *
 * Badge layout (A6 = 148mm x 105mm):
 *   - TLF logo placeholder (gold rectangle, top center)
 *   - Event title (small, below logo)
 *   - Attendee name (LARGE, centered, bold)
 *   - Company + Designation (medium, below name)
 *   - VIP/Speaker/Sponsor color-coded badge
 *   - QR token text (bottom right)
 *   - Badge number (bottom left)
 */

import { jsPDF } from "jspdf"

export interface BadgeData {
  attendeeName: string
  company?: string | null
  designation?: string | null
  eventTitle: string
  qrToken: string
  badgeNumber: number
  vipLevel?: string | null
}

/* ── Color map for VIP levels ─────────────────────────────────────────── */

const VIP_COLORS: Record<string, { bg: [number, number, number]; text: [number, number, number]; label: string }> = {
  vip:     { bg: [231, 171, 28],  text: [255, 255, 255], label: "VIP" },
  vvip:    { bg: [180, 50, 50],   text: [255, 255, 255], label: "VVIP" },
  speaker: { bg: [50, 100, 180],  text: [255, 255, 255], label: "SPEAKER" },
  sponsor: { bg: [40, 140, 80],   text: [255, 255, 255], label: "SPONSOR" },
  media:   { bg: [120, 60, 160],  text: [255, 255, 255], label: "MEDIA" },
}

/* ── Badge dimensions (A6 landscape) ──────────────────────────────────── */

const BADGE_W = 148 // mm
const BADGE_H = 105 // mm

/* ── Draw a single badge at position (offX, offY) ─────────────────────── */

function drawBadge(doc: jsPDF, badge: BadgeData, offX: number, offY: number) {
  const gold: [number, number, number] = [231, 171, 28]
  const darkText: [number, number, number] = [30, 30, 30]
  const grayText: [number, number, number] = [120, 120, 120]

  // Badge boundary (light border for cutting guides)
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.rect(offX, offY, BADGE_W, BADGE_H)

  // ── TLF Logo placeholder (gold rectangle at top center) ─────────────
  const logoW = 50
  const logoH = 10
  const logoX = offX + (BADGE_W - logoW) / 2
  const logoY = offY + 8
  doc.setFillColor(...gold)
  doc.roundedRect(logoX, logoY, logoW, logoH, 2, 2, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(255, 255, 255)
  doc.text("THE LEADERSHIP FEDERATION", offX + BADGE_W / 2, logoY + 6.5, { align: "center" })

  // ── Event title (small, below logo) ─────────────────────────────────
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...grayText)
  const eventTitleLines = doc.splitTextToSize(badge.eventTitle, BADGE_W - 20)
  const eventTitleY = logoY + logoH + 6
  doc.text(eventTitleLines.slice(0, 2), offX + BADGE_W / 2, eventTitleY, { align: "center" })

  // ── Gold divider line ───────────────────────────────────────────────
  const dividerY = eventTitleY + (eventTitleLines.length > 1 ? 8 : 4)
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.6)
  doc.line(offX + 20, dividerY, offX + BADGE_W - 20, dividerY)

  // ── Attendee name (LARGE, centered, bold) ───────────────────────────
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...darkText)

  // Dynamically size the name to fit
  const maxNameWidth = BADGE_W - 16
  let nameFontSize = 22
  doc.setFontSize(nameFontSize)
  while (doc.getTextWidth(badge.attendeeName) > maxNameWidth && nameFontSize > 12) {
    nameFontSize -= 1
    doc.setFontSize(nameFontSize)
  }

  const nameY = dividerY + 14
  doc.text(badge.attendeeName, offX + BADGE_W / 2, nameY, { align: "center" })

  // ── Company + Designation (medium, below name) ──────────────────────
  let infoY = nameY + 8
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)

  if (badge.designation) {
    const desgLines = doc.splitTextToSize(badge.designation, BADGE_W - 20)
    doc.text(desgLines.slice(0, 1), offX + BADGE_W / 2, infoY, { align: "center" })
    infoY += 5
  }

  if (badge.company) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    const compLines = doc.splitTextToSize(badge.company, BADGE_W - 20)
    doc.text(compLines.slice(0, 1), offX + BADGE_W / 2, infoY, { align: "center" })
  }

  // ── VIP / Speaker / Sponsor badge (color-coded) ─────────────────────
  const vipLevel = badge.vipLevel?.toLowerCase() ?? ""
  const vipConfig = VIP_COLORS[vipLevel]

  if (vipConfig) {
    const badgeLabelW = doc.getTextWidth(vipConfig.label) + 12
    const badgeLabelH = 7
    const badgeLabelX = offX + (BADGE_W - badgeLabelW) / 2
    const badgeLabelY = infoY + 6

    doc.setFillColor(...vipConfig.bg)
    doc.roundedRect(badgeLabelX, badgeLabelY, badgeLabelW, badgeLabelH, 1.5, 1.5, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(...vipConfig.text)
    doc.text(vipConfig.label, offX + BADGE_W / 2, badgeLabelY + 5, { align: "center" })
  }

  // ── Bottom section ──────────────────────────────────────────────────

  // Badge number (bottom left)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(160, 160, 160)
  doc.text(`#${badge.badgeNumber.toString().padStart(4, "0")}`, offX + 6, offY + BADGE_H - 6)

  // QR token text placeholder (bottom right)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(6)
  doc.setTextColor(160, 160, 160)
  const tokenShort = badge.qrToken.slice(0, 12)
  doc.text(tokenShort, offX + BADGE_W - 6, offY + BADGE_H - 6, { align: "right" })

  // Small QR placeholder box (bottom right above token)
  const qrBoxSize = 14
  const qrBoxX = offX + BADGE_W - 6 - qrBoxSize
  const qrBoxY = offY + BADGE_H - 8 - qrBoxSize
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.rect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize)
  doc.setFontSize(5)
  doc.setTextColor(180, 180, 180)
  doc.text("QR", qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize / 2 + 1, { align: "center" })

  // Bottom gold accent line
  doc.setDrawColor(...gold)
  doc.setLineWidth(1)
  doc.line(offX + 3, offY + BADGE_H - 3, offX + BADGE_W - 3, offY + BADGE_H - 3)
}

/* ── Generate multi-page badge PDF (4 per A4, 2x2 grid) ──────────────── */

/**
 * Creates a multi-page PDF with 4 badges per page (2x2 grid on A4).
 * Returns the jsPDF instance for further manipulation or output.
 */
export function generateBadgePDF(badges: BadgeData[]): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageW = 210
  const pageH = 297

  // Center the 2x2 grid on A4
  const marginX = (pageW - BADGE_W * 2) / 2
  const marginY = (pageH - BADGE_H * 2) / 2

  // Grid positions (2 columns, 2 rows)
  const positions = [
    { x: marginX, y: marginY },                          // top-left
    { x: marginX + BADGE_W, y: marginY },                // top-right
    { x: marginX, y: marginY + BADGE_H },                // bottom-left
    { x: marginX + BADGE_W, y: marginY + BADGE_H },      // bottom-right
  ]

  for (let i = 0; i < badges.length; i++) {
    const posIndex = i % 4
    if (i > 0 && posIndex === 0) {
      doc.addPage()
    }

    const pos = positions[posIndex]
    drawBadge(doc, badges[i], pos.x, pos.y)
  }

  return doc
}
