import { Navbar } from "@/components/layout/Navbar"

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#F4F8FF] text-[#1a1a2e] min-h-screen">
      <Navbar />
      {children}
    </div>
  )
}
