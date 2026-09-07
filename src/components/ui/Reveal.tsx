'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  ENTRANCE ANIMATIONS
 * ─────────────────────────────────────────────────────────────────────────
 *  Rule: content is NEVER hidden waiting for JavaScript.
 *
 *  An earlier version set `opacity-0` as soon as the component mounted and
 *  only restored it when IntersectionObserver fired. On a heavy page that
 *  briefly — sometimes permanently — blanked the whole site. Now the resting
 *  state is the visible state, and the animation is additive: if the observer
 *  never runs, the page simply appears without a fade.
 */

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
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    /* Anything already on screen at mount is left alone — no point animating
       what the visitor is looking at. */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={cn(entered && 'animate-fade-up', className)}
      style={entered && delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </Tag>
  );
}

/** Above-the-fold entrance — pure keyframes, plays once on load. */
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
