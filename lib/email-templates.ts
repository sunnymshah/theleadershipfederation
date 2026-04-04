/**
 * ─── EMAIL HTML TEMPLATES ──────────────────────────────────────────────
 *
 * Generates beautiful, mobile-responsive HTML email templates for
 * The Leadership Federation events. Dark premium theme with gold accents.
 */

export interface ConfirmationEmailData {
  attendeeName: string
  attendeeEmail: string
  eventTitle: string
  eventDate: string
  eventEndDate?: string
  eventVenue: string
  ticketName: string | null
  qrToken: string
  /** CID reference for the inline QR code image attachment */
  qrCid: string
}

/**
 * Formats a date range string for display in the email.
 */
function formatEventDateRange(startDate: string, endDate?: string): string {
  const start = new Date(startDate)
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }

  const dateStr = start.toLocaleDateString("en-IN", opts)
  const timeStr = start.toLocaleTimeString("en-IN", timeOpts)

  if (endDate) {
    const end = new Date(endDate)
    const endDateStr = end.toLocaleDateString("en-IN", opts)
    const endTimeStr = end.toLocaleTimeString("en-IN", timeOpts)

    if (dateStr === endDateStr) {
      return `${dateStr}, ${timeStr} - ${endTimeStr}`
    }
    return `${dateStr}, ${timeStr} — ${endDateStr}, ${endTimeStr}`
  }

  return `${dateStr} at ${timeStr}`
}

/**
 * Returns a fully self-contained HTML email string for attendee confirmations.
 * Uses inline styles only (no external CSS) for maximum email client compatibility.
 */
