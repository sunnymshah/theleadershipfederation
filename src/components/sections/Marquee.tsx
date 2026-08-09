'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { cn } from '@/lib/utils';

/**
 * Double-buffered infinite marquee.
 *
 * The children are rendered twice inside one track and the track is translated
 * by exactly -50%. At the moment the first buffer leaves the viewport the
 * second is in precisely its starting position, so the loop is seamless with no
 * measurement, no resize listener and no jump.
 */
export function Marquee({
  children,
  speed = 40,
  direction = 'left',
  className,
  itemClassName,
}: {
  children: React.ReactNode[];
  /** Seconds for one full buffer to pass. Higher = slower. */
  speed?: number;
  direction?: 'left' | 'right';
  className?: string;
  itemClassName?: string;
}) {
  const reduceMotion = useReducedMotion();
  const distance = direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'];

  const buffer = (bufferKey: string) => (
    <div className="flex shrink-0 items-center" aria-hidden={bufferKey === 'b'}>
      {children.map((child, index) => (
        <div key={`${bufferKey}-${index}`} className={cn('shrink-0', itemClassName)}>
          {child}
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn('mask-fade-x w-full overflow-hidden', className)}>
      <motion.div
        className="marquee-track flex w-max"
        animate={reduceMotion ? undefined : { x: distance }}
        transition={{
          duration: speed,
          ease: 'linear',
          repeat: Infinity,
          repeatType: 'loop',
        }}
      >
        {buffer('a')}
        {buffer('b')}
      </motion.div>
    </div>
  );
}
