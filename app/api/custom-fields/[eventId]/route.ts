import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: fields, error } = await supabase
      .from("custom_fields")
      .select("id, field_label, field_name, field_type, options, is_required, sort_order")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ fields: fields ?? [] }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    })
  } catch (err) {
    console.error("[custom-fields] Error:", err)
    return NextResponse.json(
      { error: "Failed to fetch custom fields." },
      { status: 500 }
    )
  }
}
