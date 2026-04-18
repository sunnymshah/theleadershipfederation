/**
 * ─── ACCESS DENIED LANDING ──────────────────────────────────────────
 *
 * Reached when a user tries to open a path their profile doesn't
 * permit. The console layout redirects here with
 * `/admin/denied?from=<path>` so we can show what they tried to open
 * and suggest the domains they *can* access.
 *
 * Must be reachable regardless of the user's profile permissions —
 * see the special-case in lib/permissions.ts:canAccessNavItem().
 */

import Link from "next/link"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { accessibleDomains, domainForPath, type AdminDomain } from "@/lib/admin-domains"
import type { ProfilePermissions } from "@/app/actions/profileActions"
import { Lock, ArrowLeft } from "lucide-react"

export const metadata = { title: "Access denied" }

export default async function DeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const { from } = await searchParams
  const attempted = typeof from === "string" ? from : null
  const targetedDomain: AdminDomain | null = attempted ? domainForPath(attempted) : null

  // Resolve the caller's role + permissions so we can suggest accessible
  // domains below. Silent fallbacks — if we can't resolve, show just the
  // generic denial without suggestions.
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  let role = "viewer"
  let perms: ProfilePermissions | null = null
  if (user) {
    try {
      const admin = createAdminClient()
      const { data: member } = await admin
        .from("team_members")
        .select("role, profile_id")
        .eq("user_id", user.id)
        .maybeSingle()
      if (member?.role) role = member.role
      if (role !== "super_admin" && member?.profile_id) {
        const { data: profile } = await admin
          .from("access_profiles")
          .select("permissions")
          .eq("id", member.profile_id)
          .eq("is_active", true)
          .maybeSingle()
        perms = (profile?.permissions as ProfilePermissions | null) ?? null
      }
    } catch {
      // fall through to unsuggested view
    }
  }

  const suggestions = accessibleDomains(role, perms).slice(0, 6)

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-8 md:p-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <Lock size={22} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Access denied</div>
            <h1 className="text-2xl font-semibold text-[#1a1a2e]">
              You can&rsquo;t open this workspace
            </h1>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          {targetedDomain ? (
            <>
              Your profile doesn&rsquo;t include access to the{" "}
              <strong>{targetedDomain.name}</strong> workspace
              {attempted ? <> (<code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{attempted}</code>)</> : null}.
              Ask a super admin to grant the{" "}
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                {targetedDomain.gate.module}.{targetedDomain.gate.action}
              </code>{" "}
              permission on your access profile.
            </>
          ) : attempted ? (
            <>
              Your profile doesn&rsquo;t include access to{" "}
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{attempted}</code>.
              Ask a super admin to update your access profile.
            </>
          ) : (
            <>Your profile doesn&rsquo;t include access to this section. Ask a super admin to update your access profile.</>
          )}
        </p>

        {suggestions.length > 0 && (
          <div className="mt-8">
            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">
              Workspaces you can open
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((d) => (
                <Link
                  key={d.slug}
                  href={d.href}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-[#1a1a2e] transition-colors"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: d.accent }}
                  />
                  {d.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a2e] text-white text-sm font-medium hover:bg-black transition-colors"
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>
          <Link
            href="mailto:sunnymshah@gmail.com?subject=Access%20request"
            className="text-xs text-gray-500 hover:text-[#c9a84c] transition-colors"
          >
            Request access
          </Link>
        </div>
      </div>
    </div>
  )
}
