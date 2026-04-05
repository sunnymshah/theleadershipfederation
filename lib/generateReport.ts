/**
 * Comprehensive Event Report PDF Generation
 *
 * Generates a multi-page report including:
 *   - Cover page
 *   - Executive summary with key metrics
 *   - Registration breakdown table
 *   - Revenue bar chart (drawn with jsPDF)
 *   - Attendee list table
 *   - Sponsor acknowledgment page
 *
 * Uses jsPDF. Works server-side in Node.js.
 */

import { jsPDF } from "jspdf"

/* ── Data interfaces ────────────────────────────────────────────────────── */

export interface ReportEventData {
  title: string
  startDate: string
  endDate?: string
  venue: string
  status: string
}

export interface ReportTicketBreakdown {
  name: string
  sold: number
  limit: number
  priceInr: number
  revenue: number
}

export interface ReportRevenueByDay {
  date: string
  revenue: number
  count: number
}

export interface ReportAttendee {
  name: string
  email: string
  company?: string | null
  designation?: string | null
  status: string
  paymentStatus?: string | null
  ticketName?: string | null
  vipLevel?: string | null
}

export interface ReportSponsor {
  name: string
  tier: string
  website?: string | null
}

export interface ReportSpeaker {
  name: string
  title?: string | null
  company?: string | null
}

export interface ReportData {
  event: ReportEventData
  totalRegistrations: number
  totalCheckedIn: number
  checkInRate: number
  totalRevenue: number
  ticketBreakdown: ReportTicketBreakdown[]
  revenueByDay: ReportRevenueByDay[]
  attendees: ReportAttendee[]
  sponsors: ReportSponsor[]
  speakers: ReportSpeaker[]
  statusBreakdown: Record<string, number>
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const gold: [number, number, number] = [231, 171, 28]
const dark: [number, number, number] = [30, 30, 30]
const gray: [number, number, number] = [100, 100, 100]
const lightGray: [number, number, number] = [200, 200, 200]

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function hLine(doc: jsPDF, y: number, x1: number, x2: number, color?: [number, number, number]) {
  if (color) doc.setDrawColor(...color)
  doc.line(x1, y, x2, y)
}

/** Check if adding contentHeight would overflow the page; if so, add a new page and return new Y. */
function checkPageBreak(doc: jsPDF, y: number, contentHeight: number, marginTop: number = 20): number {
  if (y + contentHeight > 280) {
    doc.addPage()
    return marginTop
  }
  return y
}

/* ── Cover Page ──────────────────────────────────────────────────────────── */

function drawCoverPage(doc: jsPDF, data: ReportData) {
  const w = 210

  // Gold accent bar
  doc.setFillColor(...gold)
  doc.rect(0, 0, w, 6, "F")

  // Organization name
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(...gold)
  doc.text("THE LEADERSHIP FEDERATION", w / 2, 40, { align: "center" })

  // Divider
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.8)
  doc.line(60, 46, 150, 46)

  // Event title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(28)
  doc.setTextColor(...dark)
  const titleLines = doc.splitTextToSize(data.event.title, 150)
  doc.text(titleLines, w / 2, 70, { align: "center" })

  const titleEndY = 70 + titleLines.length * 12

  // Event details
  doc.setFont("helvetica", "normal")
  doc.setFontSize(13)
  doc.setTextColor(...gray)

  let detailY = titleEndY + 10
  const dateStr = data.event.endDate
    ? `${formatDate(data.event.startDate)} - ${formatDate(data.event.endDate)}`
    : formatDate(data.event.startDate)
  doc.text(dateStr, w / 2, detailY, { align: "center" })

  detailY += 8
  doc.text(data.event.venue, w / 2, detailY, { align: "center" })

