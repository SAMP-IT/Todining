import { Bell, Check, Droplets, HandHelping, ReceiptText } from 'lucide-react';
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

export function ServiceRequestCard({ request, onResolve }: { request: ServiceRequest; onResolve: (id: string) => void }) {
  const Icon = ICONS[request.type];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gold-400/30 bg-amber-50/60 p-3 animate-fade-up">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-tight">Table {request.tableNumber}</p>
        <p className="text-sm text-ink-soft">{SERVICE_REQUEST_LABELS[request.type]} · {timeAgo(request.createdAt)}</p>
      </div>
      <Button size="sm" variant="success" onClick={() => onResolve(request.id)}>
        <Check className="h-4 w-4" /> Done
      </Button>
    </div>
  );
}
