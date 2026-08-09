'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { ArrowForwardIcon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { NAV, PRIMARY_CTA, SITE, type NavItem } from '@/config/site';

/**
 * Top Bar — minimalist uppercase links at 0.2em tracking, active route marked
 * with a 1px obsidian rule.
 *
 * Items carrying `children` open a dropdown of the actual event pages, so a
 * visitor can go straight from the nav to, say, the Bengaluru conclave. The
 * panel opens on hover and on keyboard focus, and the parent link stays
 * clickable in its own right.
 */
export function TopNav() {
  const pathname = usePathname();
  const [openHref, setOpenHref] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setOpenHref(null), [pathname]);
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    []
  );

  /* A small grace period stops the panel snapping shut while the pointer
     travels the gap between the trigger and the list. */
  const open = (href: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenHref(href);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenHref(null), 160);
  };

  return (
    <nav
      className="absolute top-0 z-50 mx-auto flex w-full max-w-canvas items-center justify-between px-8 py-8 pr-24 md:px-16 md:pr-[120px]"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpenHref(null);
      }}
    >
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

      <div className="hidden items-center space-x-6 lg:flex 2xl:space-x-8">
        {NAV.map((item) => (
          <NavEntry
            key={item.href}
            item={item}
            active={isActive(item, pathname)}
            open={openHref === item.href}
            onOpen={() => open(item.href)}
            onClose={scheduleClose}
          />
        ))}

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

function isActive(item: NavItem, pathname: string) {
  if (item.external) return false;
  return item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
}

function NavEntry({
  item,
  active,
  open,
  onOpen,
  onClose,
}: {
  item: NavItem;
  active: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const hasChildren = Boolean(item.children?.length);

  const linkClass = cn(
    'nav-link whitespace-nowrap transition-colors',
    active
      ? 'border-b border-obsidian pb-1 text-obsidian'
      : 'text-obsidian/70 hover:text-terracotta'
  );

  const label = (
    <>
      <span className="2xl:hidden">{item.shortLabel}</span>
      <span className="hidden 2xl:inline">{item.label}</span>
    </>
  );

  if (!hasChildren) {
    return item.external ? (
      <a href={item.href} target="_blank" rel="noreferrer" className={linkClass}>
        {label}
      </a>
    ) : (
      <Link href={item.href} aria-current={active ? 'page' : undefined} className={linkClass}>
        {label}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onFocus={onOpen}
      onBlur={onClose}
    >
      <Link
        href={item.href}
        aria-current={active ? 'page' : undefined}
        aria-expanded={open}
        className={cn(linkClass, 'flex items-center gap-2')}
      >
        {label}
        <svg
          viewBox="0 0 10 6"
          aria-hidden="true"
          className={cn(
            'h-[5px] w-[9px] transition-transform duration-300',
            open && 'rotate-180'
          )}
        >
          <path
            d="M1 1l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </Link>

      <div
        className={cn(
          'absolute left-1/2 top-full z-50 w-[380px] -translate-x-1/2 pt-5 transition-all duration-300 ease-editorial',
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-1 opacity-0'
        )}
      >
        <div className="card-silk shadow-[0_30px_60px_rgba(0,0,0,0.10)]">
          <p className="label-caps border-b border-obsidian/10 px-6 py-4 text-terracotta">
            {item.label}
          </p>

          <ul className="max-h-[60vh] overflow-y-auto">
            {item.children!.map((child) => (
              <li key={child.href + child.label}>
                <a
                  href={child.href}
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={open ? undefined : -1}
                  className="group flex items-center justify-between gap-4 border-b border-obsidian/8 px-6 py-4 transition-colors last:border-b-0 hover:bg-white/60"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-base leading-tight text-obsidian transition-colors group-hover:text-terracotta">
                      {child.label}
                    </span>
                    {child.meta && (
                      <span className="label-caps mt-1.5 block text-[9px] text-obsidian/45">
                        {child.meta}
                      </span>
                    )}
                  </span>
                  <ArrowForwardIcon className="h-4 w-4 shrink-0 text-obsidian/25 transition-all group-hover:translate-x-1 group-hover:text-terracotta" />
                </a>
              </li>
            ))}
          </ul>

          <Link
            href={item.href}
            tabIndex={open ? undefined : -1}
            className="label-caps block border-t border-obsidian/10 px-6 py-4 text-obsidian/50 transition-colors hover:text-terracotta"
          >
            View all →
          </Link>
        </div>
      </div>
    </div>
  );
}
