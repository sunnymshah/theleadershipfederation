import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"
import { isValidUUID } from "@/lib/security"

/**
 * GET /api/qr/[token]
 *
 * Generates and returns a QR code PNG image for the given token.
 * Used in confirmation emails so each attendee gets a unique, always-rendering QR code.
 * Cached for 1 year (immutable — tokens don't change).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  if (!token || token.length < 8 || token.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(token)) {
    return new Response("Invalid token", { status: 400 })
  }

  if (!token || token.length < 8) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 })
  }

  const buffer = await QRCode.toBuffer(token, {
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
    errorCorrectionLevel: "H",
    type: "png",
  })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
