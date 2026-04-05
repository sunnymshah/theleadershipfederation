/**
 * Certificate PDF Generation
 *
 * Generates a landscape A4 participation certificate using jsPDF.
 * Works server-side in Node.js (no browser APIs required).
 */

import { jsPDF } from "jspdf"

export interface CertificateData {
  attendeeName: string
  eventTitle: string
  eventDate: string
  eventEndDate?: string
  venue: string
  eventSlug: string
  attendeeIdShort: string
}

/**
 * Format a date range for display on the certificate.
 */
function formatCertificateDate(startDate: string, endDate?: string): string {
  const start = new Date(startDate)
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  }

  if (endDate) {
    const end = new Date(endDate)
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString("en-IN", opts)
    }
    // Same month/year
    if (
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      return `${start.getDate()} - ${end.toLocaleDateString("en-IN", opts)}`
    }
    return `${start.toLocaleDateString("en-IN", opts)} - ${end.toLocaleDateString("en-IN", opts)}`
  }

  return start.toLocaleDateString("en-IN", opts)
}

/**
 * Draw a decorative gold border on the certificate.
 */
function drawBorder(doc: jsPDF, w: number, h: number) {
  const gold: [number, number, number] = [231, 171, 28] // #e7ab1c

  // Outer border
  doc.setDrawColor(...gold)
  doc.setLineWidth(3)
  doc.rect(10, 10, w - 20, h - 20)

  // Inner border
  doc.setLineWidth(1)
  doc.rect(16, 16, w - 32, h - 32)

  // Corner ornaments (small diamond shapes)
  const corners = [
    [13, 13],
    [w - 13, 13],
    [13, h - 13],
    [w - 13, h - 13],
  ]
  doc.setFillColor(...gold)
  for (const [cx, cy] of corners) {
    doc.circle(cx, cy, 2.5, "F")
  }

  // Decorative lines at top and bottom
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.5)
  const lineY1 = 35
  const lineY2 = h - 35
  doc.line(40, lineY1, w - 40, lineY1)
  doc.line(40, lineY2, w - 40, lineY2)
}

/**
 * Generate a PDF certificate and return it as a Uint8Array.
 */
export function generateCertificatePdf(data: CertificateData): Uint8Array {
  // Landscape A4: 297mm x 210mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  })

  const w = 297
  const h = 210

  // Background: warm white
  doc.setFillColor(255, 253, 248)
  doc.rect(0, 0, w, h, "F")

  // Draw decorative border
  drawBorder(doc, w, h)

  // Certificate title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(28)
  doc.setTextColor(231, 171, 28) // Gold
  doc.text("CERTIFICATE OF PARTICIPATION", w / 2, 52, { align: "center" })

  // Decorative separator
  doc.setDrawColor(231, 171, 28)
  doc.setLineWidth(0.8)
  doc.line(w / 2 - 30, 58, w / 2 + 30, 58)

  // "This is to certify that"
  doc.setFont("helvetica", "normal")
  doc.setFontSize(13)
  doc.setTextColor(80, 80, 80)
  doc.text("This is to certify that", w / 2, 72, { align: "center" })

  // Attendee name
  doc.setFont("helvetica", "bold")
  doc.setFontSize(26)
  doc.setTextColor(30, 30, 30)
  doc.text(data.attendeeName, w / 2, 86, { align: "center" })

  // Underline for the name
  const nameWidth = doc.getTextWidth(data.attendeeName)
  doc.setDrawColor(231, 171, 28)
  doc.setLineWidth(0.6)
  doc.line(w / 2 - nameWidth / 2 - 5, 89, w / 2 + nameWidth / 2 + 5, 89)

  // "has successfully participated in"
  doc.setFont("helvetica", "normal")
  doc.setFontSize(13)
  doc.setTextColor(80, 80, 80)
  doc.text("has successfully participated in", w / 2, 101, { align: "center" })

  // Event title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.setTextColor(30, 30, 30)
  doc.text(data.eventTitle, w / 2, 114, { align: "center" })

  // Event date and venue
  const dateStr = formatCertificateDate(data.eventDate, data.eventEndDate)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(`${dateStr}  |  ${data.venue}`, w / 2, 126, { align: "center" })

  // "Organized by"
  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.setTextColor(120, 120, 120)
  doc.text("Organized by", w / 2, 142, { align: "center" })

  // Organization name
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.setTextColor(231, 171, 28) // Gold
  doc.text("The Leadership Federation", w / 2, 151, { align: "center" })

  // Certificate number (bottom left)
  const certNumber = `CERT-${data.eventSlug}-${data.attendeeIdShort}`
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(160, 160, 160)
  doc.text(`Certificate No: ${certNumber}`, 25, h - 22)

  // Date of issue (bottom right)
  const issueDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  doc.text(`Date of Issue: ${issueDate}`, w - 25, h - 22, { align: "right" })

  // Return as Uint8Array (works in Node.js)
  return doc.output("arraybuffer") as unknown as Uint8Array
}
