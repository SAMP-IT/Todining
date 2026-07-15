import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      {/* A ghosted numeral rather than a big ember shout: the page is a dead end,
          not an alarm. The way out is the loud thing. */}
      <p
        className="font-display text-[clamp(4rem,10vw,7rem)] font-semibold italic leading-none text-cream-deep"
        style={{ WebkitTextStroke: '1px rgba(42,33,27,0.18)' }}
      >
        404
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">This table doesn't exist</h1>
      <p className="mt-2.5 max-w-[46ch] text-sm leading-relaxed text-ink-muted">
        The link may be old, or the QR belongs to a room we don't set. Let's get you back to something edible.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2.5">
        <Link
          to="/site"
          className="rounded-lg bg-ember-500 px-5 py-3 text-sm font-bold text-cream transition-colors hover:bg-ember-600"
        >
          Back to the menu
        </Link>
        <Link
          to="/login"
          className="rounded-lg border border-ink/12 bg-white px-5 py-3 text-sm font-bold text-ink transition-colors hover:border-ink-soft"
        >
          Staff login
        </Link>
      </div>
    </div>
  );
}
