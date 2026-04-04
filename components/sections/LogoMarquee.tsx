"use client"

import { motion } from "framer-motion"

/**
 * Black scrolling logo marquee — displays partner/association logos
 * in an infinite horizontal scroll on a black (#000) strip.
 */

const LOGOS = [
  "HSBC", "Google", "Adobe", "Schneider Electric", "Diageo",
  "Best Buy", "SAP Labs", "Carrier", "Johnson Controls", "Barracuda",
  "KPMG", "Deloitte", "EY", "Citi", "DBS Bank",
  "Samsung", "Uber", "Novartis", "Progress", "BOSCH",
]

export function LogoMarquee() {
  return (
    <section className="bg-[#000] py-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Label */}
        <p className="text-center text-[10px] text-white/25 uppercase tracking-[0.25em] font-medium mb-8">
          Leaders from world-class organizations
        </p>

        {/* Marquee track */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

          <div className="animate-marquee flex items-center gap-16 whitespace-nowrap w-max">
            {/* Duplicate the list for seamless loop */}
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="text-[15px] font-semibold text-white/20 tracking-[0.06em] uppercase select-none shrink-0"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
