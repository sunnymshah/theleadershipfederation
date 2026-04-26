/**
 * Injects admin-controlled <head> and <body> code from
 * builder_settings.code.{headCode,bodyCode}. The strings are stored
 * via a permission-gated form (events:edit), then rendered raw.
 *
 * SECURITY: this is admin-controlled trusted input. RLS prevents
 * anonymous edits to events.builder_settings. Standard XSS rules
 * still apply within the head/body — use scripts for analytics, not
 * arbitrary user-supplied content.
 */

export function CustomHeadCode({ code }: { code?: string }) {
  if (!code || code.trim().length === 0) return null
  return <span data-lf-head-code dangerouslySetInnerHTML={{ __html: code }} />
}

export function CustomBodyCode({ code }: { code?: string }) {
  if (!code || code.trim().length === 0) return null
  return <div data-lf-body-code dangerouslySetInnerHTML={{ __html: code }} />
}
