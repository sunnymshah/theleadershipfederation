import { AttendeePortal } from "@/components/site/AttendeePortal"

export const metadata = {
  title: "My Tickets | The Leadership Federation",
  description:
    "Access your event registrations, download e-tickets, certificates, and invoices from The Leadership Federation.",
}

const sfFont = {
  fontFamily:
    "-apple-system, 'SF Pro Display', BlinkMacSystemFont, system-ui, sans-serif",
}

export default function MyTicketsPage() {
  return (
    <main className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.07]"
        style={{
          background:
            "radial-gradient(ellipse at center, #c9a84c 0%, transparent 70%)",
        }}
      />

      {/* Hero header */}
      <section className="pt-36 pb-16 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold text-[#c9a84c] uppercase tracking-[0.25em] mb-6">
            Self-Service Portal
          </span>
          <h1
            className="text-white leading-[1.08] font-bold mb-6"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)", ...sfFont }}
          >
            My Tickets
          </h1>
          <p className="text-lg text-white/40 leading-relaxed max-w-2xl mx-auto">
            Look up your registrations to download e-tickets, participation
            certificates, and tax invoices.
          </p>
        </div>
      </section>

      {/* Portal content */}
      <section className="pb-32 px-6 relative z-10">
        <AttendeePortal />
      </section>
    </main>
  )
}
