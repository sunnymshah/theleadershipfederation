/**
 * ─── /api/admin/linkedin ─────────────────────────────────────────────
 *
 * Server-side Gemini proxy for the LinkedIn Architect Pro tool at
 * /admin/linkedin-architect. Two POST actions:
 *
 *   - action="analyze"  → returns { virality, authority, resonance }
 *                         (0–100 ints, JSON-mode response)
 *   - action="refine"   → returns { text } rewritten per `instruction`
 *
 * Auth: requires an admin session AND the "content" module's view
 *       permission, matching the page-level gate.
 *
 * Rate-limited per-IP via the in-memory limiter so a stuck client
 * loop can't burn the project's Gemini quota.
 */
import { NextResponse } from "next/server"
import { cookies, headers } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { canCurrentUser } from "@/lib/server-permissions"
import { geminiText, geminiJson } from "@/lib/gemini"
import { rateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

type AnalyzeResult = { virality: number; authority: number; resonance: number }

const SYSTEM_REFINE =
  "You are a world-class LinkedIn ghostwriter. Use short sentences, " +
  "deliberate white space, and clear structure. Plain text only — no " +
  "markdown stars, no headings, no emoji bullets unless the user " +
  "specifically asked. Preserve the author's intent."

const SYSTEM_ANALYZE =
  "You score draft LinkedIn posts on three dimensions, each 0–100. " +
  "Return only the JSON object — no commentary. Definitions:\n" +
  "  virality   — how likely this is to be shared / commented on widely\n" +
  "  authority  — how senior / credible the author sounds\n" +
  "  resonance  — how emotionally / intellectually it lands with peers"

function clamp01_100(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v)))
}

export async function POST(req: Request) {
  /* ── Auth ────────────────────────────────────────────────────────── */
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const allowed = await canCurrentUser("content", "view")
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  /* ── Rate limit (30 req / 5 min / IP, per serverless instance) ─── */
  const hdrs = await headers()
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown"
  const rl = rateLimit({ key: `linkedin:${ip}`, limit: 30, windowMs: 5 * 60_000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests — slow down for a minute." },
      { status: 429 },
    )
  }

  /* ── Body ────────────────────────────────────────────────────────── */
  let body: { action?: string; text?: string; instruction?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const text = typeof body.text === "string" ? body.text.trim() : ""
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 })
  }
  if (text.length > 10_000) {
    return NextResponse.json({ error: "text too long (max 10000 chars)" }, { status: 400 })
  }

  /* ── Dispatch ────────────────────────────────────────────────────── */
  try {
    if (body.action === "analyze") {
      const result = await geminiJson<AnalyzeResult>({
        system: SYSTEM_ANALYZE,
        prompt:
          `Score this LinkedIn post draft. Return JSON shaped exactly ` +
          `{ "virality": <int 0-100>, "authority": <int 0-100>, "resonance": <int 0-100> }.\n\n` +
          `Draft:\n"""\n${text}\n"""`,
        temperature: 0.2,
        maxOutputTokens: 256,
      })
      return NextResponse.json({
        virality:  clamp01_100(result.virality),
        authority: clamp01_100(result.authority),
        resonance: clamp01_100(result.resonance),
      })
    }

    if (body.action === "refine") {
      const instruction =
        typeof body.instruction === "string" ? body.instruction.trim() : ""
      if (!instruction) {
        return NextResponse.json({ error: "instruction is required" }, { status: 400 })
      }
      if (instruction.length > 500) {
        return NextResponse.json({ error: "instruction too long" }, { status: 400 })
      }
      const out = await geminiText({
        system: SYSTEM_REFINE,
        prompt:
          `${instruction} this LinkedIn post. Maintain the core meaning ` +
          `but optimize for high-impact professional engagement.\n\n` +
          `Original:\n"""\n${text}\n"""\n\n` +
          `Return only the rewritten post — no preamble, no explanation.`,
        temperature: 0.7,
        maxOutputTokens: 1024,
      })
      return NextResponse.json({ text: out.trim() })
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gemini call failed"
    // GEMINI_API_KEY missing is the most common failure — surface a
    // 503 so the UI can show a friendly setup prompt.
    if (msg.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "AI features unavailable: GEMINI_API_KEY not set in Vercel env." },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
