const testimonials = [
  { quote: "The most impactful 48 hours of my professional year.", author: "Vikram Rao", role: "CTO", company: "Reliance Jio" },
  { quote: "Connections here turned into three major partnerships within a month.", author: "Priya Nair", role: "VP Strategy", company: "HCLTech" },
  { quote: "Not a conference. A boardroom with 700 of the world's sharpest minds.", author: "Ahmad Al-Rashid", role: "CEO", company: "Gulf Ventures" },
  { quote: "Every edition raises the bar. The curation is unmatched.", author: "Sunita Kapoor", role: "CHRO", company: "Axis Bank" },
  { quote: "This is where real decisions happen, not just discussions.", author: "David Chen", role: "Managing Director", company: "Barclays Asia" },
  { quote: "From Bengaluru to Dubai — TLF's network is genuinely global.", author: "Mei Lin Tan", role: "COO", company: "TechBridge SG" },
  { quote: "The caliber of leaders in one room is extraordinary.", author: "Rajesh Menon", role: "Founder", company: "InnovateCo" },
  { quote: "I leave every conclave with strategies I implement the next week.", author: "Fatima Hassan", role: "Head of Digital", company: "Emirates Group" },
]

export function TestimonialTicker() {
  const doubled = [...testimonials, ...testimonials]

  return (
    <section className="py-5 bg-[#050505] overflow-hidden border-y border-white/[0.04]">
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 lg:w-40 z-10 bg-gradient-to-r from-[#050505] to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-20 lg:w-40 z-10 bg-gradient-to-l from-[#050505] to-transparent" />

        <div className="flex animate-testimonial-scroll items-center whitespace-nowrap">
          {doubled.map((t, i) => (
            <div key={`${t.author}-${i}`} className="mx-8 shrink-0 flex items-center gap-3">
              <span className="text-[#e7ab1c]/30 text-lg font-serif">&ldquo;</span>
              <span className="text-[13px] text-white/50 font-medium italic">{t.quote}</span>
              <span className="text-[11px] text-white/20 font-semibold whitespace-nowrap">
                &mdash; {t.author}, {t.role}, {t.company}
              </span>
              <span className="text-[#e7ab1c]/20 mx-4">|</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
