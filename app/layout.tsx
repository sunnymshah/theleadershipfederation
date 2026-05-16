import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
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
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
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
