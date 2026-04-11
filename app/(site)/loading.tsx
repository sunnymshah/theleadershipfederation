export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F4F8FF] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#e7ab1c]/30 border-t-[#e7ab1c] animate-spin" />
        <span className="text-sm text-[#1a1a2e]/45 font-medium tracking-wide">Loading…</span>
      </div>
    </div>
  )
}
