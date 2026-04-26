/**
 * Home > {page label} breadcrumb shown above the content on every
 * standard sub-page. Hidden on the home page.
 */

import Link from "next/link"
import { ChevronRight } from "lucide-react"

export function Breadcrumbs({
  eventSlug,
  eventTitle,
  pageLabel,
}: {
  eventSlug: string
  eventTitle: string
  pageLabel: string
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-[#1a1a2e]/[0.06] bg-[#1a1a2e]/[0.015]"
    >
      <ol className="max-w-7xl mx-auto px-4 sm:px-6 h-9 flex items-center gap-1 text-[12px] text-[#1a1a2e]/65">
        <li>
          <Link href={`/events/${eventSlug}`} className="hover:text-[#1a1a2e] transition-colors">
            {eventTitle}
          </Link>
        </li>
        <li className="flex items-center"><ChevronRight size={12} className="opacity-50" /></li>
        <li className="font-semibold text-[#1a1a2e]">{pageLabel}</li>
      </ol>
    </nav>
  )
}
