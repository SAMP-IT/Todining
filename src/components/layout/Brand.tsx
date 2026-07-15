import { cn } from '@/lib/cn';

/**
 * The monogram seal. Every shell (customer, staff, admin, login) draws this same
 * mark inline, so the brand reads as one thing wherever it appears.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-grid place-items-center rounded-full border border-ink font-display font-semibold text-ink',
        className,
      )}
      aria-hidden
    >
      T
    </span>
  );
}

export function Wordmark({ showLogo = true, className }: { showLogo?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {showLogo && <Logo className="h-8 w-8 text-sm" />}
      {/* Set in one ink rather than split across two colours: ember is the
          action colour and should not be spent on the wordmark. */}
      <span className="font-display text-xl font-semibold tracking-tight text-ink">ToDining</span>
    </span>
  );
}
