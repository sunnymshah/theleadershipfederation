/**
 * Renders the per-event privacy notice from builder_settings.privacy.notice
 * as a small footer block above the global page footer. Markdown-light
 * (line breaks preserved; no full markdown parsing yet).
 */

export function PrivacyFooter({ notice }: { notice?: string }) {
  if (!notice || notice.trim().length === 0) return null
  return (
    <div className="border-t border-[#1a1a2e]/[0.06] bg-[#1a1a2e]/[0.02]">
      <div className="max-w-3xl mx-auto px-6 py-6 text-center">
        <p className="text-[12px] text-[#1a1a2e]/65 leading-relaxed whitespace-pre-line">
          {notice}
        </p>
      </div>
    </div>
  )
}
