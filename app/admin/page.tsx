/**
 * Admin Dashboard (Placeholder)
 *
 * Future: Add KPIs, event metrics, recent activity, etc.
 */
export default function AdminDashboard() {
  return (
    <div className="p-8">
      <div>
        <h2 className="text-2xl font-bold text-white/90 mb-1">Dashboard</h2>
        <p className="text-sm text-white/40">
          Overview of your events and statistics
        </p>
      </div>

      <div className="mt-8 grid grid-cols-4 gap-6">
        {[
          { label: "Total Events", value: "12", color: "text-blue-400" },
          { label: "Published", value: "8", color: "text-emerald-400" },
          { label: "Attendees", value: "1,240", color: "text-purple-400" },
          { label: "Revenue", value: "₹45.2L", color: "text-[#c9a84c]" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-6 rounded-lg border border-white/[0.06] bg-white/[0.02]"
          >
            <p className="text-xs text-white/40 mb-2">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 p-8 rounded-lg border border-white/[0.06] bg-white/[0.02] text-center">
        <p className="text-white/50 mb-2">More features coming soon</p>
        <p className="text-xs text-white/30">
          Event activity logs, speaker management, and attendee analytics
        </p>
      </div>
    </div>
  )
}