  // Report label
  detailY += 24
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(w / 2 - 35, detailY - 5, 70, 14, 3, 3, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(...dark)
  doc.text("EVENT REPORT", w / 2, detailY + 4, { align: "center" })

  // Generated date
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(160, 160, 160)
  doc.text(
    `Generated on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
    w / 2,
    260,
    { align: "center" }
  )

  // Bottom gold bar
  doc.setFillColor(...gold)
  doc.rect(0, 291, w, 6, "F")
}

/* ── Executive Summary ──────────────────────────────────────────────────── */

function drawExecutiveSummary(doc: jsPDF, data: ReportData): number {
  const mL = 20
  const mR = 190
  let y = 20

  // Section title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(...dark)
  doc.text("Executive Summary", mL, y)
  y += 3
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.8)
  hLine(doc, y, mL, mR)
  y += 12

  // Key metrics grid (2x2)
  const metrics = [
    { label: "Total Registrations", value: data.totalRegistrations.toString() },
    { label: "Total Revenue", value: formatINR(data.totalRevenue) },
    { label: "Checked In", value: `${data.totalCheckedIn} (${data.checkInRate}%)` },
    { label: "Speakers", value: data.speakers.length.toString() },
  ]

  const cardW = 80
  const cardH = 24
  const gap = 5

  for (let i = 0; i < metrics.length; i++) {
    const col = i % 2
    const row = Math.floor(i / 2)
    const cx = mL + col * (cardW + gap)
    const cy = y + row * (cardH + gap)

    doc.setFillColor(248, 248, 248)
    doc.roundedRect(cx, cy, cardW, cardH, 2, 2, "F")

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...gray)
    doc.text(metrics[i].label, cx + 6, cy + 8)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(...dark)
    doc.text(metrics[i].value, cx + 6, cy + 18)
  }

  y += 2 * (cardH + gap) + 8

  // Status breakdown
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(...dark)
  doc.text("Registration Status Breakdown", mL, y)
  y += 6

  const statuses = Object.entries(data.statusBreakdown)
  for (const [status, count] of statuses) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(...gray)
    doc.text(`${status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}:`, mL + 4, y)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...dark)
    doc.text(count.toString(), mL + 55, y)
    y += 6
  }

  return y
}

/* ── Ticket Breakdown Table ──────────────────────────────────────────────── */

function drawTicketBreakdown(doc: jsPDF, data: ReportData, startY: number): number {
  const mL = 20
  const mR = 190
  let y = checkPageBreak(doc, startY, 50)

  // Section title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(...dark)
  doc.text("Ticket Breakdown", mL, y)
  y += 3
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.6)
  hLine(doc, y, mL, mR)
  y += 8

  if (data.ticketBreakdown.length === 0) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(...gray)
    doc.text("No ticket data available.", mL, y)
    return y + 10
  }

  // Table header
  doc.setFillColor(245, 245, 245)
  doc.rect(mL, y - 1, mR - mL, 8, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text("Ticket", mL + 2, y + 4)
  doc.text("Price", 95, y + 4)
  doc.text("Sold", 120, y + 4)
  doc.text("Limit", 140, y + 4)
  doc.text("Revenue", mR - 2, y + 4, { align: "right" })
  y += 10

  for (const t of data.ticketBreakdown) {
    y = checkPageBreak(doc, y, 8)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...dark)
    const nameLines = doc.splitTextToSize(t.name, 70)
    doc.text(nameLines[0], mL + 2, y)
    doc.text(formatINR(t.priceInr), 95, y)
    doc.text(t.sold.toString(), 120, y)
    doc.text(t.limit.toString(), 140, y)
    doc.setFont("helvetica", "bold")
    doc.text(formatINR(t.revenue), mR - 2, y, { align: "right" })
    y += 7

    doc.setDrawColor(...lightGray)
    doc.setLineWidth(0.2)
    hLine(doc, y - 2, mL, mR)
  }

  // Total row
  y += 2
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.5)
  hLine(doc, y - 2, mL, mR)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(...dark)
  doc.text("Total Revenue", mL + 2, y + 3)
  doc.text(formatINR(data.totalRevenue), mR - 2, y + 3, { align: "right" })

  return y + 12
}

/* ── Revenue Bar Chart ───────────────────────────────────────────────────── */

function drawRevenueChart(doc: jsPDF, data: ReportData, startY: number): number {
  if (data.revenueByDay.length === 0) return startY

  const mL = 20
  const mR = 190
  let y = checkPageBreak(doc, startY, 80)

  // Section title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(...dark)
  doc.text("Revenue by Day", mL, y)
  y += 3
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.6)
  hLine(doc, y, mL, mR)
  y += 10

  const chartX = mL + 10
  const chartW = 150
  const chartH = 50
  const chartY = y

  // Find max revenue for scaling
  const maxRev = Math.max(...data.revenueByDay.map((d) => d.revenue), 1)

  // Draw axes
  doc.setDrawColor(...lightGray)
  doc.setLineWidth(0.3)
  doc.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH) // x-axis
  doc.line(chartX, chartY, chartX, chartY + chartH) // y-axis

  // Y-axis labels
  doc.setFont("helvetica", "normal")
  doc.setFontSize(6)
  doc.setTextColor(...gray)
  doc.text(formatINR(maxRev), chartX - 2, chartY + 2, { align: "right" })
  doc.text(formatINR(0), chartX - 2, chartY + chartH, { align: "right" })

  // Bars
  const days = data.revenueByDay.slice(-15) // Show last 15 days max
  const barW = Math.min(chartW / days.length - 2, 12)
  const spacing = chartW / days.length

  for (let i = 0; i < days.length; i++) {
    const d = days[i]
    const barH = (d.revenue / maxRev) * chartH
    const bx = chartX + i * spacing + (spacing - barW) / 2
    const by = chartY + chartH - barH

    doc.setFillColor(...gold)
    doc.rect(bx, by, barW, barH, "F")

    // Date label
    doc.setFontSize(5)
    doc.setTextColor(...gray)
    const shortDate = d.date.slice(5) // MM-DD
    doc.text(shortDate, bx + barW / 2, chartY + chartH + 4, { align: "center" })
  }

  return chartY + chartH + 14
}

/* ── Attendee List Table ─────────────────────────────────────────────────── */

function drawAttendeeList(doc: jsPDF, data: ReportData, startY: number): number {
  const mL = 20
  const mR = 190

  doc.addPage()
  let y = 20

  // Section title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(...dark)
  doc.text("Attendee List", mL, y)
  y += 3
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.6)
  hLine(doc, y, mL, mR)
  y += 8

  // Table header
  doc.setFillColor(245, 245, 245)
  doc.rect(mL, y - 1, mR - mL, 8, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(80, 80, 80)
  doc.text("#", mL + 2, y + 4)
  doc.text("Name", mL + 10, y + 4)
  doc.text("Company", 80, y + 4)
  doc.text("Ticket", 125, y + 4)
  doc.text("Status", 155, y + 4)
  doc.text("Payment", mR - 2, y + 4, { align: "right" })
  y += 10

  const attendees = data.attendees.slice(0, 200) // Limit to 200 for PDF size
  for (let i = 0; i < attendees.length; i++) {
    y = checkPageBreak(doc, y, 7, 20)
    if (y === 20) {
      // Re-draw header on new page
      doc.setFillColor(245, 245, 245)
      doc.rect(mL, y - 1, mR - mL, 8, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7)
      doc.setTextColor(80, 80, 80)
      doc.text("#", mL + 2, y + 4)
      doc.text("Name", mL + 10, y + 4)
      doc.text("Company", 80, y + 4)
      doc.text("Ticket", 125, y + 4)
      doc.text("Status", 155, y + 4)
      doc.text("Payment", mR - 2, y + 4, { align: "right" })
      y += 10
    }

    const a = attendees[i]
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(...dark)

    doc.text((i + 1).toString(), mL + 2, y)
    doc.text(a.name.slice(0, 30), mL + 10, y)
    doc.setTextColor(...gray)
    doc.text((a.company ?? "").slice(0, 25), 80, y)
    doc.text((a.ticketName ?? "").slice(0, 18), 125, y)
    doc.text(a.status.replace(/_/g, " "), 155, y)
    doc.text((a.paymentStatus ?? "").replace(/_/g, " "), mR - 2, y, { align: "right" })

    y += 6

    // Light row divider
    if (i < attendees.length - 1) {
      doc.setDrawColor(230, 230, 230)
      doc.setLineWidth(0.1)
      hLine(doc, y - 2, mL, mR)
    }
  }

  if (data.attendees.length > 200) {
    y += 6
    doc.setFont("helvetica", "italic")
    doc.setFontSize(8)
    doc.setTextColor(...gray)
    doc.text(`... and ${data.attendees.length - 200} more attendees (see CSV export for full list)`, mL, y)
  }

  return y
}

/* ── Sponsor Acknowledgment ──────────────────────────────────────────────── */

function drawSponsorPage(doc: jsPDF, data: ReportData) {
  if (data.sponsors.length === 0) return

  const mL = 20
  const mR = 190
  const w = 210

  doc.addPage()
  let y = 30

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(...dark)
  doc.text("Sponsors & Partners", w / 2, y, { align: "center" })
  y += 4
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.8)
  doc.line(70, y, 140, y)
  y += 14

  // Group by tier
  const tierOrder = ["title", "platinum", "gold", "silver", "bronze", "partner"]
  const grouped = new Map<string, ReportSponsor[]>()

  for (const s of data.sponsors) {
    const list = grouped.get(s.tier) ?? []
    list.push(s)
    grouped.set(s.tier, list)
  }

  for (const tier of tierOrder) {
    const sponsors = grouped.get(tier)
    if (!sponsors || sponsors.length === 0) continue

    y = checkPageBreak(doc, y, 20)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(...gold)
    doc.text(tier.charAt(0).toUpperCase() + tier.slice(1) + " Sponsors", mL, y)
    y += 7

    for (const s of sponsors) {
      y = checkPageBreak(doc, y, 8)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(...dark)
      doc.text(s.name, mL + 6, y)
      if (s.website) {
        doc.setTextColor(...gray)
        doc.setFontSize(8)
        doc.text(s.website, mL + 6 + doc.getTextWidth(s.name + "  "), y)
      }
      y += 6
    }

    y += 4
  }
}

/* ── Main export ─────────────────────────────────────────────────────────── */

/**
 * Generate a comprehensive event report PDF.
 * Returns the PDF as a Uint8Array.
 */
export function generateReportPdf(data: ReportData): Uint8Array {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Page 1: Cover
  drawCoverPage(doc, data)

  // Page 2: Executive Summary + Ticket Breakdown
  doc.addPage()
  let y = drawExecutiveSummary(doc, data)
  y = drawTicketBreakdown(doc, data, y + 6)
  y = drawRevenueChart(doc, data, y + 4)

  // Attendee list (starts on new page internally)
  drawAttendeeList(doc, data, y)

  // Sponsors (starts on new page internally)
  drawSponsorPage(doc, data)

  return doc.output("arraybuffer") as unknown as Uint8Array
}
