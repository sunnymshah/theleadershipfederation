/**
 * Thin Gemini REST wrapper.
 * Reads GEMINI_API_KEY from env. Default model: gemini-2.5-flash —
 * fast + cheap; fine for translation, copy edits, and short generation.
 *
 * Fail loudly when the key is missing so admins notice.
 */

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash"
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models"

export type GeminiCall = {
  prompt: string
  system?: string
  temperature?: number
  maxOutputTokens?: number
  jsonOnly?: boolean
}

function getKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error("GEMINI_API_KEY is not set. Add it to .env.local + Vercel env.")
  return key
}

export async function geminiText({
  prompt, system, temperature = 0.4, maxOutputTokens = 2048, jsonOnly = false,
}: GeminiCall): Promise<string> {
  const key = getKey()
  const url = `${ENDPOINT}/${DEFAULT_MODEL}:generateContent?key=${encodeURIComponent(key)}`

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(jsonOnly ? { responseMimeType: "application/json" } : {}),
    },
  }
  if (system) {
    body.systemInstruction = { role: "system", parts: [{ text: system }] }
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // 30s ceiling — plenty for short prompts.
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Gemini ${res.status}: ${txt.slice(0, 500)}`)
  }
  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    promptFeedback?: { blockReason?: string }
  }
  if (json.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked the prompt: ${json.promptFeedback.blockReason}`)
  }
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim()
  if (!text) throw new Error("Gemini returned empty response.")
  return text
}

export async function geminiJson<T>(call: GeminiCall): Promise<T> {
  const text = await geminiText({ ...call, jsonOnly: true })
  // Strip occasional markdown fences if model goes off-script.
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim()
  return JSON.parse(cleaned) as T
}
