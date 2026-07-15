import { Bell, Droplets, HandHelping, ReceiptText } from 'lucide-react';
import type { ServiceRequest, ServiceRequestType } from '@/types';
import { SERVICE_REQUEST_LABELS } from '@/data/services';
import { Button } from '@/components/ui';
import { timeAgo } from '@/lib/format';

const ICONS: Record<ServiceRequestType, typeof Bell> = {
  waiter: Bell,
  water: Droplets,
  bill: ReceiptText,
  assistance: HandHelping,
};

/**
 * An open guest call on the waiter board. Gold is the board's "someone is
 * waiting on you" tone, so the whole card is tinted: it reads across the room
 * before the copy does. Tint + a filled icon well carry the status, never a
 * side stripe (DESIGN.md). Text sits at gold-600 to clear WCAG AA on the tint.
 */
export function ServiceRequestCard({ request, onResolve }: { request: ServiceRequest; onResolve: (id: string) => void }) {
  const Icon = ICONS[request.type];
  return (
    <div className="flex animate-fade-up items-center gap-3 rounded-xl border border-gold-200 bg-gold-100 p-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold-500 text-cream">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        {/* No `tnum`: Cormorant's tabular figures gap "Table 12" into "Table I 2". */}
        <p className="font-display text-lg font-semibold leading-none">Table {request.tableNumber}</p>
        <p className="mt-1 truncate text-xs font-semibold text-gold-600">
          {SERVICE_REQUEST_LABELS[request.type]} · {timeAgo(request.createdAt)}
        </p>
      </div>
      {/* Ink outline, not a filled button: on a gold card the action should be
          the quiet part. Ember is reserved for the primary path elsewhere. */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onResolve(request.id)}
        className="shrink-0 border-ink bg-transparent text-ink hover:bg-ink hover:text-cream"
      >
        Resolve
      </Button>
    </div>
  );
}
