import { redirect } from "next/navigation"

/**
 * /tickets is now folded into /events. The events page shows the
 * upcoming event with its tickets inline; past events live at /archive.
 * This thin redirect preserves any external links / SEO that pointed at
 * /tickets.
 */
export default function TicketsRedirect() {
  redirect("/events")
}
