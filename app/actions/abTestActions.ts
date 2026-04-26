"use server"

/**
 * A/B test admin actions: create / start / stop / declare-winner /
 * list with stats.
 */

import { createAdminClient } from "@/utils/supabase/admin"
import { requirePermission } from "@/lib/server-permissions"

export type ABTestRow = {
  id: string
  event_id: string
  page_kind: string
  block_id: string
  name: string
  variants: Record<string, Record<string, unknown>>
  traffic_split: number
  status: "draft" | "running" | "completed"
  conversion_event: string | null
  started_at: string | null
  ended_at: string | null
  winner_variant: string | null
  created_at: string
}

export async function createABTest(input: {
  eventId: string
  pageKind: string
  blockId: string
  name: string
  variantBProps: Record<string, unknown>
  trafficSplit?: number
  conversionEvent?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("event_ab_tests")
      .insert({
        event_id: input.eventId,
        page_kind: input.pageKind,
        block_id: input.blockId,
        name: input.name.trim().slice(0, 120),
        variants: { A: {}, B: input.variantBProps },
        traffic_split: input.trafficSplit ?? 50,
        conversion_event: input.conversionEvent ?? null,
        status: "draft",
      })
      .select("id")
      .maybeSingle()
    if (error) return { success: false, error: error.message }
    return { success: true, id: (data?.id as string) ?? undefined }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function startABTest(testId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { error } = await admin
      .from("event_ab_tests")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", testId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function stopABTest(testId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { error } = await admin
      .from("event_ab_tests")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", testId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function declareWinner(
  testId: string,
  variant: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { error } = await admin
      .from("event_ab_tests")
      .update({ winner_variant: variant, status: "completed", ended_at: new Date().toISOString() })
      .eq("id", testId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export type ABTestStats = ABTestRow & {
  exposures: Record<string, number>     // variant → exposure count
  conversions: Record<string, number>   // variant → conversion count
  rates: Record<string, number>         // variant → conversion rate (0..1)
  zScore: number | null                 // z-statistic for A vs B
  pValue: number | null                 // two-sided p-value
}

export async function listABTests(eventId: string): Promise<{ success: boolean; tests: ABTestStats[]; error?: string }> {
  try {
    await requirePermission("events", "edit")
    const admin = createAdminClient()
    const { data: tests, error } = await admin
      .from("event_ab_tests")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
    if (error) return { success: false, tests: [], error: error.message }

    const out: ABTestStats[] = []
    for (const t of (tests ?? []) as ABTestRow[]) {
      const { data: exp } = await admin
        .from("event_ab_exposures")
        .select("variant, converted")
        .eq("test_id", t.id)
      const exposures: Record<string, number> = {}
      const conversions: Record<string, number> = {}
      for (const r of (exp ?? []) as Array<{ variant: string; converted: boolean }>) {
        exposures[r.variant] = (exposures[r.variant] ?? 0) + 1
        if (r.converted) conversions[r.variant] = (conversions[r.variant] ?? 0) + 1
      }
      const rates: Record<string, number> = {}
      for (const v of Object.keys(exposures)) {
        rates[v] = exposures[v] > 0 ? (conversions[v] ?? 0) / exposures[v] : 0
      }
      const { z, p } = twoProportionZTest(
        conversions.A ?? 0, exposures.A ?? 0,
        conversions.B ?? 0, exposures.B ?? 0,
      )
      out.push({ ...t, exposures, conversions, rates, zScore: z, pValue: p })
    }
    return { success: true, tests: out }
  } catch (err) {
    return { success: false, tests: [], error: (err as Error).message }
  }
}

function twoProportionZTest(
  cA: number, nA: number, cB: number, nB: number,
): { z: number | null; p: number | null } {
  if (nA < 1 || nB < 1) return { z: null, p: null }
  const pA = cA / nA
  const pB = cB / nB
  const pPool = (cA + cB) / (nA + nB)
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / nA + 1 / nB))
  if (se === 0) return { z: null, p: null }
  const z = (pB - pA) / se
  // Two-sided p from z via the error function approximation.
  const p = 2 * (1 - normCdf(Math.abs(z)))
  return { z, p }
}

function normCdf(x: number): number {
  // Abramowitz–Stegun rational approximation.
  const t = 1 / (1 + 0.2316419 * x)
  const d = 0.3989422804 * Math.exp(-x * x / 2)
  const cdf = 1 - d * t * (
    0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))
  )
  return cdf
}
