/**
 * /[lang]/events/[slug] — locale-prefixed home page.
 * Sets the locale into the StandardPageRender so per-locale Puck data
 * is rendered. Falls back to the default-locale data when the requested
 * locale doesn't exist for a given page.
 */

import { notFound } from "next/navigation"
import { getEvent } from "@/lib/get-event"
import { StandardPageRender } from "@/components/site/event-pages/StandardPageRender"
import { getStandardPagePublicData } from "@/app/actions/standardPageActions"
import { getMicrositeSettings, buildSeoMetadata } from "@/lib/microsite-settings"
import { isSupportedLocale, readLocaleData } from "@/lib/locales"
import { defaultPuckDataForKind } from "@/lib/standard-page-defaults"
import type { Data as PuckData } from "@measured/puck"

interface Props {
  params: Promise<{ lang: string; slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { lang, slug } = await params
  if (!isSupportedLocale(lang)) return { title: "Not Found" }
  const event = await getEvent(slug)
  if (!event) return { title: "Not Found" }
  const settings = await getMicrositeSettings(event.id)
  return buildSeoMetadata({
    fallback: {
      title: `${event.title} | The Leadership Federation`,
      description: event.description ?? `${event.title} at ${event.venue}`,
      ogImage: event.cover_image_url,
    },
    settings,
  })
}

export default async function LocalisedEventHome({ params }: Props) {
  const { lang, slug } = await params
  if (!isSupportedLocale(lang)) notFound()
  const event = await getEvent(slug)
  if (!event) notFound()

  const stdHome = await getStandardPagePublicData(event.id, "home")
  const defaultLocale = (event as { default_locale?: string }).default_locale ?? "en"
  const settings = (stdHome.row?.settings ?? {}) as Record<string, unknown>
  const localised = readLocaleData(settings, lang, defaultLocale) as PuckData | null
  const data = localised && Array.isArray(localised.content) && localised.content.length > 0
    ? localised
    : (stdHome.data ?? defaultPuckDataForKind("home"))

  return (
    <StandardPageRender
      event={{
        id: event.id,
        slug: event.slug,
        title: event.title,
        start_date: event.start_date,
        end_date: event.end_date,
        venue: event.venue,
        description: event.description,
        cover_image_url: event.cover_image_url,
      }}
      pageKind="home"
      data={data}
      locale={lang}
    />
  )
}
