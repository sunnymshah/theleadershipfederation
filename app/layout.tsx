import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/layout/Navbar"

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
  keywords: [
    "leadership federation",
    "global leadership",
    "GCC leaders",
    "CXO summit",
    "inner circle",
    "leadership conclave",
    "decision makers",
    "enterprise leadership",
  ],
  openGraph: {
    title: "The Leadership Federation",
    description:
      "Direct Access to Global Leaders, CXOs & Decision Makers.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Leadership Federation",
    description: "Direct Access to Global Leaders, CXOs & Decision Makers.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#050505] text-[#f0f0f0] font-sans">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
