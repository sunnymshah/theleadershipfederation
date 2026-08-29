import Link from 'next/link';

import { ArrowForwardIcon } from '@/components/ui/Icon';
import { NAV, SITE, STAGE_METRICS } from '@/config/site';
import { ADVISORY_BOARD, JURY } from '@/data/board';
import { DESKS } from '@/data/contact';
import { EDITIONS } from '@/data/editions';
import { ARCHIVE_FILMS, FEATURE_FILMS, TESTIMONIAL_REELS } from '@/data/films';
import { FORMATS } from '@/data/formats';
import { LEADERS } from '@/data/leaders';
import { HUBS } from '@/data/programmes';
import { SPONSORS } from '@/data/sponsors';

export const dynamic = 'force-dynamic';

const upcoming = EDITIONS.filter((e) => e.status === 'Upcoming');
const past = EDITIONS.filter((e) => e.status === 'Past');

const INVENTORY = [
  { label: 'Leaders on stage', value: LEADERS.length, file: 'src/data/leaders.ts' },
  { label: 'Partner marks', value: SPONSORS.length, file: 'src/data/sponsors.ts' },
  { label: 'Editions', value: EDITIONS.length, file: 'src/data/editions.ts' },
  { label: 'Board advisors', value: ADVISORY_BOARD.length, file: 'src/data/board.ts' },
  { label: 'Jury members', value: JURY.length, file: 'src/data/board.ts' },
  { label: 'Formats', value: FORMATS.length, file: 'src/data/formats.ts' },
  {
    label: 'Films & reels',
    value: FEATURE_FILMS.length + ARCHIVE_FILMS.length + TESTIMONIAL_REELS.length,
    file: 'src/data/films.ts',
  },
  { label: 'Hubs', value: HUBS.length, file: 'src/data/programmes.ts' },
];

