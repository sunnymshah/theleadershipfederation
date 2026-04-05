import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; recipientId: string }> }
) {
  const { campaignId, recipientId } = await params
  const url = request.nextUrl.searchParams.get("url")

  // Default redirect destination
  const destination = url || "/"

  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Only set clicked_at if it hasn't been set yet
    const { data: recipient } = await supabase
      .from("email_campaign_recipients")
      .select("id, clicked_at")
      .eq("id", recipientId)
      .eq("campaign_id", campaignId)
      .single()

    if (recipient && !recipient.clicked_at) {
      // Update the recipient's clicked_at timestamp
      await supabase
        .from("email_campaign_recipients")
        .update({ clicked_at: new Date().toISOString() })
        .eq("id", recipientId)
        .eq("campaign_id", campaignId)

      // Increment total_clicked on the campaign
      const { data: campaign } = await supabase
        .from("email_campaigns")
        .select("clicked_count")
        .eq("id", campaignId)
        .single()

      if (campaign) {
        await supabase
          .from("email_campaigns")
          .update({ clicked_count: (campaign.clicked_count ?? 0) + 1 })
          .eq("id", campaignId)
      }
    }
  } catch (err) {
    // Silently fail — always redirect
    console.error("[track/click] Error:", err)
  }

  return NextResponse.redirect(destination, { status: 302 })
}
