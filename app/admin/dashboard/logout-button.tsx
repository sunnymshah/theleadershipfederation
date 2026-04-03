"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1.5 text-xs text-white/40 border border-white/[0.08] rounded-lg hover:text-white/70 hover:border-white/15 transition-colors"
    >
      Sign Out
    </button>
  )
}
