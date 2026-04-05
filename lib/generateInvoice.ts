/**
 * GST-Compliant Invoice PDF Generation
 *
 * Generates a portrait A4 tax invoice using jsPDF.
 * Works server-side in Node.js (no browser APIs required).
 */

import { jsPDF } from "jspdf"

export interface InvoiceData {
  invoiceNumber: string
  invoiceDate: string
  // Buyer details
  attendeeName: string
  attendeeEmail: string
  attendeeCompany?: string | null
  attendeePhone?: string | null
  // Line item
  ticketName: string
  eventTitle: string
  priceInr: number // Base price in INR (paise-free, whole rupees)
  // Optional
  eventDate: string
  venue: string
}

/** Format currency in Indian Rupee notation */
function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Draw a horizontal line across the page.
 */
function hLine(doc: jsPDF, y: number, x1: number, x2: number, color?: [number, number, number]) {
  if (color) doc.setDrawColor(...color)
  doc.line(x1, y, x2, y)
}

/**
 * Generate a GST-compliant tax invoice PDF.
 * Returns the PDF as a Uint8Array.
 */
export function generateInvoicePdf(data: InvoiceData): Uint8Array {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const w = 210
  const marginL = 20
  const marginR = 190
  const gold: [number, number, number] = [231, 171, 28]
  const darkText: [number, number, number] = [30, 30, 30]
  const grayText: [number, number, number] = [100, 100, 100]
  const lightGray: [number, number, number] = [200, 200, 200]

  let y = 20

  // ── Header: Company branding ──────────────────────────────────────
  // Gold accent bar
  doc.setFillColor(...gold)
  doc.rect(0, 0, w, 5, "F")

  y = 18
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(...gold)
  doc.text("The Leadership Federation", marginL, y)

  y += 7
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...grayText)
  doc.text("Event Management & Leadership Development", marginL, y)
  y += 4
  doc.text("Email: info@theleadershipfederation.com", marginL, y)
  y += 4
  doc.text("GSTIN: [To be filled with actual GSTIN]", marginL, y)

  // TAX INVOICE title (right aligned)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(24)
  doc.setTextColor(...darkText)
  doc.text("TAX INVOICE", marginR, 22, { align: "right" })

  // ── Divider ───────────────────────────────────────────────────────
  y += 8
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.8)
  hLine(doc, y, marginL, marginR)

  // ── Invoice details (left) & Bill To (right) ─────────────────────
  y += 8

  // Left column: Invoice details
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...darkText)
  doc.text("Invoice Details", marginL, y)

  y += 6
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...grayText)
  doc.text(`Invoice No:`, marginL, y)
  doc.setTextColor(...darkText)
  doc.text(data.invoiceNumber, marginL + 28, y)

  y += 5
  doc.setTextColor(...grayText)
  doc.text(`Invoice Date:`, marginL, y)
  doc.setTextColor(...darkText)
  const formattedDate = new Date(data.invoiceDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  doc.text(formattedDate, marginL + 28, y)

  // Right column: Bill To
  const billToX = 115
  let billY = y - 11

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...darkText)
  doc.text("Bill To", billToX, billY)

  billY += 6
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...darkText)
  doc.text(data.attendeeName, billToX, billY)

  billY += 5
  doc.setTextColor(...grayText)
  doc.text(data.attendeeEmail, billToX, billY)

  if (data.attendeeCompany) {
    billY += 5
    doc.text(data.attendeeCompany, billToX, billY)
  }

  if (data.attendeePhone) {
    billY += 5
    doc.text(data.attendeePhone, billToX, billY)
  }

  // ── Line item table ──────────────────────────────────────────────
  y += 16

  // Table header background
  doc.setFillColor(245, 245, 245)
  doc.rect(marginL, y - 1, marginR - marginL, 9, "F")
  doc.setDrawColor(...lightGray)
  doc.setLineWidth(0.3)
  hLine(doc, y - 1, marginL, marginR, lightGray)
  hLine(doc, y + 8, marginL, marginR, lightGray)

  // Column headers
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  const cols = {
    item: marginL + 2,
    hsn: 95,
    qty: 112,
    rate: 127,
    cgst: 147,
    sgst: 164,
    total: marginR - 2,
  }

  doc.text("Item Description", cols.item, y + 5)
  doc.text("HSN/SAC", cols.hsn, y + 5)
  doc.text("Qty", cols.qty, y + 5)
  doc.text("Rate", cols.rate, y + 5)
  doc.text("CGST (9%)", cols.cgst, y + 5)
  doc.text("SGST (9%)", cols.sgst, y + 5)
  doc.text("Total", cols.total, y + 5, { align: "right" })

  // Table row
  y += 14
  const rate = data.priceInr
  const cgst = Math.round(rate * 0.09 * 100) / 100
  const sgst = Math.round(rate * 0.09 * 100) / 100
  const total = rate + cgst + sgst

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...darkText)

  // Item description (may wrap)
  const itemDesc = `${data.ticketName} - ${data.eventTitle}`
  const itemLines = doc.splitTextToSize(itemDesc, 70)
  doc.text(itemLines, cols.item, y)

  doc.text("998554", cols.hsn, y) // SAC code for event management services
  doc.text("1", cols.qty, y)
  doc.text(formatINR(rate), cols.rate, y)
  doc.text(formatINR(cgst), cols.cgst, y)
  doc.text(formatINR(sgst), cols.sgst, y)
  doc.setFont("helvetica", "bold")
  doc.text(formatINR(total), cols.total, y, { align: "right" })

  // Row bottom border
  const rowBottom = y + Math.max(itemLines.length * 4, 4) + 4
  hLine(doc, rowBottom, marginL, marginR, lightGray)

  // ── Totals section ───────────────────────────────────────────────
  let totY = rowBottom + 8
  const totLabelX = 140
  const totValueX = marginR - 2

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...grayText)
  doc.text("Subtotal:", totLabelX, totY)
  doc.setTextColor(...darkText)
  doc.text(formatINR(rate), totValueX, totY, { align: "right" })

  totY += 6
  doc.setTextColor(...grayText)
  doc.text("CGST (9%):", totLabelX, totY)
  doc.setTextColor(...darkText)
  doc.text(formatINR(cgst), totValueX, totY, { align: "right" })

  totY += 6
  doc.setTextColor(...grayText)
  doc.text("SGST (9%):", totLabelX, totY)
  doc.setTextColor(...darkText)
  doc.text(formatINR(sgst), totValueX, totY, { align: "right" })

  totY += 3
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.6)
  hLine(doc, totY, totLabelX, marginR)

  totY += 7
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(...darkText)
  doc.text("Grand Total:", totLabelX, totY)
  doc.text(formatINR(total), totValueX, totY, { align: "right" })

  // ── Amount in words ──────────────────────────────────────────────
  totY += 10
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...grayText)
  doc.text(`Amount in words: ${numberToWords(Math.round(total))} Rupees Only`, marginL, totY)

  // ── Event details ────────────────────────────────────────────────
  totY += 12
  doc.setDrawColor(...lightGray)
  doc.setLineWidth(0.3)
  hLine(doc, totY, marginL, marginR)

  totY += 7
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...darkText)
  doc.text("Event Details", marginL, totY)

  totY += 5
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...grayText)
  doc.text(`Event: ${data.eventTitle}`, marginL, totY)
  totY += 4
  const evtDate = new Date(data.eventDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  doc.text(`Date: ${evtDate}`, marginL, totY)
  totY += 4
  doc.text(`Venue: ${data.venue}`, marginL, totY)

  // ── Footer ───────────────────────────────────────────────────────
  const footerY = 272
  doc.setDrawColor(...gold)
  doc.setLineWidth(0.5)
  hLine(doc, footerY, marginL, marginR)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...grayText)
  doc.text("Thank you for your registration!", w / 2, footerY + 6, { align: "center" })
  doc.text(
    "This is a computer-generated invoice and does not require a signature.",
    w / 2,
    footerY + 11,
    { align: "center" }
  )

  // Gold accent bar at bottom
  doc.setFillColor(...gold)
  doc.rect(0, 292, w, 5, "F")

  return doc.output("arraybuffer") as unknown as Uint8Array
}

/**
 * Convert a number to words (Indian English, up to crores).
 * Simplified implementation for invoice amounts.
 */
function numberToWords(num: number): string {
  if (num === 0) return "Zero"

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ]
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ]

  function convert(n: number): string {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "")
    if (n < 1000)
      return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convert(n % 100) : "")
    if (n < 100000) {
      const thousands = Math.floor(n / 1000)
      return convert(thousands) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "")
    }
    if (n < 10000000) {
      const lakhs = Math.floor(n / 100000)
      return convert(lakhs) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "")
    }
    const crores = Math.floor(n / 10000000)
    return convert(crores) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "")
  }

  return convert(num)
}
