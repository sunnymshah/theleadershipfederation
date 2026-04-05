import { Users, ArrowRight } from "lucide-react"
import Link from "next/link"

export const revalidate = 86400

export const metadata = {
  title: "Advisory Board & Jury | The Leadership Federation",
  description:
    "Meet the distinguished global leaders who guide The Leadership Federation's mission and jury our flagship awards.",
}

/* Advisory board members will be populated from the CMS/admin portal.
   This page shows the structure — real data comes from Supabase. */

export default function AdvisoryBoardPage() {
  return (
    <main className="min-h-screen bg-[#F4F8FF]">
      <section className="pt-36 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1
            className="text-4xl md:text-5xl font-bold tracking-[-0.02em] text-black mb-6"
            style={{ fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }}
          >
            Advisory Board & Jury
          </h1>
          <p className="text-[16px] text-black/40 max-w-2xl mx-auto leading-relaxed">
            The Leadership Federation is guided by an eminent panel of global CXOs, board
            directors, and domain experts who shape our strategic direction and uphold the
            highest standards across our awards, conclaves, and initiatives.
          </p>
        </div>
      </section>

      {/* Placeholder — will be populated from admin */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-white/70 border border-black/[0.04] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#e7ab1c]/10 flex items-center justify-center mx-auto mb-6">
            <Users size={28} className="text-[#e7ab1c]" />
          </div>
          <h2
            className="text-2xl font-bold text-black mb-3"
            style={{ fontFamily: "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif" }}
          >
            Coming Soon
          </h2>
          <p className="text-black/35 text-[15px] max-w-md mx-auto mb-8">
            Our advisory board profiles are being updated. Check back soon to meet the
            leaders guiding The Leadership Federation.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#e7ab1c] text-white text-sm font-semibold hover:bg-[#d49c10] transition-all duration-200"
          >
            Express Interest <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  )
}
