/**
 * Canonical slug normaliser.
 *
 * Anywhere we write a slug (event slug, standard-page slug, sub-page
 * slug) MUST run through this. Anywhere we read a slug from a public
 * URL SHOULD run through this so trailing-whitespace / case-mismatched
 * URLs 301-redirect to their canonical form.
 *
 * Rules:
 *   • lowercase
 *   • trim
 *   • collapse whitespace (and any non-alnum) to "-"
 *   • drop characters outside [a-z0-9-]
 *   • collapse consecutive hyphens
 *   • trim leading/trailing hyphens
 *   • cap at 96 chars
 *
 * Returns "" when the input has no usable characters — caller should
 * reject that as invalid.
 */
export function normalizeSlug(input: string | null | undefined): string {
  return (input ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)
}

/** True when the input passes through normalizeSlug unchanged. */
export function isCanonicalSlug(input: string | null | undefined): boolean {
  if (typeof input !== "string" || input.length === 0) return false
  return input === normalizeSlug(input)
}
