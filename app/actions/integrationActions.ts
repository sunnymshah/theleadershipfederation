"use server"

import { createHmac, createHash, randomBytes } from "crypto"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

async function getAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  return { supabase, user }
}

function invalidateIntegrationCaches() {
  revalidatePath("/admin/settings", "page")
  revalidatePath("/admin/payments", "page")
}

/* ── Webhooks ─────────────────────────────────────────────────────── */

export async function createWebhook(formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const name       = formData.get("name") as string
    const url        = formData.get("url") as string
    const secret     = formData.get("secret") as string
    const eventsRaw  = formData.get("events") as string
    const isActive   = formData.get("is_active") !== "false"
    const headersRaw = formData.get("headers") as string
    const retryCount = parseInt(formData.get("retry_count") as string) || 3

    if (!name || !url) {
      return { success: false, error: "Name and URL are required." }
    }

    const events = eventsRaw
      ? eventsRaw.split(",").map(e => e.trim()).filter(Boolean)
      : []

    let headers: Record<string, string> | null = null
    if (headersRaw) {
      try {
        headers = JSON.parse(headersRaw)
      } catch {
        return { success: false, error: "Headers must be valid JSON." }
      }
    }

    const { data, error } = await supabase
      .from("webhooks")
      .insert({
        name,
        url,
        secret: secret || null,
        events,
        is_active: isActive,
        headers,
        retry_count: retryCount,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateIntegrationCaches()
    return { success: true, webhook: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function updateWebhook(webhookId: string, formData: FormData) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const name       = formData.get("name") as string
    const url        = formData.get("url") as string
    const secret     = formData.get("secret") as string
    const eventsRaw  = formData.get("events") as string
    const isActive   = formData.get("is_active") !== "false"
    const headersRaw = formData.get("headers") as string
    const retryCount = parseInt(formData.get("retry_count") as string) || 3

    if (!name || !url) {
      return { success: false, error: "Name and URL are required." }
    }

    const events = eventsRaw
      ? eventsRaw.split(",").map(e => e.trim()).filter(Boolean)
      : []

    let headers: Record<string, string> | null = null
    if (headersRaw) {
      try {
        headers = JSON.parse(headersRaw)
      } catch {
        return { success: false, error: "Headers must be valid JSON." }
      }
    }

    const { data, error } = await supabase
      .from("webhooks")
      .update({
        name,
        url,
        secret: secret || null,
        events,
        is_active: isActive,
        headers,
        retry_count: retryCount,
      })
      .eq("id", webhookId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateIntegrationCaches()
    return { success: true, webhook: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function deleteWebhook(webhookId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // Delete logs first to avoid orphaned records
    await supabase.from("webhook_logs").delete().eq("webhook_id", webhookId)

    const { error } = await supabase
      .from("webhooks")
      .delete()
      .eq("id", webhookId)

    if (error) return { success: false, error: error.message }
    invalidateIntegrationCaches()
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function testWebhook(webhookId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data: webhook, error: fetchError } = await supabase
      .from("webhooks")
      .select("*")
      .eq("id", webhookId)
      .single()

    if (fetchError || !webhook) {
      return { success: false, error: "Webhook not found." }
    }

    const testPayload = {
      event: "webhook.test",
      timestamp: new Date().toISOString(),
      data: { message: "This is a test webhook payload." },
    }

    const body = JSON.stringify(testPayload)

    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(webhook.headers as Record<string, string> || {}),
    }

    if (webhook.secret) {
      const signature = createHmac("sha256", webhook.secret)
        .update(body)
        .digest("hex")
      reqHeaders["X-Webhook-Signature"] = signature
    }

    let responseStatus: number | null = null
    let responseBody: string | null = null
    let errorMessage: string | null = null

    try {
      const res = await fetch(webhook.url, {
        method: "POST",
        headers: reqHeaders,
        body,
      })
      responseStatus = res.status
      responseBody = await res.text()
    } catch (fetchErr) {
      errorMessage = (fetchErr as Error).message
    }

    await supabase.from("webhook_logs").insert({
      webhook_id: webhookId,
      event_type: "webhook.test",
      payload: testPayload,
      response_status: responseStatus,
      response_body: responseBody,
      error_message: errorMessage,
      attempt: 1,
    })

    invalidateIntegrationCaches()

    if (errorMessage) {
      return { success: false, error: `Test failed: ${errorMessage}` }
    }
    return { success: true, status: responseStatus, body: responseBody }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function getWebhooks() {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("webhooks")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) return { success: false, error: error.message, webhooks: [] }
    return { success: true, webhooks: data }
  } catch (err) {
    return { success: false, error: (err as Error).message, webhooks: [] }
  }
}

export async function getWebhookLogs(webhookId: string, limit: number = 50) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("webhook_logs")
      .select("*")
      .eq("webhook_id", webhookId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) return { success: false, error: error.message, logs: [] }
    return { success: true, logs: data }
  } catch (err) {
    return { success: false, error: (err as Error).message, logs: [] }
  }
}

export async function fireWebhooks(
  eventType: string,
  payload: Record<string, unknown>,
) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Find all active webhooks that subscribe to this event type
    const { data: webhooks, error } = await supabase
      .from("webhooks")
      .select("*")
      .eq("is_active", true)
      .contains("events", [eventType])

    if (error || !webhooks || webhooks.length === 0) return

    const envelope = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    }

    for (const webhook of webhooks) {
      const body = JSON.stringify(envelope)
      const maxAttempts = webhook.retry_count ?? 3

      const reqHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(webhook.headers as Record<string, string> || {}),
      }

      if (webhook.secret) {
        const signature = createHmac("sha256", webhook.secret)
          .update(body)
          .digest("hex")
        reqHeaders["X-Webhook-Signature"] = signature
      }

      let lastStatus: number | null = null
      let lastError: string | null = null
      let succeeded = false

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        let responseStatus: number | null = null
        let responseBody: string | null = null
        let errorMessage: string | null = null

        try {
          const res = await fetch(webhook.url, {
            method: "POST",
            headers: reqHeaders,
            body,
          })
          responseStatus = res.status
          responseBody = await res.text()
        } catch (fetchErr) {
          errorMessage = (fetchErr as Error).message
        }

        // Log every attempt
        await supabase.from("webhook_logs").insert({
          webhook_id: webhook.id,
          event_type: eventType,
          payload: envelope,
          response_status: responseStatus,
          response_body: responseBody,
          error_message: errorMessage,
          attempt,
        })

        lastStatus = responseStatus
        lastError = errorMessage

        if (responseStatus && responseStatus >= 200 && responseStatus < 300) {
          succeeded = true
          break
        }

        // Wait before retrying (exponential backoff: 1s, 2s, 4s, ...)
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
        }
      }

      // Update webhook metadata
      await supabase
        .from("webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          last_status: lastStatus,
          failure_count: succeeded
            ? 0
            : (webhook.failure_count ?? 0) + 1,
        })
        .eq("id", webhook.id)
    }
  } catch (err) {
    console.error("[fireWebhooks] Error:", (err as Error).message)
  }
}

