import { Navbar } from "@/components/layout/Navbar"

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#FAECD2] text-[#000] min-h-screen">
      <Navbar />
      {children}
    </div>
  )
}
