/**
 * ─── ADMIN ROOT LAYOUT ───────────────────────────────────────────────────
 *
 * Minimal wrapper for ALL /admin/* routes (login + console).
 * No auth gate here — that lives in (console)/layout.tsx.
 * This just provides metadata and the dark base styling.
 */

export const metadata = {
  title: {
    default: "Admin Console",
    template: "%s — TLF Admin",
  },
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
