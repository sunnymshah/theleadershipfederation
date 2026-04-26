/**
 * /[lang]/events/[slug]/[pageSlug] — locale-prefixed sub-page.
 * Mirrors the un-prefixed route but threads the locale through the
 * StandardPageRender so Puck blocks render the localised tree.
 */

import { notFound } from "next/navigation"
import { getEvent } from "@/lib/get-event"
import { StandardPageRender } from "@/components/site/event-pages/StandardPageRender"
import { getStandardPageBySlugPublic } from "@/app/actions/standardPageActions"
import { isSupportedLocale, readLocaleData } from "@/lib/locales"
import { defaultPuckDataForKind } from "@/lib/standard-page-defaults"
import type { StandardPageKind } from "@/lib/standard-pages"
import type { Data as PuckData } from "@measured/puck"

interface Props {
  params: Promise<{ lang: string; slug: string; pageSlug: string }>
}

export default async function LocalisedEventSubPage({ params }: Props) {
  const { lang, slug, pageSlug } = await params
  if (!isSupportedLocale(lang)) notFound()
  const event = await getEvent(slug)
  if (!event) notFound()
  const row = await getStandardPageBySlugPublic(event.id, pageSlug)
  if (!row) notFound()

  const defaultLocale = (event as { default_locale?: string }).default_locale ?? "en"
  const localised = readLocaleData(
    row.settings as Record<string, unknown>,
    lang,
    defaultLocale,
  ) as PuckData | null
  const data = localised && Array.isArray(localised.content) && localised.content.length > 0
    ? localised
    : defaultPuckDataForKind(row.kind as StandardPageKind)

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
      pageKind={row.kind as StandardPageKind}
      data={data}
      locale={lang}
    />
  )
}
