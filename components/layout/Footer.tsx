import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

const sfText = {
  fontFamily: "-apple-system, 'SF Pro Text', BlinkMacSystemFont, system-ui, sans-serif",
}

const footerLinks = {
  "Platform": [
    { label: "About", href: "/about" },
    { label: "Platforms", href: "/platforms" },
    { label: "Events", href: "/events" },
    { label: "Advisory Board", href: "/advisory-board" },
  ],
  "Connect": [
    { label: "Partners", href: "/partners" },
    { label: "Media", href: "/media" },
    { label: "Contact", href: "/contact" },
  ],
  "Flagship Events": [
    { label: "7th GCC Leadership Conclave", href: "/events" },
    { label: "Asia Leadership Awards", href: "/events" },
    { label: "Bharat Leadership Summit", href: "/events" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-black relative overflow-hidden">
      {/* Gold accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#e7ab1c]/40 to-transparent" />


      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2 mb-5">
              <Image
                src="/logo-tlf.png"
                alt="The Leadership Federation"
                width={140}
                height={40}
                className="h-[32px] w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-white/25 text-[13px] leading-[1.7] max-w-[280px] mb-6" style={sfText}>
              The global platform connecting CXOs, policymakers, and ecosystem builders
              across 30+ countries.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-semibold bg-[#e7ab1c] text-white hover:bg-[#d49c10] transition-all duration-200 shadow-[0_2px_12px_rgba(231,171,28,0.25)]"
              style={sfText}
            >
              Get in Touch <ArrowRight size={12} />
            </Link>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="md:col-span-2 md:first:col-start-6">
              <h4
                className="text-[11px] font-bold text-white/20 uppercase tracking-[0.15em] mb-4"
                style={sfText}
              >
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[13px] text-white/35 hover:text-[#e7ab1c] transition-colors duration-200"
                      style={sfText}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-white/15" style={sfText}>
            &copy; {new Date().getFullYear()} The Leadership Federation. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[12px] text-white/15" style={sfText}>
            <a href="mailto:register@theleadershipfederation.com" className="hover:text-[#e7ab1c] transition-colors">
              register@theleadershipfederation.com
            </a>
            <span className="text-white/10">·</span>
            <a href="tel:+917227993338" className="hover:text-[#e7ab1c] transition-colors">
              +91 72279 93338
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
