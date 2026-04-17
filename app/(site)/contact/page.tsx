import { redirect } from "next/navigation"

export const metadata = {
  title: "Register | The Leadership Federation",
  description: "Register for The Leadership Federation events and platforms.",
}

/**
 * /contact has been retired in favour of the unified /register experience,
 * which now surfaces the full office + departments directory alongside the
 * role-based registration flow. Existing inbound links still work.
 */
export default function ContactPage() {
  redirect("/register")
}
