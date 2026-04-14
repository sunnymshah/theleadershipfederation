import Link from "next/link"
import Image from "next/image"
import { Globe, ExternalLink, AtSign, Play } from "lucide-react"
import { FooterNewsletterForm } from "./FooterNewsletterForm"

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
    { label: "Register", href: "/register" },
    { label: "Contact", href: "/contact" },
  ],
  "Flagship Events": [
    { label: "GCC Leadership Conclave", href: "/events" },
    { label: "Asia Leadership Awards", href: "/events" },
    { label: "Bharat Leadership Summit", href: "/events" },
    { label: "Innovation Summit", href: "/events" },
  ],
  "Legal": [
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Memberships", href: "/memberships" },
  ],
}

const socials = [
  { icon: Globe, href: "https://linkedin.com/company/theleadershipfederation", label: "LinkedIn" },
  { icon: AtSign, href: "https://twitter.com/leadershipfed", label: "Twitter" },
  { icon: ExternalLink, href: "https://instagram.com/theleadershipfederation", label: "Instagram" },
  { icon: Play, href: "https://youtube.com/@theleadershipfederation", label: "YouTube" },
]

export function Footer() {
  return (
    <footer className="bg-[#1a1a2e] relative overflow-hidden">
      {/* Gold accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#e7ab1c]/40 to-transparent" />

      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "600px",
          height: "300px",
          background: "radial-gradient(ellipse at center, rgba(231,171,28,0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pt-16 pb-10">
        {/* Newsletter section */}
        <div className="mb-14 pb-14 border-b border-white/[0.06]">
          <div className="max-w-xl">
            <h3
              className="text-[20px] font-bold text-white/90 mb-2 tracking-[-0.01em]"
              style={sfText}
            >
              Stay in the loop
            </h3>
            <p className="text-[13px] text-white/85 mb-5 leading-relaxed" style={sfText}>
              Exclusive updates on upcoming conclaves, speaker announcements, and leadership insights. No spam.
            </p>
            <FooterNewsletterForm />
          </div>
        </div>

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
            <p className="text-white/85 text-[13px] leading-[1.7] max-w-[280px] mb-6" style={sfText}>
              The global platform connecting CXOs, policymakers, and ecosystem builders
              across 30+ countries.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-white/85 hover:text-[#e7ab1c] hover:border-[#e7ab1c]/40 hover:bg-[#e7ab1c]/[0.10] transition-all duration-300"
                  aria-label={label}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="md:col-span-2">
              <h4
                className="text-[11px] font-bold text-[#e7ab1c] uppercase tracking-[0.15em] mb-4"
                style={sfText}
              >
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[13px] text-white/85 hover:text-[#e7ab1c] transition-colors duration-200"
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
          <p className="text-[12px] text-white/65" style={sfText}>
            &copy; {new Date().getFullYear()} The Leadership Federation. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[12px] text-white/85" style={sfText}>
            <a href="mailto:register@theleadershipfederation.com" className="hover:text-[#e7ab1c] transition-colors">
              register@theleadershipfederation.com
            </a>
            <span className="text-white/30">&middot;</span>
            <a href="tel:+917227993338" className="hover:text-[#e7ab1c] transition-colors">
              +91 72279 93338
            </a>
          </div>
        </div>
      </div>

      {/* Bottom padding for countdown bar */}
      <div className="h-14" />
    </footer>
  )
}
