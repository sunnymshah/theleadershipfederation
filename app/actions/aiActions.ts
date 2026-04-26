"use server"

/**
 * AI server actions backed by Gemini.
 *
 * - aiAssistField     — Sparkles button next to a text field. "Make
 *                       shorter / punchier / more on-brand / translate".
 * - aiTranslateText   — used by the Sparkles "translate" preset.
 * - aiTranslatePuckData — walks a Puck data tree, translates every
 *                       text-shaped string field, returns the new tree.
 *                       Caller persists.
 * - aiAutoTranslateStandardPage — convenience: read default-locale data
 *                       for a page, translate, write to settings[locale].
 *                       Used by the Languages panel "Auto-translate" UI.
 * - aiGenerateInitialContent — single-textarea event setup wizard. Takes
 *                       a free-text description and seeds the Hero
 *                       subtitle, About copy, FAQs, ticket descriptions
 *                       across all 12 standard pages.
 */

import { requirePermission } from "@/lib/server-permissions"
import { createAdminClient } from "@/utils/supabase/admin"
import { geminiText, geminiJson } from "@/lib/gemini"
import { LOCALE_LABELS, isSupportedLocale } from "@/lib/locales"
import {
  STANDARD_PAGE_KINDS,
  DEFAULT_PAGE_LABELS,
  type StandardPageKind,
} from "@/lib/standard-pages"
import { defaultPuckDataForKind } from "@/lib/standard-page-defaults"
import type { Data as PuckData } from "@measured/puck"

/* ─── 1. Field assist ─────────────────────────────────────────────── */

export type AssistMode =
  | "shorter" | "punchier" | "on-brand" | "improve-seo" | "translate" | "custom"

