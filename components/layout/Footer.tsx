import Link from "next/link"
import Image from "next/image"
import { Mail, Phone } from "lucide-react"
import { Linkedin, Twitter, Instagram, Youtube } from "@/components/icons/SocialIcons"
import { FooterNewsletterForm } from "./FooterNewsletterForm"

const footerLinks = {
  "Platform": [
    { label: "About", href: "/about" },
    { label: "Platforms & Services", href: "/platforms" },
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

// Real brand icons from lucide-react — was Globe/AtSign/ExternalLink/Play
// which rendered as generic shapes and looked broken.
// Note: the URLs below are best-guess handles. Confirm + update them
// (and add Facebook if applicable) once you have the canonical accounts.
const socials = [
  { icon: Linkedin,  href: "https://linkedin.com/company/theleadershipfederation", label: "LinkedIn" },
  { icon: Twitter,   href: "https://twitter.com/leadershipfed",                    label: "X / Twitter" },
  { icon: Instagram, href: "https://instagram.com/theleadershipfederation",        label: "Instagram" },
  { icon: Youtube,   href: "https://youtube.com/@theleadershipfederation",         label: "YouTube" },
]

export function Footer() {
  return (
    <footer className="relative bg-[#1d1d1f] overflow-hidden">
      {/* Soft accent ambience for the dark glass to refract. */}
      <div
        aria-hidden
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 42% at 50% 0%, rgba(0,113,227,0.16) 0%, transparent 68%), " +
            "radial-gradient(46% 40% at 92% 100%, rgba(0,113,227,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pt-16 lg:pt-20 pb-10">
        {/* ── Newsletter — liquid-glass card ─────────────────────── */}
        <div className="lf-glass-panel rounded-[28px] p-7 sm:p-9 lg:p-10 mb-14 grid lg:grid-cols-[1.1fr_1fr] gap-7 lg:gap-10 items-center">
          <div>
            <h3 className="text-[clamp(1.4rem,2.6vw,1.9rem)] font-bold text-white tracking-[-0.02em] leading-[1.1]">
              Stay in the loop
            </h3>
            <p className="mt-2.5 text-[14px] text-white/55 leading-relaxed max-w-md">
              Exclusive updates on upcoming conclaves, speaker announcements,
              and leadership insights. No spam, ever.
            </p>
          </div>
          <FooterNewsletterForm />
        </div>

        {/* ── Main grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link href="/" className="inline-flex items-center mb-5">
              <Image
                src="/logo-tlf.png"
                alt="The Leadership Federation"
                width={140}
                height={40}
                className="h-[32px] w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-white/55 text-[13.5px] leading-[1.75] max-w-[290px] mb-7">
              The global platform connecting CXOs, policymakers, and ecosystem
              builders across 30+ countries.
            </p>

            {/* Social icons — glass capsules */}
            <div className="flex items-center gap-2.5">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lf-glass-pill w-10 h-10 rounded-full flex items-center justify-center text-white/75 hover:text-white transition-colors duration-300"
                  aria-label={label}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="md:col-span-2">
              <h4 className="text-[11px] font-bold text-[#4c9df2] uppercase tracking-[0.15em] mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[13px] text-white/55 hover:text-white transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Contact row — glass chips ──────────────────────────── */}
        <div className="mt-12 flex flex-wrap gap-3">
          <a
            href="mailto:register@theleadershipfederation.com"
            className="lf-glass-pill inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium text-white/80 hover:text-white transition-colors"
          >
            <Mail size={14} className="text-[#4c9df2]" />
            register@theleadershipfederation.com
          </a>
          <a
            href="tel:+919909249566"
            className="lf-glass-pill inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium text-white/80 hover:text-white transition-colors"
          >
            <Phone size={14} className="text-[#4c9df2]" />
            +91 99092 49566
          </a>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-white/[0.08]">
          <p className="text-[12px] text-white/45">
            &copy; {new Date().getFullYear()} The Leadership Federation. All
            rights reserved.
          </p>
        </div>
      </div>

      {/* Bottom padding for the countdown bar */}
      <div className="h-14" />
    </footer>
  )
}
