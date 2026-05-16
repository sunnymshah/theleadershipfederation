import type { Metadata, Viewport } from "next"
import { Montserrat } from "next/font/google"
import "./globals.css"

/* Montserrat is the single typeface for the whole site. Loaded via
 * next/font (self-hosted, zero layout shift, no extra network request)
 * — the proper Next.js way; <link> tags to fonts.googleapis.com are not
 * needed. The variable axis covers weights 100–900 + italics, so every
 * existing font-weight utility keeps working. The `--font-inter` and
 * `--font-serif` CSS variables are kept pointing at Montserrat so any
 * legacy `var(--font-*)` reference resolves to it too. */
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a1a2e',
}

export const metadata: Metadata = {
  title: {
    default: "The Leadership Federation — Global Leadership Platform",
    template: "%s | The Leadership Federation",
  },
  description:
    "Direct Access to Global Leaders, CXOs & Decision Makers. A global platform for high-value leadership conversations, strategic partnerships, and curated access.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
      {/* Pitch-white surface. The old InteractiveBackground canvas (a
          continuous requestAnimationFrame cream-orb loop) was removed —
          the site now sits on a flat pure-white base, which is both the
          requested look and a perf win (no GPU repaint loop, ~4 KB less
          JS). Dark sections (Hero / Footer / dark builder blocks) paint
          their own opaque backgrounds on top, so they're unaffected. */}
      <body className="min-h-full bg-white text-[#1a1a2e] font-sans relative">
        {children}
      </body>
    </html>
  )
}
