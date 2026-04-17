import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

/**
 * Allow-list of hosts we're willing to redirect to. The `url` query param
 * comes from the email template and is attacker-controllable (anyone with
 * the tracking URL can substitute a different `?url=` value). Without this
 * list the endpoint would be an open redirect that can be pasted into
 * phishing emails while appearing to originate from our domain.
 */
const REDIRECT_HOST_ALLOWLIST = new Set([
  "theleadershipfederation.com",
  "www.theleadershipfederation.com",
  "theleadershipfederation.vercel.app",
  "leadershipfederation.com",
  "www.leadershipfederation.com",
])

function safeRedirectTarget(raw: string | null, requestOrigin: string): string {
  if (!raw) return "/"
  // Same-origin relative path
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw
  try {
    const parsed = new URL(raw, requestOrigin)
    if (parsed.origin === requestOrigin) return parsed.toString()
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "/"
    if (REDIRECT_HOST_ALLOWLIST.has(parsed.hostname.toLowerCase())) {
      return parsed.toString()
    }
  } catch { /* fall through */ }
  return "/"
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; recipientId: string }> }
) {
  const { campaignId, recipientId } = await params
  const rawUrl = request.nextUrl.searchParams.get("url")

  // Validate redirect target against allow-list to prevent using this
  // endpoint as an open redirect in phishing campaigns.
  const destination = safeRedirectTarget(rawUrl, request.nextUrl.origin)

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

  return NextResponse.redirect(destination, {
    status: 302,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  })
}
