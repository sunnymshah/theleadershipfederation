/**
 * Invoice PDF Download API Route
 *
 * GET /api/invoices/[attendeeId]
 * Returns a downloadable GST invoice PDF for a paid attendee.
 */

import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { generateInvoicePdf } from "@/lib/generateInvoice"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attendeeId: string }> }
) {
  try {
    const { attendeeId } = await params
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch attendee with event and ticket
    const { data: attendee, error: attendeeError } = await supabase
      .from("attendees")
      .select(`
        id, name, email, phone, company, payment_status, payment_amount, invoice_number, invoice_generated_at,
        tickets ( id, name, price_inr ),
        events ( id, title, slug, start_date, end_date, venue )
      `)
      .eq("id", attendeeId)
      .single()

    if (attendeeError || !attendee) {
      return NextResponse.json(
        { error: attendeeError?.message || "Attendee not found" },
        { status: 404 }
      )
    }

    if (attendee.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Invoices can only be generated for paid attendees" },
        { status: 400 }
      )
    }

    const event = attendee.events as unknown as {
      id: string; title: string; slug: string
      start_date: string; end_date: string; venue: string
    } | null

    const ticket = attendee.tickets as unknown as {
      id: string; name: string; price_inr: number
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
    console.error("[invoices API] Error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
