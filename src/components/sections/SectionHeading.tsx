import { Eyebrow } from '@/components/ui/Eyebrow';
import { Reveal } from '@/components/ui/Reveal';
import { cn } from '@/lib/utils';

/**
 * The standard section opener: numbered eyebrow, serif display line with an
 * italic keyword, optional standfirst, and a champagne rule.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  italic,
  standfirst,
  className,
}: {
  index?: string;
  eyebrow: string;
  /** Leading roman text. */
  title: string;
  /** Trailing italic keyword — the editorial accent. */
  italic?: string;
  standfirst?: string;
  className?: string;
}) {
  return (
    <Reveal className={cn('max-w-3xl', className)}>
      <Eyebrow index={index}>{eyebrow}</Eyebrow>
      <h2 className="mt-8 font-serif text-4xl font-medium leading-[1.05] tracking-tight text-obsidian md:text-5xl lg:text-6xl">
        {title}
        {italic ? <span className="italic text-terracotta/90"> {italic}</span> : null}
      </h2>
      <div className="mt-6 h-[2px] w-24 bg-champagne" />
      {standfirst ? (
        <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-obsidian/70">
          {standfirst}
        </p>
      ) : null}
    </Reveal>
  );
}