export async function aiAssistField(input: {
  fieldType?: "title" | "subtitle" | "body" | "cta" | "generic"
  currentValue: string
  mode: AssistMode
  customPrompt?: string
  targetLocale?: string
}): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const v = input.currentValue?.trim() ?? ""
    if (!v) return { success: false, error: "Nothing to rewrite — type something first." }

    const fieldHint = input.fieldType
      ? `This is a ${input.fieldType} field on a microsite for a premium B2B leadership conference.`
      : ""
    let directive = ""
    switch (input.mode) {
      case "shorter":   directive = "Rewrite the text below to be 30–50% shorter. Keep the meaning, drop filler. Match the original tone."; break
      case "punchier":  directive = "Rewrite the text below to be punchier and more direct. Use active voice. Cut adverbs. Same length or shorter."; break
      case "on-brand":  directive = "Rewrite the text below to sound editorial, restrained, and confident — like a curated publication, not a marketing landing page. No exclamation marks, no hype words."; break
      case "improve-seo": directive = "Rewrite the text below to read better in search results. Front-load the most important keyword naturally, keep it under 60 characters where possible. Match the original meaning."; break
      case "translate":
        if (!input.targetLocale || !isSupportedLocale(input.targetLocale)) {
          return { success: false, error: "Pick a supported target locale." }
        }
        directive = `Translate the text below to ${LOCALE_LABELS[input.targetLocale] ?? input.targetLocale}. Keep brand names, proper nouns, dates and times unchanged. Output only the translation, no commentary.`
        break
      case "custom":
        if (!input.customPrompt?.trim()) return { success: false, error: "Custom prompt is empty." }
        directive = input.customPrompt.trim()
        break
    }
    const system = [
      "You are an editor for a premium B2B leadership-events platform called The Leadership Federation.",
      "Output only the rewritten text — no preface, no quotes, no markdown fences.",
      fieldHint,
    ].filter(Boolean).join(" ")
    const prompt = `${directive}\n\nOriginal:\n${v}\n\nRewritten:`
    const out = await geminiText({ prompt, system, temperature: 0.5, maxOutputTokens: 800 })
    return { success: true, result: out.trim().replace(/^["“'`]|["”'`]$/g, "") }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ─── 2. Translate Puck data ──────────────────────────────────────── */

const TRANSLATABLE_KEYS = new Set<string>([
  "title", "subtitle", "body", "headline", "subheadline", "ctaLabel",
  "secondaryCtaLabel", "tagline", "label", "successMessage", "copy",
  "description", "pastMessage", "name", "imageAlt",
])

function walkAndCollectStrings(input: unknown, path: string[] = [], out: Array<{ path: string[]; value: string }> = []): Array<{ path: string[]; value: string }> {
  if (Array.isArray(input)) {
    input.forEach((v, i) => walkAndCollectStrings(v, [...path, String(i)], out))
    return out
  }
  if (input && typeof input === "object") {
    for (const [k, v] of Object.entries(input)) {
      if (typeof v === "string") {
        // Only translate keys we know are user-visible copy. Skip internal
        // props (id, type, anchor, cssClass, urls, etc).
        if (TRANSLATABLE_KEYS.has(k) && v.trim().length > 0 && v.length < 5000) {
          out.push({ path: [...path, k], value: v })
        }
      } else {
        walkAndCollectStrings(v, [...path, k], out)
      }
    }
  }
  return out
}

function setPath(target: unknown, path: string[], value: string): void {
  let cur: Record<string, unknown> | unknown[] = target as Record<string, unknown>
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i]
    cur = (cur as Record<string, unknown>)[k] as Record<string, unknown>
  }
  ;(cur as Record<string, unknown>)[path[path.length - 1]] = value
}

export async function aiTranslatePuckData(input: {
  data: PuckData
  fromLocale: string
  toLocale: string
}): Promise<{ success: boolean; data?: PuckData; error?: string }> {
  try {
    await requirePermission("events", "edit")
    if (!isSupportedLocale(input.toLocale)) return { success: false, error: "Unsupported target locale." }
    const items = walkAndCollectStrings(input.data)
    if (items.length === 0) return { success: true, data: input.data }

    // Batch in chunks of 30 strings at a time so prompts stay short.
    const chunkSize = 30
    const cloned = JSON.parse(JSON.stringify(input.data)) as PuckData
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize)
      const obj: Record<string, string> = {}
      chunk.forEach((it, idx) => { obj[String(idx)] = it.value })
      const system = "You are a translator. Translate every value in the JSON below. Keep brand names, proper nouns, URLs, dates and times unchanged. Preserve emoji and punctuation. Return the SAME JSON keys with translated values. Output only valid JSON."
      const prompt = `Source language: ${LOCALE_LABELS[input.fromLocale] ?? input.fromLocale}\nTarget language: ${LOCALE_LABELS[input.toLocale] ?? input.toLocale}\n\nJSON to translate:\n${JSON.stringify(obj)}\n\nTranslated JSON:`
      const out = await geminiJson<Record<string, string>>({ prompt, system, temperature: 0.2, maxOutputTokens: 3500 })
      chunk.forEach((it, idx) => {
        const v = out[String(idx)]
        if (typeof v === "string" && v.trim()) setPath(cloned, it.path, v)
      })
    }
    return { success: true, data: cloned }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/* ─── 3. Auto-translate a standard page across all locales ─────────── */

export async function aiAutoTranslateStandardPage(input: {
  eventId: string
  pageKind: StandardPageKind
  fromLocale: string
  toLocale: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data: row } = await admin
      .from("event_standard_pages")
      .select("settings")
      .eq("event_id", input.eventId)
      .eq("kind", input.pageKind)
      .maybeSingle()
    const settings = (row?.settings ?? {}) as Record<string, unknown>
    // Source = settings[fromLocale].puckData OR legacy settings.puckData
    const fromBucket = (settings[input.fromLocale] ?? {}) as Record<string, unknown>
    const source = (fromBucket.puckData ?? settings.puckData) as PuckData | undefined
    if (!source || !Array.isArray(source.content) || source.content.length === 0) {
      // Fall back to canonical default so newly seeded events still translate.
      const fallback = defaultPuckDataForKind(input.pageKind)
      const t = await aiTranslatePuckData({ data: fallback, fromLocale: input.fromLocale, toLocale: input.toLocale })
      if (!t.success || !t.data) return { success: false, error: t.error ?? "translation failed" }
      const next = {
        ...settings,
        [input.toLocale]: { ...((settings[input.toLocale] ?? {}) as Record<string, unknown>), puckData: t.data },
      }
      await admin.from("event_standard_pages").update({ settings: next, updated_at: new Date().toISOString() })
        .eq("event_id", input.eventId).eq("kind", input.pageKind)
      return { success: true }
    }
    const t = await aiTranslatePuckData({ data: source, fromLocale: input.fromLocale, toLocale: input.toLocale })
    if (!t.success || !t.data) return { success: false, error: t.error ?? "translation failed" }
    const next = {
      ...settings,
      [input.toLocale]: { ...((settings[input.toLocale] ?? {}) as Record<string, unknown>), puckData: t.data },
    }
    const { error } = await admin
      .from("event_standard_pages")
      .update({ settings: next, updated_at: new Date().toISOString() })
      .eq("event_id", input.eventId)
      .eq("kind", input.pageKind)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

/** Convenience: translate ALL 12 standard pages at once. Best-effort —
 *  one failure doesn't abort the rest, but the failure is reported. */
export async function aiAutoTranslateEvent(input: {
  eventId: string
  fromLocale: string
  toLocale: string
}): Promise<{ success: boolean; results: Array<{ kind: string; success: boolean; error?: string }> }> {
  await requirePermission("events", "edit")
  const results: Array<{ kind: string; success: boolean; error?: string }> = []
  for (const k of STANDARD_PAGE_KINDS) {
    const r = await aiAutoTranslateStandardPage({
      eventId: input.eventId,
      pageKind: k,
      fromLocale: input.fromLocale,
      toLocale: input.toLocale,
    })
    results.push({ kind: k, success: r.success, error: r.error })
  }
  return { success: results.every((r) => r.success), results }
}

/* ─── 4. AI event setup wizard ─────────────────────────────────────── */

type GeneratedContent = {
  hero_headline: string
  hero_subheadline: string
  about_title: string
  about_body: string
  faqs: Array<{ q: string; a: string }>
  ticket_blurbs: { early: string; standard: string; premium: string }
  agenda_intro: string
  speakers_intro: string
  sponsors_intro: string
  venue_directions: string
  networking_intro: string
}

export async function aiGenerateInitialContent(input: {
  eventId: string
  description: string
}): Promise<{ success: boolean; pages?: number; error?: string }> {
  try {
    await requirePermission("events", "edit")
    if (!input.description?.trim()) return { success: false, error: "Describe the event first." }

    const system = [
      "You are an editor for The Leadership Federation, a premium B2B platform for invite-only leadership conclaves.",
      "Tone: editorial, restrained, confident. No hype words, no exclamation marks, no emojis.",
      "Output strictly valid JSON matching the schema given. Strings only — no markdown.",
    ].join(" ")
    const prompt = `From the description below, draft microsite copy for a Leadership Federation event.

Description:
${input.description.trim()}

Return JSON with this exact shape:
{
  "hero_headline":     "string — short, declarative, max 12 words",
  "hero_subheadline":  "string — one sentence, ~20-25 words",
  "about_title":       "string — 3-5 words",
  "about_body":        "string — 3-4 sentences, no bullet points",
  "faqs":              [{"q":"string","a":"string"}, ... 4 items ...],
  "ticket_blurbs":     {"early":"...", "standard":"...", "premium":"..."},
  "agenda_intro":      "string — 1-2 sentences",
  "speakers_intro":    "string — 1-2 sentences",
  "sponsors_intro":    "string — 1-2 sentences",
  "venue_directions":  "string — 2-3 sentences, factual",
  "networking_intro":  "string — 1-2 sentences"
}`
    const out = await geminiJson<GeneratedContent>({ prompt, system, temperature: 0.6, maxOutputTokens: 2048 })

    // Apply to event_standard_pages.settings.puckData per kind by editing
    // the canonical defaults in-place. Caller (the wizard UI) shows a
    // progress indicator while this runs.
    const admin = createAdminClient()
    let pagesUpdated = 0

    async function patchKind(kind: StandardPageKind, patcher: (data: PuckData) => PuckData) {
      const { data: row } = await admin
        .from("event_standard_pages")
        .select("settings")
        .eq("event_id", input.eventId)
        .eq("kind", kind)
        .maybeSingle()
      const settings = (row?.settings ?? {}) as Record<string, unknown>
      const existing = settings.puckData as PuckData | undefined
      const base = existing && Array.isArray(existing.content) && existing.content.length > 0
        ? existing
        : defaultPuckDataForKind(kind)
      const updated = patcher(JSON.parse(JSON.stringify(base)) as PuckData)
      const next = { ...settings, puckData: updated }
      await admin.from("event_standard_pages")
        .update({ settings: next, updated_at: new Date().toISOString() })
        .eq("event_id", input.eventId).eq("kind", kind)
      pagesUpdated++
    }

    function findFirst(content: PuckData["content"], type: string): { props: Record<string, unknown> } | null {
      for (const b of content) {
        if ((b as { type?: string }).type === type) return b as { props: Record<string, unknown> }
      }
      return null
    }

    await patchKind("home", (d) => {
      const hero = findFirst(d.content, "Hero")
      if (hero) { hero.props.title = out.hero_headline; hero.props.subtitle = out.hero_subheadline }
      const rich = findFirst(d.content, "RichText")
      if (rich) { rich.props.title = out.about_title; rich.props.body = out.about_body }
      return d
    })
    await patchKind("agenda", (d) => {
      const hero = findFirst(d.content, "Hero")
      if (hero) hero.props.subtitle = out.agenda_intro
      return d
    })
    await patchKind("speakers", (d) => {
      const hero = findFirst(d.content, "Hero")
      if (hero) hero.props.subtitle = out.speakers_intro
      return d
    })
    await patchKind("sponsors", (d) => {
      const hero = findFirst(d.content, "Hero")
      if (hero) hero.props.subtitle = out.sponsors_intro
      return d
    })
    await patchKind("venue", (d) => {
      const hero = findFirst(d.content, "Hero")
      if (hero) hero.props.subtitle = "How to get there. Where to stay."
      const rich = findFirst(d.content, "RichText")
      if (rich) { rich.props.title = "Getting here"; rich.props.body = out.venue_directions }
      return d
    })
    await patchKind("networking", (d) => {
      const hero = findFirst(d.content, "Hero")
      if (hero) hero.props.subtitle = out.networking_intro
      const rich = findFirst(d.content, "RichText")
      if (rich) rich.props.body = out.networking_intro
      return d
    })
    await patchKind("tickets", (d) => {
      const faqs = findFirst(d.content, "Faqs")
      if (faqs) { faqs.props.title = "Frequently asked"; faqs.props.faqs = out.faqs }
      return d
    })

    return { success: true, pages: pagesUpdated }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// Re-export DEFAULT_PAGE_LABELS for the wizard UI.
export async function getStandardPageLabels(): Promise<Record<string, string>> {
  return DEFAULT_PAGE_LABELS as Record<string, string>
}
