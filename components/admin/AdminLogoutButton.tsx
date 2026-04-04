"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { LogOut } from "lucide-react"

/**
 * AdminLogoutButton
 *
 * Client component that signs out the admin and redirects to login page.
 */
export function AdminLogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.05] rounded-lg transition-colors font-medium"
    >
      <LogOut size={16} className="shrink-0" />
      <span>Sign Out</span>
    </button>
  )
}
