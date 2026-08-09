import { Footer } from '@/components/layout/Footer';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { RevealOnMount } from '@/components/ui/Reveal';
import { cn } from '@/lib/utils';

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE PAGE PRIMITIVE
 * ─────────────────────────────────────────────────────────────────────────
 *  Every route below "/" is built from this. It owns the canvas geometry —
 *  max width, asymmetric right padding for the accent strip, the 160px drop
 *  beneath the absolute top bar — plus the editorial page header and footer.
 *
 *  A new page is therefore:
 *
 *    export default function Page() {
 *      return (
 *        <PageShell index="07" eyebrow="Insights" title="Field" italic="notes.">
 *          …sections…
 *        </PageShell>
 *      );
 *    }
 */
export function PageShell({
  index,
  eyebrow,
  title,
  italic,
  standfirst,
  meta,
  children,
  className,
}: {
  index?: string;
  eyebrow: string;
  /** Roman portion of the display line. */
  title: string;
  /** Italic terracotta keyword that closes the display line. */
  italic?: string;
  standfirst?: string;
  /** Small tracked facts rendered beneath the rule, e.g. hub counts. */
  meta?: string[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <main
        className={cn(
          'relative mx-auto w-full max-w-canvas px-8 pb-16 pr-24 pt-[172px] md:px-16 md:pr-[120px] lg:pt-[200px]',
          className
        )}
      >
        <header className="relative border-b border-obsidian/20 pb-14">
          <div className="absolute -left-4 -top-4 h-2 w-2 bg-champagne" />

          <RevealOnMount>
            <Eyebrow index={index}>{eyebrow}</Eyebrow>
          </RevealOnMount>

          <RevealOnMount delay={0.1}>
            <h1 className="mt-8 max-w-4xl font-serif text-5xl font-medium leading-[1.0] tracking-tighter text-obsidian md:text-7xl lg:text-[86px]">
              {title}
              {italic ? (
                <span className="italic text-terracotta/90"> {italic}</span>
              ) : null}
            </h1>
          </RevealOnMount>

          {standfirst ? (
            <RevealOnMount delay={0.2}>
              <p className="mt-10 max-w-xl border-l border-obsidian/20 pl-6 text-lg font-light leading-relaxed text-obsidian/80">
                {standfirst}
              </p>
            </RevealOnMount>
          ) : null}

          {meta?.length ? (
            <RevealOnMount delay={0.3}>
              <div className="label-caps mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-obsidian/60">
                {meta.map((item, i) => (
                  <span key={item} className="flex items-center gap-8">
                    {i > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
                    )}
                    {item}
                  </span>
                ))}
              </div>
            </RevealOnMount>
          ) : null}
        </header>

        <div className="pt-20">{children}</div>
      </main>

      <Footer />
    </>
  );
}
