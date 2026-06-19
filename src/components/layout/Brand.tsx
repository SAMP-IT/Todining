import { cn } from '@/lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-grid place-items-center rounded-xl bg-ember-500 text-cream', className)}>
      <svg viewBox="0 0 32 32" className="h-[60%] w-[60%]" aria-hidden>
        <path d="M11 6v8a2 2 0 0 0 2 2v10a1 1 0 0 0 2 0V16a2 2 0 0 0 2-2V6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M22 6c-1.9 0-3 2.2-3 5s1.1 5 3 5v10a1 1 0 0 0 2 0V6z" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Wordmark({ showLogo = true, className }: { showLogo?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {showLogo && <Logo className="h-8 w-8" />}
      <span className="font-display text-xl font-semibold tracking-tight text-ink">
        To<span className="text-ember-500">Dining</span>
      </span>
    </span>
  );
}
