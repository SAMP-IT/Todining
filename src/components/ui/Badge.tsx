import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'ember' | 'sage' | 'gold' | 'red' | 'blue';

const tones: Record<Tone, string> = {
  neutral: 'bg-ink/6 text-ink-soft',
  ember: 'bg-ember-100 text-ember-700',
  sage: 'bg-sage-100 text-sage-600',
  gold: 'bg-gold-100 text-gold-600',
  red: 'bg-red-100 text-red-600',
  blue: 'bg-blue-100 text-blue-700',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ tone = 'neutral', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
