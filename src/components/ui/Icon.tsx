/**
 * Inline icon set matching the Material Symbols Outlined glyphs used in the
 * theme. Kept inline so the chrome never flashes literal ligature text while a
 * webfont loads.
 */

type IconProps = {
  className?: string;
};

export function MenuIcon({ className = 'h-7 w-7' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 6.5h18M3 12h18M3 17.5h18" />
    </svg>
  );
}

export function CloseIcon({ className = 'h-7 w-7' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

export function ArrowForwardIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function PlayIcon({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72a.5.5 0 0 0 .76.43l11.2-6.86a.5.5 0 0 0 0-.86L8.76 4.71a.5.5 0 0 0-.76.43Z" />
    </svg>
  );
}