export default function AdminDashboard() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-14 md:px-12">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex flex-col justify-between gap-6 border-b border-obsidian/20 pb-8 md:flex-row md:items-end">
        <div>
          <p className="label-caps flex items-center text-terracotta">
            <span className="mr-4 h-[1px] w-8 bg-terracotta" />
            Admin
          </p>
          <h1 className="mt-6 font-serif text-4xl font-medium leading-none tracking-tighter text-obsidian md:text-5xl">
            Site <span className="italic text-terracotta/90">control.</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="label-caps rounded-full border border-obsidian/20 px-5 py-2.5 text-obsidian/60 transition-colors hover:border-obsidian hover:text-obsidian"
          >
            View site
          </Link>
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="label-caps rounded-full border-2 border-obsidian px-5 py-2.5 text-obsidian transition-colors hover:bg-obsidian hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* ── Headline numbers ───────────────────────────────────────────── */}
      <section className="mt-12">
        <p className="label-caps text-obsidian/40">Published figures</p>
        <div className="mt-6 grid grid-cols-1 gap-px border border-obsidian/10 bg-obsidian/10 sm:grid-cols-3">
          {STAGE_METRICS.map((metric) => (
            <div key={metric.label} className="bg-white/50 p-8">
              <p className="font-serif text-5xl leading-none text-obsidian">
                {metric.value}
              </p>
              <p className="label-caps mt-4 text-obsidian/45">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Content inventory ──────────────────────────────────────────── */}
      <section className="mt-14">
        <p className="label-caps text-obsidian/40">Content inventory</p>
        <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-obsidian/60">
          Every figure below is counted live from the data files at build time —
          edit the file, push, and the whole site updates. Nothing here is typed
          by hand.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-px border border-obsidian/10 bg-obsidian/10 lg:grid-cols-4">
          {INVENTORY.map((item) => (
            <div key={item.label} className="bg-white/50 p-6">
              <p className="font-serif text-3xl leading-none text-obsidian">
                {item.value}
              </p>
              <p className="label-caps mt-3 text-obsidian/45">{item.label}</p>
              <code className="mt-3 block truncate text-[10px] font-light text-obsidian/35">
                {item.file}
              </code>
            </div>
          ))}
        </div>
      </section>

      {/* ── Programme calendar ─────────────────────────────────────────── */}
      <section className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <p className="label-caps text-obsidian/40">
            Upcoming · {upcoming.length}
          </p>
          <ul className="mt-6 border-t border-obsidian/15">
            {upcoming.map((edition) => (
              <li key={edition.index} className="border-b border-obsidian/15">
                <a
                  href={edition.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-baseline justify-between gap-4 py-4"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-lg text-obsidian transition-colors group-hover:text-terracotta">
                      {edition.title}
                    </span>
                    <span className="label-caps mt-1 block text-obsidian/45">
                      {edition.city} · {edition.date}
                    </span>
                  </span>
                  <span className="label-caps shrink-0 text-terracotta">
                    {edition.kind}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="label-caps text-obsidian/40">Archive · {past.length}</p>
          <ul className="mt-6 max-h-[420px] overflow-y-auto border-t border-obsidian/15">
            {past.map((edition) => (
              <li key={edition.index} className="border-b border-obsidian/15">
                <a
                  href={edition.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-baseline justify-between gap-4 py-4"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-lg text-obsidian transition-colors group-hover:text-terracotta">
                      {edition.title}
                    </span>
                    <span className="label-caps mt-1 block text-obsidian/45">
                      {edition.city} · {edition.date}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Routes ─────────────────────────────────────────────────────── */}
      <section className="mt-14">
        <p className="label-caps text-obsidian/40">Live pages</p>
        <ul className="mt-6 grid grid-cols-1 gap-px border border-obsidian/10 bg-obsidian/10 sm:grid-cols-2 lg:grid-cols-4">
          {[{ label: 'Home', href: '/', shortLabel: 'Home' }, ...NAV]
            .filter((item) => !('external' in item && item.external))
            .map((item) => (
              <li key={item.href} className="bg-white/50">
                <Link
                  href={item.href}
                  className="group flex items-center justify-between gap-3 p-5"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-lg text-obsidian transition-colors group-hover:text-terracotta">
                      {item.shortLabel}
                    </span>
                    <code className="label-caps mt-1 block truncate text-obsidian/35">
                      {item.href}
                    </code>
                  </span>
                  <ArrowForwardIcon className="h-4 w-4 shrink-0 text-obsidian/25 transition-all group-hover:translate-x-1 group-hover:text-terracotta" />
                </Link>
              </li>
            ))}
        </ul>
      </section>

      {/* ── Contact desks ──────────────────────────────────────────────── */}
      <section className="mt-14">
        <p className="label-caps text-obsidian/40">Contact desks on the site</p>
        <div className="mt-6 grid grid-cols-1 gap-px border border-obsidian/10 bg-obsidian/10 md:grid-cols-3">
          {DESKS.map((desk) => (
            <div key={desk.heading} className="bg-white/50 p-6">
              <p className="label-caps text-terracotta">{desk.heading}</p>
              <ul className="mt-4 space-y-3">
                {desk.people.map((person) => (
                  <li key={person.email}>
                    <p className="font-serif text-base text-obsidian">
                      {person.name}
                    </p>
                    <p className="break-all text-xs font-light text-obsidian/55">
                      {person.email}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── How to change things ───────────────────────────────────────── */}
      <section className="mt-14 bg-obsidian p-8 md:p-12">
        <p className="label-caps text-champagne">How updates work</p>
        <h2 className="mt-5 max-w-2xl font-serif text-2xl leading-tight text-white md:text-3xl">
          This site is statically generated. Editing a data file and pushing to{' '}
          <code className="text-champagne">main</code> redeploys everything
          automatically.
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-6 text-sm font-light leading-relaxed text-white/70 md:grid-cols-3">
          <li>
            <span className="label-caps block text-white/45">Add an event</span>
            Append to <code>src/data/editions.ts</code>. It appears in the nav
            dropdowns, the timeline, the footer and the register form at once.
          </li>
          <li>
            <span className="label-caps block text-white/45">Add a leader</span>
            Drop the headshot into <code>public/showcase/speakers</code> and add
            a row to <code>src/data/leaders.ts</code>.
          </li>
          <li>
            <span className="label-caps block text-white/45">Change a page</span>
            Each route is a file under <code>src/app</code>, built from the
            shared <code>PageShell</code> primitive.
          </li>
        </ul>
      </section>

      <p className="label-caps mt-12 text-obsidian/30">
        {SITE.name} · session expires after 8 hours
      </p>
    </main>
  );
}
