'use client';

import { MenuIcon, CloseIcon } from '@/components/ui/Icon';
import { SITE } from '@/config/site';
import { cn } from '@/lib/utils';

/**
 * The Right Accent Strip — a fixed 80px terracotta bar that owns the right
 * edge of every page. Houses the global menu trigger and the repeating
 * vertical brand line. Level 50 in the z-index system.
 */
export function AccentStrip({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="fixed right-0 top-0 bottom-0 z-[60] flex w-accent-strip-width flex-col items-center justify-between bg-terracotta shadow-[-10px_0_30px_rgba(223,88,56,0.15)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="global-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="pt-10 text-white transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-4 focus-visible:ring-offset-terracotta"
      >
        {open ? <CloseIcon className="h-8 w-8" /> : <MenuIcon className="h-8 w-8" />}
      </button>

      <div
        className="mt-auto flex flex-col items-center gap-14 pb-14 text-white"
        aria-hidden="true"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'label-caps whitespace-nowrap opacity-80 [writing-mode:vertical-rl]',
              // One mark is enough on a phone; the full run needs a tall strip.
              index > 0 && 'hidden lg:block'
            )}
          >
            {SITE.verticalStripText}
          </span>
        ))}
      </div>
    </div>
  );
}
