import type { Metadata, Viewport } from "next"
import { Montserrat, Fraunces } from "next/font/google"
import "./globals.css"

/* Montserrat — the body / UI typeface (labels, nav, paragraphs, buttons).
 * Loaded via next/font (self-hosted, zero layout shift). */
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
})

/* Fraunces — a high-character, high-contrast variable display serif used
 * ONLY for the large marketing headlines (h1/h2). The scale contrast
 * between this expressive serif and the tight Montserrat labels is what
 * makes the site read as intentional editorial design rather than a
 * generic sans-everywhere template. Optical sizing makes big display
 * sizes look refined; loaded with a soft, slightly-wonky character axis. */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
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
    <html lang="en" className={`${montserrat.variable} ${fraunces.variable} h-full antialiased`}>
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
