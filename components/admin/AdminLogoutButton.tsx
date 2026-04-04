"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { LogOut } from "lucide-react"

export function AdminLogoutButton() {
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[#999] hover:text-[#333] hover:bg-[#f0f0f0] transition-colors"
    >
      <LogOut size={16} className="shrink-0" />
      Sign Out
    </button>
  )
}
