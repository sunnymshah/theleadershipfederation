import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

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
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#050505] text-[#f0f0f0] font-sans">
        {children}
      </body>
    </html>
  )
}
