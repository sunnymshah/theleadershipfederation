/**
 * Server-side A/B test resolver.
 * Reads active tests from event_ab_tests, picks a variant deterministically
 * by hashing (visitor_id + test_id) so a returning visitor always sees the
 * same variant. Caller is responsible for recording the exposure via
 * /api/ab/expose (the public renderer wires this).
 */

import { createAdminClient } from "@/utils/supabase/admin"

export type ABTest = {
  id: string
  event_id: string
  page_kind: string
  block_id: string
  name: string
  variants: Record<string, Record<string, unknown>>  // {A: props, B: props}
  traffic_split: number
  status: string
  conversion_event: string | null
}

export async function listActiveTestsForEvent(eventId: string): Promise<ABTest[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("event_ab_tests")
      .select("*")
      .eq("event_id", eventId)
      .eq("status", "running")
    return (data ?? []) as ABTest[]
  } catch {
    return []
  }
}

/** djb2-ish hash → 0..2^31-1 → bucket 0..99 */
export function hashToBucket(input: string): number {
  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) + input.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h) % 100
}

/** Returns the chosen variant key ("A" or "B") for a given visitor + test. */
export function pickVariant(visitorId: string, test: ABTest): string {
  const variants = Object.keys(test.variants ?? { A: {}, B: {} })
  if (variants.length === 0) return "A"
  if (variants.length === 1) return variants[0]
  const bucket = hashToBucket(`${visitorId}::${test.id}`)
  // traffic_split is the percentage of visitors who see variant A (default 50).
  const splitA = Math.max(0, Math.min(100, test.traffic_split ?? 50))
  return bucket < splitA ? variants[0] : variants[1]
}

/** Apply A/B variant overrides to a Puck data tree.
 *  When a block's id matches an active test, swap its props for the
 *  chosen variant's props (shallow merge). */
export function applyVariantOverrides(
  content: Array<{ type: string; props: Record<string, unknown> }>,
  visitorId: string,
  tests: ABTest[],
): Array<{ type: string; props: Record<string, unknown>; __ab?: { test_id: string; variant: string } }> {
  if (tests.length === 0) return content
  const byBlockId = new Map<string, ABTest>()
  for (const t of tests) byBlockId.set(t.block_id, t)
  return content.map((b) => {
    const t = byBlockId.get(String((b.props as { id?: string }).id ?? ""))
    if (!t) return b
    const variant = pickVariant(visitorId, t)
    const overrides = (t.variants ?? {})[variant] ?? {}
    return {
      ...b,
      props: { ...b.props, ...overrides },
      __ab: { test_id: t.id, variant },
    }
  })
}