/* ── API Keys ─────────────────────────────────────────────────────── */

export async function generateApiKey(
  name: string,
  permissions: string[],
  expiresInDays?: number,
) {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    if (!name) {
      return { success: false, error: "API key name is required." }
    }

    // Generate a random key and compute its hash and prefix
    const rawKey   = randomBytes(32).toString("hex")
    const keyHash  = createHash("sha256").update(rawKey).digest("hex")
    const keyPrefix = rawKey.substring(0, 8)

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null

    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions,
        is_active: true,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    invalidateIntegrationCaches()

    // Return the full key ONLY on creation — it cannot be retrieved later
    return { success: true, apiKey: data, key: rawKey }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function revokeApiKey(keyId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", keyId)

    if (error) return { success: false, error: error.message }
    invalidateIntegrationCaches()
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function getApiKeys() {
  try {
    const { supabase } = await getAuthenticatedClient()

    const { data, error } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, permissions, rate_limit, is_active, last_used_at, usage_count, expires_at, created_by, created_at")
      .order("created_at", { ascending: false })

    if (error) return { success: false, error: error.message, apiKeys: [] }
    return { success: true, apiKeys: data }
  } catch (err) {
    return { success: false, error: (err as Error).message, apiKeys: [] }
  }
}

export async function validateApiKey(key: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const keyHash = createHash("sha256").update(key).digest("hex")

    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key_hash", keyHash)
      .single()

    if (error || !data) {
      return { valid: false, error: "Invalid API key." }
    }

    if (!data.is_active) {
      return { valid: false, error: "API key has been revoked." }
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, error: "API key has expired." }
    }

    // Update usage tracking
    await supabase
      .from("api_keys")
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: (data.usage_count ?? 0) + 1,
      })
      .eq("id", data.id)

    return { valid: true, permissions: data.permissions }
  } catch (err) {
    return { valid: false, error: (err as Error).message }
  }
}

