import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Wordmark } from '@/components/layout/Brand';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-6 text-center">
      <Wordmark />
      <p className="font-display text-7xl font-semibold text-ember-500">404</p>
      <h1 className="text-xl font-semibold">This table doesn't exist</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        The page you're looking for may have been moved, or the QR link is invalid.
      </p>
      <Link to="/site">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
