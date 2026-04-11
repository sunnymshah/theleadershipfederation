const pressLogos = [
  "Gulf News",
  "EIN Presswire",
  "Frost & Sullivan",
  "Business Standard",
  "Economic Times",
  "YourStory",
]

export function PressBar() {
  return (
    <section className="py-10 bg-[#F4F8FF] border-t border-[#1a1a2e]/[0.04]">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="text-center mb-6">
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#1a1a2e]/60 font-semibold">
            As Featured In
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {pressLogos.map((name) => (
            <span
              key={name}
              className="text-[13px] font-semibold text-[#1a1a2e]/70 whitespace-nowrap hover:text-[#1a1a2e] transition-colors duration-300"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
