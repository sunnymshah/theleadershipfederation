const pressLogos = [
  { name: "Gulf News", src: "/partners/gulf-news.png" },
  { name: "EIN Presswire", src: "/press/ein-presswire.png" },
  { name: "Frost & Sullivan", src: "/partners/frost-sullivan.png" },
  { name: "Business Standard", src: "/press/business-standard.png" },
  { name: "Economic Times", src: "/press/economic-times.png" },
  { name: "YourStory", src: "/press/yourstory.png" },
]

export function PressBar() {
  return (
    <section className="py-10 bg-[#F4F8FF] border-t border-black/[0.04]">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="text-center mb-6">
          <span className="text-[10px] tracking-[0.2em] uppercase text-black/20 font-semibold">
            As Featured In
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {pressLogos.map((p) => (
            <div key={p.name} className="flex items-center gap-2 opacity-30 hover:opacity-60 transition-opacity duration-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={p.name}
                loading="lazy"
                className="h-[22px] w-auto object-contain"
                style={{ filter: "brightness(0) opacity(0.8)" }}
              />
              <span className="text-[12px] font-semibold text-black/50 whitespace-nowrap">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
