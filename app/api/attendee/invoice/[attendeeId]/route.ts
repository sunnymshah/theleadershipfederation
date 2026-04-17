/**
 * Public Invoice PDF Download API Route
 *
 * GET /api/attendee/invoice/[attendeeId]?token=<qr_token>
 * Returns a downloadable GST invoice PDF for a paid attendee.
 * Verifies the qr_token for public access (no auth required).
 */

import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { generateInvoicePdf } from "@/lib/generateInvoice"
import { isValidUUID } from "@/lib/security"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attendeeId: string }> }
) {
  try {
    const { attendeeId } = await params
    if (!isValidUUID(attendeeId)) {
      return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400, headers: { "content-type": "application/json" } })
    }
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { error: "Token is required for verification" },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Fetch attendee with event and ticket
    const { data: attendee, error: attendeeError } = await supabase
      .from("attendees")
      .select(`
        id, name, email, phone, company, payment_status, payment_amount,
        invoice_number, invoice_generated_at, qr_token,
        tickets ( id, name, price_inr ),
        events ( id, title, slug, start_date, end_date, venue )
      `)
      .eq("id", attendeeId)
      .single()

    if (attendeeError || !attendee) {
      return NextResponse.json(
        { error: "Attendee not found" },
        { status: 404 }
      )
    }

    // Verify token
    if (attendee.qr_token !== token) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 403 }
      )
    }

    // Check payment status
    if (attendee.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Invoices are only available for paid registrations" },
        { status: 400 }
      )
    }

    const event = attendee.events as unknown as {
      id: string
      title: string
      slug: string
      start_date: string
      end_date: string
      venue: string
    } | null

    const ticket = attendee.tickets as unknown as {
      id: string
      name: string
      price_inr: number
    } | null

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Generate or reuse invoice number
    let invoiceNumber = attendee.invoice_number as string | null

    if (!invoiceNumber) {
      const today = new Date()
      const dateStr =
        today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, "0") +
        today.getDate().toString().padStart(2, "0")
      const prefix = `INV-${dateStr}-`

      const { count } = await supabase
        .from("attendees")
        .select("id", { count: "exact", head: true })
        .like("invoice_number", `${prefix}%`)

      invoiceNumber = `${prefix}${((count ?? 0) + 1).toString().padStart(4, "0")}`

      await supabase
        .from("attendees")
        .update({
          invoice_number: invoiceNumber,
          invoice_generated_at: new Date().toISOString(),
        })
        .eq("id", attendeeId)
    }

    const priceInr = ticket?.price_inr ?? attendee.payment_amount ?? 0

    // Generate PDF
    const pdfBytes = generateInvoicePdf({
      invoiceNumber,
      invoiceDate: (attendee.invoice_generated_at as string) || new Date().toISOString(),
      attendeeName: attendee.name,
      attendeeEmail: attendee.email,
      attendeeCompany: attendee.company,
      attendeePhone: attendee.phone,
      ticketName: ticket?.name ?? "Event Registration",
      eventTitle: event.title,
      priceInr,
      eventDate: event.start_date,
      venue: event.venue || "",
    })

    const safeName = attendee.name
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${safeName}-${invoiceNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[attendee/invoice] Error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
