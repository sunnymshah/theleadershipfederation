export default function EventDetailLoading() {
  return (
    <main className="min-h-screen bg-[#F4F8FF]">
      {/* Hero skeleton */}
      <section className="relative pt-0 pb-12">
        <div className="w-full h-[55vh] bg-[#1a1a2e]/[0.04] animate-pulse" />
        <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-10">
          <div className="h-10 w-3/4 rounded-xl bg-[#1a1a2e]/[0.06] animate-pulse mb-4" />
          <div className="h-5 w-1/2 rounded-lg bg-[#1a1a2e]/[0.04] animate-pulse mb-3" />
          <div className="h-4 w-1/3 rounded bg-[#1a1a2e]/[0.04] animate-pulse" />
        </div>
      </section>

      {/* Content skeleton */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-6 w-48 rounded bg-[#1a1a2e]/[0.06] animate-pulse" />
            <div className="h-4 w-full rounded bg-[#1a1a2e]/[0.04] animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-[#1a1a2e]/[0.04] animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-[#1a1a2e]/[0.04] animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-6 h-64 animate-pulse" />
          </div>
        </div>
      </section>
    </main>
  )
}
