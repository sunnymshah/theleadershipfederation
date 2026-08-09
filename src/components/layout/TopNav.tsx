'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { NAV, PRIMARY_CTA, SITE } from '@/config/site';

/**
 * Top Bar — minimalist uppercase links at 0.2em tracking. The active route is
 * marked with a 1px obsidian bottom border, per the design system.
 *
 * The bar is absolutely positioned (not sticky): it belongs to the top of the
 * editorial canvas and scrolls away with it.
 */
export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="absolute top-0 z-50 mx-auto flex w-full max-w-canvas items-center justify-between px-8 py-8 pr-24 md:px-16 md:pr-[120px]">
      <Link
        href="/"
        aria-label={`${SITE.name} — home`}
        className="mr-8 flex w-[180px] shrink-0 items-center transition-opacity hover:opacity-80 xl:w-[200px] 2xl:mr-12 2xl:w-[240px]"
      >
        <Image
          src="/tlf-logo.png"
          alt={SITE.name}
          width={866}
          height={288}
          priority
          className="h-auto w-full object-contain"
        />
      </Link>

      <div className="hidden items-center space-x-6 lg:flex 2xl:space-x-10">
        {NAV.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'nav-link whitespace-nowrap transition-colors',
                active
                  ? 'border-b border-obsidian pb-1 text-obsidian'
                  : 'text-obsidian/70 hover:text-terracotta'
              )}
            >
              {/* Full labels only where the row can carry them. */}
              <span className="2xl:hidden">{item.shortLabel}</span>
              <span className="hidden 2xl:inline">{item.label}</span>
            </Link>
          );
        })}

        <Link
          href={PRIMARY_CTA.href}
          className="whitespace-nowrap rounded-full border-2 border-obsidian px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-obsidian transition-all duration-300 hover:bg-obsidian hover:text-white 2xl:px-8"
        >
          {PRIMARY_CTA.label}
        </Link>
      </div>
    </nav>
  );
}
