export default function AdminLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#f4f5f7]">
      <div className="w-full max-w-3xl mx-auto px-6 space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded-lg bg-white" />
          <div className="h-9 w-32 rounded-lg bg-white" />
        </div>

        {/* Card skeletons */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-white p-6 shadow-sm space-y-4"
          >
            <div className="h-5 w-2/5 rounded bg-[#e5e7eb]" />
            <div className="h-4 w-4/5 rounded bg-[#e5e7eb]" />
            <div className="h-4 w-3/5 rounded bg-[#e5e7eb]" />
          </div>
        ))}
      </div>
    </div>
  )
}
