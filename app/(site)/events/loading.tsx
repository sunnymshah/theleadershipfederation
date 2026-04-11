export default function EventsLoading() {
  return (
    <main className="min-h-screen bg-[#F4F8FF]">
      {/* Hero skeleton */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="h-6 w-40 rounded-full bg-[#1a1a2e]/[0.06] mx-auto mb-6 animate-pulse" />
          <div className="h-14 w-72 rounded-xl bg-[#1a1a2e]/[0.06] mx-auto mb-4 animate-pulse" />
          <div className="h-5 w-96 max-w-full rounded-lg bg-[#1a1a2e]/[0.04] mx-auto animate-pulse" />
        </div>
      </section>

      {/* Event cards skeleton */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="h-4 w-32 rounded bg-[#1a1a2e]/[0.06] mb-8 animate-pulse" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#1a1a2e]/[0.06] bg-white shadow-sm p-6 flex flex-col md:flex-row gap-6"
            >
              <div className="w-full md:w-80 h-48 rounded-xl bg-[#1a1a2e]/[0.06] animate-pulse shrink-0" />
              <div className="flex-1 space-y-4 py-2">
                <div className="h-8 w-3/4 rounded-lg bg-[#1a1a2e]/[0.06] animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-[#1a1a2e]/[0.04] animate-pulse" />
                <div className="h-4 w-full rounded bg-[#1a1a2e]/[0.04] animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-[#1a1a2e]/[0.04] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
