'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  ENTRANCE ANIMATIONS
 * ─────────────────────────────────────────────────────────────────────────
 *  Both helpers are CSS-driven on purpose. A JS-driven `opacity: 0` start —
 *  the Framer `initial`/`whileInView` pattern — bakes the hidden state into
 *  the server-rendered HTML, so the copy stays invisible if the bundle is
 *  slow, blocked or fails. `requestAnimationFrame` is also suspended in a
 *  background tab, which can stall such a reveal indefinitely.
 *
 *  Here the resting state IS the visible state. Nothing is hidden until the
 *  component has mounted and confirmed it can observe scroll, so no-JS and
 *  failed-JS both render the full page.
 *
 *  Framer Motion still drives the things that genuinely need a JS timeline:
 *  the infinite marquee and the menu overlay's enter/exit.
 */

const TRANSITION =
  'transition-[opacity,transform] duration-700 ease-editorial motion-reduce:transition-none';

export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  /** Seconds. */
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    setArmed(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -80px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={cn(
        TRANSITION,
        armed && !shown && 'translate-y-6 opacity-0',
        className
      )}
      style={delay && armed ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </Tag>
  );
}

/**
 * Above-the-fold entrance. Pure keyframes — plays once on load, and
 * `prefers-reduced-motion` drops straight to the resting state.
 */
export function RevealOnMount({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('animate-fade-up', className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
