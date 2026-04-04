"use client"

const logos = [
  "HSBC", "GOOGLE", "ADOBE", "SCHNEIDER ELECTRIC", "DIAGEO", "BEST BUY",
  "SAP LABS", "TATA", "HCL TECH", "RELIANCE", "KPMG", "DELOITTE",
  "EY", "CITI", "DBS BANK", "SAMSUNG", "UBER", "NOVARTIS", "BOSCH",
  "AXIS BANK",
]

export function LogoMarquee() {
  return (
    <section className="py-10 bg-[#F4F8FF] overflow-hidden">
      <p className="text-center text-[11px] tracking-[0.2em] uppercase text-[#1a1a2e]/30 font-semibold mb-8">
        Leaders from world-class organizations
      </p>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-[#F4F8FF] to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-[#F4F8FF] to-transparent" />

        <div className="flex animate-marquee whitespace-nowrap">
          {[...logos, ...logos].map((logo, i) => (
            <span
              key={`${logo}-${i}`}
              className="mx-8 text-[13px] font-bold tracking-[0.15em] uppercase text-[#1a1a2e]/15 select-none"
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