/* ── Refunds (Razorpay) ──────────────────────────────────────────── */

export async function requestRefund(attendeeId: string, reason: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    if (!reason) {
      return { success: false, error: "Refund reason is required." }
    }

    const { data, error } = await supabase
      .from("attendees")
      .update({
        refund_status: "requested",
        refund_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attendeeId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateIntegrationCaches()
    return { success: true, attendee: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function processRefund(attendeeId: string, amount?: number) {
  try {
    const { supabase } = await getAuthenticatedClient()

    const razorpayKeyId     = process.env.RAZORPAY_KEY_ID
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET

    if (!razorpayKeyId || !razorpayKeySecret) {
      return { success: false, error: "Razorpay credentials are not configured." }
    }

    // Fetch the attendee and their payment_id
    const { data: attendee, error: fetchError } = await supabase
      .from("attendees")
      .select("*")
      .eq("id", attendeeId)
      .single()

    if (fetchError || !attendee) {
      return { success: false, error: "Attendee not found." }
    }

    if (!attendee.payment_id) {
      return { success: false, error: "No payment found for this attendee." }
    }

    // Build Razorpay refund request
    const basicAuth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64")

    const refundBody: Record<string, unknown> = {}
    if (amount !== undefined && amount !== null) {
      // Razorpay expects amount in paise (smallest currency unit)
      refundBody.amount = amount
    }

    const res = await fetch(
      `https://api.razorpay.com/v1/payments/${attendee.payment_id}/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify(refundBody),
      },
    )

    const resData = await res.json()

    if (!res.ok) {
      return {
        success: false,
        error: resData?.error?.description || `Razorpay refund failed (${res.status}).`,
      }
    }

    // Update attendee with refund details
    const { data: updated, error: updateError } = await supabase
      .from("attendees")
      .update({
        refund_status: "refunded",
        refund_id: resData.id,
        refund_amount: resData.amount,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", attendeeId)
      .select()
      .single()

    if (updateError) return { success: false, error: updateError.message }
    invalidateIntegrationCaches()
    return { success: true, attendee: updated, refund: resData }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function denyRefund(attendeeId: string, reason: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    if (!reason) {
      return { success: false, error: "Denial reason is required." }
    }

    const { data, error } = await supabase
      .from("attendees")
      .update({
        refund_status: "denied",
        refund_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attendeeId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    invalidateIntegrationCaches()
    return { success: true, attendee: data }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function getRefundRequests(eventId?: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    let query = supabase
      .from("attendees")
      .select("*, events(title), tickets(name)")
      .not("refund_status", "is", null)
      .neq("refund_status", "none")
      .order("updated_at", { ascending: false })

    if (eventId) {
      query = query.eq("event_id", eventId)
    }

    const { data, error } = await query

    if (error) return { success: false, error: error.message, refunds: [] }
    return { success: true, refunds: data }
  } catch (err) {
    return { success: false, error: (err as Error).message, refunds: [] }
  }
}
