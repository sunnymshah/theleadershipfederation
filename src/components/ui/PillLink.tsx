import Link from 'next/link';

import { ArrowForwardIcon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

/**
 * Interactive elements are the only pill-shaped things in the system — the
 * roundness is what separates "clickable" from "viewable".
 *
 * `solid`   — terracotta fill, goes obsidian on hover (primary conversion).
 * `outline` — 2px obsidian hairline, inverts on hover (secondary).
 */
export function PillLink({
  href,
  children,
  variant = 'solid',
  withArrow = true,
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'solid' | 'outline';
  withArrow?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex items-center space-x-4 rounded-full px-8 py-4 transition-colors duration-300',
        variant === 'solid'
          ? 'bg-terracotta text-white shadow-lg hover:bg-obsidian'
          : 'border-2 border-obsidian text-obsidian hover:bg-obsidian hover:text-white',
        className
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-widest">
        {children}
      </span>
      {withArrow && (
        <ArrowForwardIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      )}
    </Link>
  );
}
