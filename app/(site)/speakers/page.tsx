import { redirect } from "next/navigation"

/**
 * /speakers rolled back into /events per the Nov 2026 IA refresh —
 * speakers live on their event's detail page (zoho-style sections).
 */
export default function SpeakersRedirect() {
  redirect("/events")
}