export function confirmationEmailHtml(data: ConfirmationEmailData): string {
  const eventDateFormatted = formatEventDateRange(data.eventDate, data.eventEndDate)

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Registration Confirmed - ${escapeHtml(data.eventTitle)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding: 16px !important; }
      .content-cell { padding: 24px 20px !important; }
      .qr-img { width: 180px !important; height: 180px !important; }
      .detail-table td { display: block !important; width: 100% !important; padding: 4px 0 !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <!-- Preheader text (hidden) -->
  <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    Your registration for ${escapeHtml(data.eventTitle)} is confirmed. Here is your QR code for check-in.
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#050505;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <!-- Email container -->
        <table role="presentation" class="email-container" width="580" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a; border-radius:12px; border:1px solid #1a1a1a; overflow:hidden;">

          <!-- Gold accent bar -->
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #c9a84c, #e8d48b, #c9a84c);"></td>
          </tr>

          <!-- Logo / Brand header -->
          <tr>
            <td align="center" style="padding: 32px 24px 16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:24px; font-weight:700; color:#c9a84c; letter-spacing:2px; text-transform:uppercase; font-family: Georgia, 'Times New Roman', serif;">
                    THE LEADERSHIP FEDERATION
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px; background-color:#1a1a1a;"></div>
            </td>
          </tr>

          <!-- Confirmation badge -->
          <tr>
            <td align="center" class="content-cell" style="padding: 32px 32px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.3); border-radius: 8px; padding: 12px 24px;">
                    <span style="font-size:14px; font-weight:600; color:#c9a84c; text-transform:uppercase; letter-spacing:1.5px;">
                      &#10003; Registration Confirmed
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td class="content-cell" style="padding: 24px 32px 8px;">
              <p style="margin:0; font-size:18px; color:#ffffff; font-weight:600;">
                Hello ${escapeHtml(data.attendeeName)},
              </p>
              <p style="margin:12px 0 0; font-size:15px; color:#a0a0a0; line-height:1.6;">
                Thank you for registering. We are pleased to confirm your spot at the event below. Please present the QR code at check-in.
              </p>
            </td>
          </tr>

          <!-- Event details card -->
          <tr>
            <td class="content-cell" style="padding: 16px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111111; border-radius:10px; border:1px solid #1a1a1a;">
                <tr>
                  <td style="padding: 24px;">
                    <!-- Event title -->
                    <p style="margin:0 0 16px; font-size:20px; font-weight:700; color:#ffffff; line-height:1.3;">
                      ${escapeHtml(data.eventTitle)}
                    </p>

                    <!-- Details rows -->
                    <table role="presentation" class="detail-table" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:6px 0; vertical-align:top; width:28px;">
                          <span style="font-size:16px;">&#128197;</span>
                        </td>
                        <td style="padding:6px 0; vertical-align:top;">
                          <span style="font-size:14px; color:#d0d0d0; line-height:1.4;">${escapeHtml(eventDateFormatted)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0; vertical-align:top; width:28px;">
                          <span style="font-size:16px;">&#128205;</span>
                        </td>
                        <td style="padding:6px 0; vertical-align:top;">
                          <span style="font-size:14px; color:#d0d0d0; line-height:1.4;">${escapeHtml(data.eventVenue || "Venue to be announced")}</span>
                        </td>
                      </tr>
                      ${data.ticketName ? `
                      <tr>
                        <td style="padding:6px 0; vertical-align:top; width:28px;">
                          <span style="font-size:16px;">&#127903;</span>
                        </td>
                        <td style="padding:6px 0; vertical-align:top;">
                          <span style="font-size:14px; color:#d0d0d0; line-height:1.4;">${escapeHtml(data.ticketName)}</span>
                        </td>
                      </tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- QR Code section -->
          <tr>
            <td align="center" class="content-cell" style="padding: 16px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color:#111111; border-radius:10px; border:1px solid #1a1a1a;">
                <tr>
                  <td align="center" style="padding: 24px 32px 12px;">
                    <p style="margin:0; font-size:13px; font-weight:600; color:#c9a84c; text-transform:uppercase; letter-spacing:1px;">
                      Your Check-in QR Code
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 8px 32px;">
                    <div style="background-color:#ffffff; border-radius:8px; padding:12px; display:inline-block;">
                      <img class="qr-img" src="cid:${escapeHtml(data.qrCid)}" alt="Check-in QR Code" width="200" height="200" style="display:block; width:200px; height:200px; border:0;" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 12px 32px 24px;">
                    <p style="margin:0; font-size:12px; color:#666666; line-height:1.4;">
                      Token: ${escapeHtml(data.qrToken.slice(0, 8))}...
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Important note -->
          <tr>
            <td class="content-cell" style="padding: 8px 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:rgba(201,168,76,0.05); border-radius:8px; border-left:3px solid #c9a84c;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0; font-size:13px; color:#a0a0a0; line-height:1.6;">
                      <strong style="color:#c9a84c;">Note:</strong> Please save this email or take a screenshot of the QR code. You will need it for check-in at the event.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px; background-color:#1a1a1a;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 32px;">
              <p style="margin:0; font-size:13px; color:#666666; line-height:1.5;">
                The Leadership Federation
              </p>
              <p style="margin:8px 0 0; font-size:12px; color:#444444;">
                <a href="https://theleadershipfederation.com" style="color:#c9a84c; text-decoration:none;">Website</a>
                &nbsp;&nbsp;&#183;&nbsp;&nbsp;
                <a href="https://www.linkedin.com/company/theleadershipfederation" style="color:#c9a84c; text-decoration:none;">LinkedIn</a>
                &nbsp;&nbsp;&#183;&nbsp;&nbsp;
                <a href="https://www.instagram.com/theleadershipfederation" style="color:#c9a84c; text-decoration:none;">Instagram</a>
              </p>
              <p style="margin:16px 0 0; font-size:11px; color:#333333;">
                You are receiving this email because you registered for a Leadership Federation event.
              </p>
            </td>
          </tr>

          <!-- Bottom gold accent bar -->
          <tr>
            <td style="height:3px; background: linear-gradient(90deg, #c9a84c, #e8d48b, #c9a84c);"></td>
          </tr>

        </table>
        <!-- /Email container -->

      </td>
    </tr>
  </table>

</body>
</html>`
}

/** Escape HTML entities to prevent XSS in email content. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
