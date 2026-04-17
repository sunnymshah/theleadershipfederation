/**
 * ── AUDIT LOG VIEWER ─────────────────────────────────────────────────
 *
 * Read-only server component that lists the last 500 security events.
 * Only super_admin can see this (RLS on security_events enforces it
 * plus a layer gate at the top of the render).
 */

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import {
  Shield, User, Clock, Globe, Activity, AlertTriangle,
} from "lucide-react"

export const dynamic = "force-dynamic"

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  })
}

function actionColor(action: string) {
  if (action.includes("signin.fail") || action.includes("locked_out") || action.includes("blocked"))
    return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" }
  if (action.includes("delete"))
    return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" }
  if (action.includes("signin.success"))
    return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" }
  return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" }
}

export default async function AuditLogPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Verify we're signed in — layer gate outside the layout
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  // Gate: super_admin only. Uses admin client to bypass team_members RLS.
  const admin = createAdminClient()
  const { data: member } = await admin
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (member && member.role !== "super_admin") {
    redirect("/admin")
  }

  // Fetch events — admin client so we can see everything regardless of
  // row-level policies (we've already gated above)
  const { data: events } = await admin
    .from("security_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500)

  const rows = (events ?? []) as Array<{
    id: number
    actor_email: string | null
    action: string
    target_type: string | null
    target_id: string | null
    ip: string | null
    user_agent: string | null
    metadata: Record<string, unknown> | null
    created_at: string
  }>

  // Count failed logins in the last hour for the at-a-glance stat strip
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: failedLoginsHour } = await admin
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("success", false)
    .gte("created_at", hourAgo)

  const { count: successLoginsHour } = await admin
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("success", true)
    .gte("created_at", hourAgo)

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield size={22} className="text-[#e7ab1c]" />
          Audit Log
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Every admin mutation, login attempt, and security event in the last 500 records.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total events"
          value={rows.length.toString()}
          icon={Activity}
          color="text-blue-600 bg-blue-50"
        />
        <StatCard
          label="Successful logins (1h)"
          value={String(successLoginsHour ?? 0)}
          icon={User}
          color="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          label="Failed logins (1h)"
          value={String(failedLoginsHour ?? 0)}
          icon={AlertTriangle}
          color={`${(failedLoginsHour ?? 0) > 10 ? "text-red-600 bg-red-50" : "text-gray-600 bg-gray-50"}`}
        />
      </div>

      {/* Events table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/60 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">When</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Action</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actor</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Target</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">
                  No events yet. Actions recorded here will appear as admins log in and make changes.
                </td>
              </tr>
            ) : rows.map((r) => {
              const colors = actionColor(r.action)
              return (
                <tr key={r.id} className="hover:bg-gray-50/40">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={11} className="text-gray-400" />
                      {fmtDate(r.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-md border ${colors.bg} ${colors.border} ${colors.text}`}>
                      {r.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 truncate max-w-[220px]">
                    {r.actor_email ?? <span className="text-gray-400 italic">system</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[220px]">
                    {r.target_type ? (
                      <span><span className="text-gray-400">{r.target_type}:</span> {r.target_id ?? "—"}</span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Globe size={11} className="text-gray-400" />
                      {r.ip ?? "—"}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-gray-400 mt-4">
        Records are append-only — security events cannot be edited or deleted, even by super admins.
        Rate limits and lockout decisions are fed from the same store.
      </p>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={14} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}
