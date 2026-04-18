/**
 * ── (event-page) outer layout ──────────────────────────────────────
 *
 * Deliberately thin: this route group EXISTS only so that /events/[slug]
 * and its children escape the marketing-site navbar/footer/countdown bar
 * (which live in `app/(site)/layout.tsx`). The actual per-event nav is
 * rendered ONE level deeper at `events/[slug]/layout.tsx` where we have
 * native access to `params.slug`.
 */

export default function EventPageGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
