import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#F4F8FF] text-[#1a1a2e] min-h-screen">
      <Navbar />
      {children}
      <Footer />
    </div>
  )
}
