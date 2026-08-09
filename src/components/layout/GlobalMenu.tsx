'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { ArrowForwardIcon } from '@/components/ui/Icon';
import { NAV, PRIMARY_CTA, SITE } from '@/config/site';
import { cn } from '@/lib/utils';

/**
 * Full-canvas navigation overlay, opened from the accent strip. Below `lg`
 * this is the site's only navigation, so its show/hide is deliberately driven
 * by CSS classes rather than an animation library: the links must never depend
 * on a third-party chunk loading, and `requestAnimationFrame` is suspended in
 * background tabs. The footer carries the same link set as plain markup, so
 * navigation survives even with scripting off entirely.
 */
export function GlobalMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Close on Escape and lock scroll while the overlay owns the viewport.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      id="global-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Global navigation"
      aria-hidden={!open}
      className={cn(
        'bg-warm-silk fixed inset-0 z-[55] overflow-y-auto transition-opacity duration-500 ease-editorial motion-reduce:transition-none',
        open
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none invisible opacity-0'
      )}
    >
      <div className="mx-auto flex min-h-full w-full max-w-canvas flex-col px-8 pb-16 pr-24 pt-28 md:px-16 md:pr-[120px] md:pt-32">
        <p className="label-caps mb-10 flex items-center text-terracotta">
          <span className="mr-4 h-[1px] w-8 bg-terracotta" />
          Index
        </p>

        <ul className="flex-1 border-t border-obsidian/10">
          {NAV.map((item, index) => (
            <li
              key={item.href}
              className={cn(
                'border-b border-obsidian/10 transition-all duration-500 ease-editorial motion-reduce:transition-none',
                open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              )}
              style={{ transitionDelay: open ? `${80 + index * 60}ms` : '0ms' }}
            >
              <Link
                href={item.href}
                onClick={onClose}
                tabIndex={open ? undefined : -1}
                className="group flex items-baseline justify-between gap-6 py-5 md:py-7"
              >
                <span className="flex items-baseline gap-5">
                  <span className="label-caps w-8 shrink-0 text-obsidian/30">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-serif text-3xl leading-none tracking-tight text-obsidian transition-colors group-hover:text-terracotta md:text-5xl">
                    {item.label}
                  </span>
                </span>
                <span className="hidden max-w-xs text-right text-sm font-light leading-relaxed text-obsidian/50 lg:block">
                  {item.blurb}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <Link
            href={PRIMARY_CTA.href}
            onClick={onClose}
            tabIndex={open ? undefined : -1}
            className="group inline-flex items-center space-x-4 rounded-full bg-terracotta px-8 py-4 text-white shadow-lg transition-colors duration-300 hover:bg-obsidian"
          >
            <span className="text-xs font-semibold uppercase tracking-widest">
              {PRIMARY_CTA.label}
            </span>
            <ArrowForwardIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>

          <a
            href={`mailto:${SITE.email}`}
            tabIndex={open ? undefined : -1}
            className="label-caps text-obsidian/50 transition-colors hover:text-terracotta"
          >
            {SITE.email}
          </a>
        </div>
      </div>
    </div>
  );
}
