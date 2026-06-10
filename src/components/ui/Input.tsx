import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const base =
  'w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted ' +
  'transition-colors focus:border-ember-400 focus:outline-none focus:ring-2 focus:ring-ember-500/30 disabled:opacity-60';

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
}

function FieldShell({
  label,
  error,
  hint,
  children,
}: FieldProps & { children: React.ReactNode }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-semibold text-ink-soft">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-red-500">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(
  function Input({ label, error, hint, className, ...props }, ref) {
    return (
      <FieldShell label={label} error={error} hint={hint}>
        <input ref={ref} className={cn(base, error && 'border-red-400', className)} {...props} />
      </FieldShell>
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps>(
  function Textarea({ label, error, hint, className, ...props }, ref) {
    return (
      <FieldShell label={label} error={error} hint={hint}>
        <textarea ref={ref} className={cn(base, 'min-h-[88px] resize-y', error && 'border-red-400', className)} {...props} />
      </FieldShell>
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldProps>(
  function Select({ label, error, hint, className, children, ...props }, ref) {
    return (
      <FieldShell label={label} error={error} hint={hint}>
        <select ref={ref} className={cn(base, 'appearance-none bg-white', error && 'border-red-400', className)} {...props}>
          {children}
        </select>
      </FieldShell>
    );
  },
);
