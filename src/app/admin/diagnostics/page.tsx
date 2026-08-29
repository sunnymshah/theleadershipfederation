import Link from 'next/link';

import { NAV, SITE, STAGE_METRICS } from '@/config/site';
import { ADVISORY_BOARD, JURY } from '@/data/board';
import { EDITIONS } from '@/data/editions';
import { ARCHIVE_FILMS, FEATURE_FILMS, TESTIMONIAL_REELS } from '@/data/films';
import { LEADERS } from '@/data/leaders';
import { SPONSORS } from '@/data/sponsors';
import { HUBS } from '@/data/programmes';
import { storeHealth } from '@/lib/store';

export const dynamic = 'force-dynamic';

/** Operational status only — what is wired up and working. */
export default async function DiagnosticsPage() {
  const health = await storeHealth();

  const checks = [
    {
      label: 'Submission store',
      ok: health.ok,
      detail: health.detail,
    },
    {
      label: 'Admin credentials',
      ok: Boolean(process.env.ADMIN_PASSWORD_HASH),
      detail: process.env.ADMIN_PASSWORD_HASH
        ? 'scrypt hash loaded from the environment.'
        : 'ADMIN_PASSWORD_HASH is missing.',
    },
    {
      label: 'Session signing key',
      ok: Boolean(process.env.ADMIN_SESSION_SECRET),
      detail: process.env.ADMIN_SESSION_SECRET
        ? 'Sessions are signed and expire after 8 hours.'
        : 'ADMIN_SESSION_SECRET is missing.',
    },
    {
      label: 'Canonical URL',
      ok: Boolean(SITE.url),
      detail: SITE.url,
    },
  ];

  const inventory = [
    ['Leaders', LEADERS.length],
    ['Partner marks', SPONSORS.length],
    ['Editions', EDITIONS.length],
    ['Board advisors', ADVISORY_BOARD.length],
    ['Jury members', JURY.length],
    ['Hubs', HUBS.length],
    [
      'Films & reels',
      FEATURE_FILMS.length + ARCHIVE_FILMS.length + TESTIMONIAL_REELS.length,
    ],
    ['Public pages', NAV.filter((n) => !n.external).length + 2],
  ] as const;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-5 py-10 md:px-10">
      <header className="flex flex-col justify-between gap-5 border-b border-obsidian/20 pb-6 md:flex-row md:items-end">
        <div>
          <p className="label-caps flex items-center text-terracotta">
            <span className="mr-4 h-[1px] w-8 bg-terracotta" />
            Diagnostics
          </p>
          <h1 className="mt-5 font-serif text-4xl font-medium leading-none tracking-tighter text-obsidian md:text-5xl">
            What&rsquo;s <span className="italic text-terracotta/90">wired up.</span>
          </h1>
        </div>
        <Link
          href="/admin"
          className="label-caps rounded-full border-2 border-obsidian px-4 py-2.5 text-obsidian transition-colors hover:bg-obsidian hover:text-white"
        >
          Back to inbox
        </Link>
      </header>

      <section className="mt-10">
        <p className="label-caps text-obsidian/40">System checks</p>
        <ul className="mt-5 border-t border-obsidian/15">
          {checks.map((check) => (
            <li
              key={check.label}
              className="flex flex-col gap-2 border-b border-obsidian/15 py-5 sm:flex-row sm:items-baseline sm:gap-6"
            >
              <span className="flex w-56 shrink-0 items-center gap-3">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    check.ok ? 'bg-emerald-600' : 'bg-terracotta'
                  }`}
                />
                <span className="font-serif text-lg text-obsidian">
                  {check.label}
                </span>
              </span>
              <span className="break-words text-sm font-light text-obsidian/65">
                {check.detail}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <p className="label-caps text-obsidian/40">Published figures</p>
        <div className="mt-5 grid grid-cols-2 gap-px border border-obsidian/10 bg-obsidian/10 sm:grid-cols-3">
          {STAGE_METRICS.map((metric) => (
            <div key={metric.label} className="bg-white/60 p-6">
              <p className="font-serif text-4xl leading-none text-obsidian">
                {metric.value}
              </p>
              <p className="label-caps mt-3 text-obsidian/45">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <p className="label-caps text-obsidian/40">Content on the site</p>
        <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-obsidian/55">
          Counted live from the data files. Content is changed by editing those
          files and pushing — this console is read-only by design.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-px border border-obsidian/10 bg-obsidian/10 lg:grid-cols-4">
          {inventory.map(([label, value]) => (
            <div key={label} className="bg-white/60 p-5">
              <p className="font-serif text-3xl leading-none text-obsidian">
                {value}
              </p>
              <p className="label-caps mt-2 text-obsidian/45">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
