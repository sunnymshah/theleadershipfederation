import Link from 'next/link';

import { Console } from '@/components/admin/Console';
import { listSubmissions, storeHealth } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * The admin home is the inbox. Content lives in the repo and is changed by
 * editing a data file, so there is deliberately nothing to edit here — this
 * screen exists to read what came in and act on it.
 */
export default async function AdminPage() {
  const [rows, health] = await Promise.all([
    listSubmissions().catch(() => []),
    storeHealth(),
  ]);

  return (
    <main className="mx-auto w-full max-w-[1500px] px-5 py-10 md:px-10">
      <header className="flex flex-col justify-between gap-5 border-b border-obsidian/20 pb-6 md:flex-row md:items-end">
        <div>
          <p className="label-caps flex items-center text-terracotta">
            <span className="mr-4 h-[1px] w-8 bg-terracotta" />
            Inbox
          </p>
          <h1 className="mt-5 font-serif text-4xl font-medium leading-none tracking-tighter text-obsidian md:text-5xl">
            Who&rsquo;s <span className="italic text-terracotta/90">reached out.</span>
          </h1>
        </div>

        <nav className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/diagnostics"
            className="label-caps rounded-full border border-obsidian/20 px-4 py-2.5 text-obsidian/60 transition-colors hover:border-obsidian hover:text-obsidian"
          >
            Diagnostics
          </Link>
          <Link
            href="/"
            className="label-caps rounded-full border border-obsidian/20 px-4 py-2.5 text-obsidian/60 transition-colors hover:border-obsidian hover:text-obsidian"
          >
            View site
          </Link>
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="label-caps rounded-full border-2 border-obsidian px-4 py-2.5 text-obsidian transition-colors hover:bg-obsidian hover:text-white"
            >
              Sign out
            </button>
          </form>
        </nav>
      </header>

      <div className="mt-8">
        <Console initialRows={rows} health={health} />
      </div>
    </main>
  );
}
