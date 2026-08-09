# The Leadership Federation

Editorial marketing site for The Leadership Federation — a global platform connecting GCC
leaders, CXOs, policymakers and enterprise solution providers.

**Stack:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Framer Motion

```bash
npm install
npm run dev        # http://localhost:3200
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

> **Never run `npm run build` while `npm run dev` is running.** Both write to `.next`, and
> the build wipes the dev server's CSS/JS chunks — the page then renders completely unstyled
> until you restart. Stop the dev server first.

---

## Adding a page

The site is built so that a new page is three small steps and no plumbing.

**1. Add it to the nav** — `src/config/site.ts`:

```ts
export const NAV: NavItem[] = [
  // …
  {
    label: 'Insights',        // full label, shown in the top bar from 2xl up
    shortLabel: 'Insights',   // condensed label used below 2xl so the row never wraps
    href: '/insights',
    blurb: 'Field notes from the federation.',   // shown in the menu overlay
  },
];
```

That single entry drives the **top navigation**, the **menu overlay**, the **footer** and
`sitemap.xml`. Nothing else needs editing.

**2. Create the route** — `src/app/insights/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { SectionHeading } from '@/components/sections/SectionHeading';

export const metadata: Metadata = {
  title: 'Insights',                 // becomes "Insights | The Leadership Federation"
  description: '…',
};

export default function InsightsPage() {
  return (
    <PageShell
      index="08"
      eyebrow="Field notes"
      title="What we are"
      italic="learning."
      standfirst="One paragraph of standfirst."
      meta={['12 essays', 'Updated monthly']}
    >
      <SectionHeading index="09" eyebrow="Latest" title="Recent" italic="thinking." />
      {/* …sections… */}
    </PageShell>
  );
}
```

`PageShell` owns the canvas geometry — max width, the asymmetric right padding that clears
the accent strip, the drop beneath the absolute top bar — plus the editorial page header and
the footer. Use it for every route below `/`.

**3. Add content data** to `src/data/` if the page needs a list. Keep pages presentational
and data in `src/data/` so copy can change without touching layout.

---

## Project structure

```
src/
  app/                    one folder per route; layout.tsx holds fonts + metadata
    globals.css           warm-silk canvas, sand-glass materials, keyframes
    sitemap.ts robots.ts  generated from config/site.ts
  components/
    layout/               TopNav, AccentStrip, GlobalMenu, Footer, SiteShell, PageShell
    sections/             Hero, Marquee, PartnerMarquee, ProgrammeGrid, FilmCard,
                          SectionHeading, InquiryForm
    ui/                   PillLink, Eyebrow, Reveal, Icon
  config/site.ts          ← nav, brand, metrics. Single source of truth.
  data/                   partners, programmes, films, people, images
```

---

## Design system

Tokens are transcribed verbatim from the Stitch theme export into `tailwind.config.ts`.
Treat the palette as a contract — don't "tidy" the values.

| Token | Value | Use |
| --- | --- | --- |
| `obsidian` | `#0A0A0A` | Display type, structural blocks |
| `terracotta` | `#DF5838` | Accent strip, CTAs, italic keywords |
| `champagne` | `#C5A880` | Decorative rules, dark-ground accents |
| `warm-silk-bg` | `#F4F3EF` | Canvas, multiplied with the silk texture |
| `slate-copy` | `#4A4A4F` | Long-form body copy |

- **Serif** (EB Garamond) for display; italics carry the editorial emphasis.
- **Sans** (Plus Jakarta Sans) at weight 300 for body, 500–600 tracked wide for labels.
- **Shapes:** 0px radius everywhere except interactive pills, which are fully round.
- Helper classes in `globals.css`: `.bg-warm-silk`, `.sand-glass`, `.hairline-glass`,
  `.card-silk`, `.label-caps`, `.nav-link`, `.pr-strip`, `.mask-fade-x`.

### Animation policy

Entrance animations are **CSS-driven**, deliberately. A JS-driven `opacity: 0` start bakes
the hidden state into the server-rendered HTML, so copy stays invisible if the bundle is
slow, blocked or fails — and `requestAnimationFrame` is suspended in background tabs, which
can stall such a reveal indefinitely. In `Reveal`, the resting state *is* the visible state;
nothing hides until the component has mounted and confirmed it can observe scroll.

Framer Motion drives only what needs a real JS timeline: the infinite marquee. The menu
overlay uses CSS transitions because below `lg` it is the site's only navigation, and the
footer repeats every link as plain markup so navigation survives with scripting off.

---

## Content that still needs replacing

| What | Where | Note |
| --- | --- | --- |
| Event photography | `public/events/` | Currently **stock photos**. The filenames name specific venues (Ritz-Carlton, Chatham House, ITC Kohenur) that the images do not show — `src/data/images.ts` therefore describes what is actually pictured. Replace the files and update `alt` when real photography is cleared. |
| Programme dates & venues | `src/data/programmes.ts` | Illustrative placeholders. Structure is final. |
| Advisory board names | `src/data/people.ts` | Intentionally empty; the page renders a "to be announced" state until entries are added. Never list a person without consent. |
| Event film IDs | `src/data/films.ts` | `id: ''` renders a poster with a "film in post-production" badge instead of an empty iframe. Add the YouTube/Vimeo id to go live. |
| Partner logos | `src/data/partners.ts` | Rendered as typographic wordmarks. Add `logo:` pointing at `/public/partners/…` once files are cleared. |
| Production domain | `src/config/site.ts` → `SITE.url` | Drives canonical URLs, `sitemap.xml` and `robots.txt`. |

### Enquiry form

`src/components/sections/InquiryForm.tsx` composes the message in the visitor's own mail
client, so it works with no backend and no third-party data processor. To move to a hosted
endpoint, replace the body of `handleSubmit` with a `fetch` to a route handler and keep the
field names.
