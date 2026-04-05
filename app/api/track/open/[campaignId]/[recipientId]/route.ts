import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

/** 1x1 transparent GIF pixel */
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
)

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; recipientId: string }> }
) {
  const { campaignId, recipientId } = await params

  // Fire-and-forget: update tracking in the background so the pixel returns fast
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Only set opened_at if it hasn't been set yet
    const { data: recipient } = await supabase
      .from("email_campaign_recipients")
      .select("id, opened_at")
      .eq("id", recipientId)
      .eq("campaign_id", campaignId)
      .single()

    if (recipient && !recipient.opened_at) {
      // Update the recipient's opened_at timestamp
      await supabase
        .from("email_campaign_recipients")
        .update({ opened_at: new Date().toISOString() })
        .eq("id", recipientId)
        .eq("campaign_id", campaignId)

      // Increment total_opened on the campaign
      const { data: campaign } = await supabase
        .from("email_campaigns")
        .select("opened_count")
        .eq("id", campaignId)
        .single()

      if (campaign) {
        await supabase
          .from("email_campaigns")
          .update({ opened_count: (campaign.opened_count ?? 0) + 1 })
          .eq("id", campaignId)
      }
    }
  } catch (err) {
    // Silently fail — never block the pixel response
    console.error("[track/open] Error:", err)
  }

  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  })
}
