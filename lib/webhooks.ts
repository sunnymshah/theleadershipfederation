/**
 * Outbound webhook firing for the microsite.
 * Reads endpoints from `events.builder_settings.webhooks.endpoints`,
 * POSTs JSON, signs each request with HMAC-SHA256 in `X-LF-Signature`,
 * retries 3× exponential backoff on 5xx, and logs every attempt to
 * `event_webhook_deliveries`.
 *
 * Triggered from:
 *   - app/api/builder-form/route.ts on form submission
 *   - publishBuilderAtomic on publish
 *   - razorpay webhook handler on registration.created (TODO)
 */

import crypto from "node:crypto"
import { createAdminClient } from "@/utils/supabase/admin"

export type WebhookEventName =
  | "page.published"
  | "form.submitted"
  | "registration.created"
  | "test"

type EndpointShape = {
  url: string
  event: string
  auth?: string
  secret?: string
}

function signPayload(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex")
}

async function deliverOnce(
  endpoint: EndpointShape,
  eventName: WebhookEventName,
  payload: Record<string, unknown>,
): Promise<{ status: number; body: string }> {
  const body = JSON.stringify({
    event: eventName,
    timestamp: new Date().toISOString(),
    payload,
  })
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-LF-Event": eventName,
  }
  if (endpoint.auth) headers["Authorization"] = endpoint.auth
  if (endpoint.secret) headers["X-LF-Signature"] = signPayload(body, endpoint.secret)

  let res: Response
  try {
    res = await fetch(endpoint.url, {
      method: "POST",
      headers,
      body,
      // 10s ceiling so a flaky endpoint can't stall the publish flow.
      signal: AbortSignal.timeout(10_000),
    })
  } catch (err) {
    return { status: 0, body: `network error: ${(err as Error).message}` }
  }
  let respBody = ""
  try { respBody = (await res.text()).slice(0, 2000) } catch {}
  return { status: res.status, body: respBody }
}

/**
 * Fire all webhooks subscribed to an event name. Best-effort: failures
 * don't throw — they just log to event_webhook_deliveries with the bad
 * status code. 5xx are retried up to 3× with exponential backoff.
 */
export async function fireWebhooks(
  eventId: string,
  eventName: WebhookEventName,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("events")
      .select("builder_settings")
      .eq("id", eventId)
      .maybeSingle()
    const settings = (data?.builder_settings ?? {}) as { webhooks?: { endpoints?: EndpointShape[] } }
    const endpoints = settings.webhooks?.endpoints ?? []

    // The settings UI stores `event` per endpoint. We treat publish→
    // page.published, registration→registration.created, form-submission→
    // form.submitted, test→test (manual fire from admin).
    const matchers: Record<WebhookEventName, string[]> = {
      "page.published":        ["publish", "page.published"],
      "form.submitted":        ["form-submission", "form.submitted"],
      "registration.created":  ["registration", "registration.created"],
      "test":                  ["test", "*"],
    }
    const accepted = matchers[eventName] ?? []

    const targets = endpoints.filter(
      (e) => typeof e?.url === "string" && e.url.length > 0 && accepted.includes(e.event ?? ""),
    )
    if (targets.length === 0) return

    await Promise.all(
      targets.map(async (endpoint) => {
        let attempt = 1
        let last = await deliverOnce(endpoint, eventName, payload)
        while (last.status >= 500 && attempt < 3) {
          await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)))
          attempt++
          last = await deliverOnce(endpoint, eventName, payload)
        }
        try {
          await admin.from("event_webhook_deliveries").insert({
            event_id: eventId,
            endpoint_url: endpoint.url,
            webhook_event: eventName,
            payload: { event: eventName, payload },
            status_code: last.status,
            response_body: last.body,
            attempts: attempt,
          })
        } catch (err) {
          console.error("[fireWebhooks] log insert failed", (err as Error).message)
        }
      }),
    )
  } catch (err) {
    console.error("[fireWebhooks] top-level failure", (err as Error).message)
  }
}
