"use client"

import Image from "next/image"

const partners = [
  { name: "Axis Bank",              src: "/partners/axis-bank.png" },
  { name: "Tata",                   src: "/partners/tata.jpg" },
  { name: "Reliance Jio",           src: "/partners/reliance-jio.png" },
  { name: "HCLTech",                src: "/partners/hcltech.png" },
  { name: "Atos",                   src: "/partners/atos.png" },
  { name: "Apollo",                 src: "/partners/apollo.png" },
  { name: "Barclays",               src: "/partners/barclays.png" },
  { name: "EY",                     src: "/partners/ey.png" },
  { name: "ICICI Bank",             src: "/partners/icici-bank.png" },
  { name: "Prabhudas Lilladher",    src: "/partners/prabhudas-lilladher.png" },
  { name: "Cadila Pharmaceuticals", src: "/partners/cadila.png" },
  { name: "SIBAE",                  src: "/partners/sibae.png" },
  { name: "H&M",                    src: "/partners/hm.png" },
  { name: "SBI",                    src: "/partners/sbi.png" },
  { name: "Gulf News",              src: "/partners/gulf-news.png" },
  { name: "Frost & Sullivan",       src: "/partners/frost-sullivan.png" },
]

export function LogoMarquee() {
  return (
    <section className="py-8 bg-[#F4F8FF] overflow-hidden border-y border-black/[0.04]">
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-[#F4F8FF] to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-[#F4F8FF] to-transparent" />

        <div className="flex animate-marquee items-center whitespace-nowrap">
          {[...partners, ...partners].map((p, i) => (
            <div key={`${p.name}-${i}`} className="mx-8 shrink-0 opacity-40 hover:opacity-70 transition-opacity">
              <Image
                src={p.src}
                alt={p.name}
                width={100}
                height={40}
                className="h-[28px] w-auto object-contain grayscale"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
