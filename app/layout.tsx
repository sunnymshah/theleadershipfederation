import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import { InteractiveBackground } from "@/components/site/InteractiveBackground"
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
      <body className="min-h-full text-[#1a1a2e] font-sans relative">
        {/* Site-wide interactive backdrop. Lives at the root so it sits
            behind everything (public site + admin); admin pages have
            their own opaque dark chrome so it only reads on the
            marketing surface, where body/.lf-clean are transparent. */}
        <InteractiveBackground />
        {children}
      </body>
    </html>
  )
}
