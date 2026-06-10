import { useState, type ImgHTMLAttributes } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Image that gracefully degrades to a branded gradient + icon if the source
 * fails to load — so the menu never shows broken image boxes.
 */
export function ImageWithFallback({
  src,
  alt,
  className,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={cn('grid place-items-center bg-gradient-to-br from-ember-100 to-cream-deep text-ember-300', className)}
        aria-label={alt}
      >
        <UtensilsCrossed className="h-1/3 w-1/3" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
      {...props}
    />
  );
}
