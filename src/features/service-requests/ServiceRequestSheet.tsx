import { toast } from 'sonner';
import { Bell, Droplets, HandHelping, ReceiptText } from 'lucide-react';
import type { ServiceRequestType } from '@/types';
import { serviceRequestService } from '@/data/services';
import { Modal } from '@/components/ui';

const OPTIONS: { type: ServiceRequestType; label: string; icon: typeof Bell }[] = [
  { type: 'waiter', label: 'Call Waiter', icon: Bell },
  { type: 'water', label: 'Request Water', icon: Droplets },
  { type: 'bill', label: 'Request Bill', icon: ReceiptText },
  { type: 'assistance', label: 'Need Assistance', icon: HandHelping },
];

/**
 * Feature 6 — Waiter Call System. Four one-tap requests; the table number is
 * attached automatically and the waiter dashboard is notified instantly.
 */
export function ServiceRequestSheet({
  open,
  onClose,
  restaurantId,
  tableId,
  tableNumber,
}: {
  open: boolean;
  onClose: () => void;
  restaurantId: string;
  tableId: string;
  tableNumber: number;
}) {
  function request(type: ServiceRequestType, label: string) {
    serviceRequestService.create(restaurantId, tableId, type);
    toast.success(`${label} sent — a waiter is on the way to Table ${tableNumber}.`);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="How can we help?" description={`Table ${tableNumber}`} size="sm">
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => request(type, label)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-ink/10 bg-white p-5 text-center font-semibold transition-colors hover:border-ember-300 hover:bg-ember-50 active:scale-95"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-ember-100 text-ember-600">
              <Icon className="h-6 w-6" />
            </span>
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
