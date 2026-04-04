"use client"

const partners = [
  { name: "Tata",                   src: "/partners/tata.jpg" },
  { name: "Reliance Jio",           src: "/partners/reliance-jio.png" },
  { name: "HCLTech",                src: "/partners/hcltech.png" },
  { name: "EY",                     src: "/partners/ey.png" },
  { name: "Axis Bank",              src: "/partners/axis-bank.png" },
  { name: "ICICI Bank",             src: "/partners/icici-bank.png" },
  { name: "SBI",                    src: "/partners/sbi.png" },
  { name: "Barclays",               src: "/partners/barclays.png" },
  { name: "Atos",                   src: "/partners/atos.png" },
  { name: "Apollo",                 src: "/partners/apollo.png" },
  { name: "Cadila Pharmaceuticals", src: "/partners/cadila.png" },
  { name: "Prabhudas Lilladher",    src: "/partners/prabhudas-lilladher.png" },
  { name: "SIBAE",                  src: "/partners/sibae.png" },
  { name: "Frost & Sullivan",       src: "/partners/frost-sullivan.png" },
  { name: "H&M",                    src: "/partners/hm.png" },
  { name: "Gulf News",              src: "/partners/gulf-news.png" },
]

const sfText = {
  fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

export function LogoMarquee() {
  const doubled = [...partners, ...partners]

  return (
    <section className="py-10 bg-[#F4F8FF] overflow-hidden border-y border-black/[0.04]">
      <div className="text-center mb-6">
        <span
          className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em]"
          style={sfText}
        >
          Trusted by leading enterprises worldwide
        </span>
      </div>
      <div className="relative">
        {/* Edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-28 z-10 bg-gradient-to-r from-[#F4F8FF] to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-28 z-10 bg-gradient-to-l from-[#F4F8FF] to-transparent" />

        {/* Scrolling logos — using native img for reliability */}
        <div className="flex animate-marquee items-center whitespace-nowrap">
          {doubled.map((p, i) => (
            <div
              key={`${p.name}-${i}`}
              className="mx-10 shrink-0 flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity duration-300"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={p.name}
                loading="lazy"
                className="h-[36px] w-auto max-w-[130px] object-contain"
              />
              <span className="text-[9px] font-semibold text-black/35 uppercase tracking-[0.08em] whitespace-nowrap" style={sfText}>
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
