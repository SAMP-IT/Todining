import { useState } from 'react';
import { toast } from 'sonner';
import { MessageCircle, Send } from 'lucide-react';
import type { NotificationType } from '@/types';
import { useTenant } from '@/context/TenantContext';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { notificationService } from '@/data/services';
import { Badge, Button, EmptyState, Input, PageHeader, Select, Textarea } from '@/components/ui';
import { formatDateTime } from '@/lib/format';

const TYPE_LABEL: Record<NotificationType, string> = {
  reservation_confirmed: 'Reservation confirmed',
  reservation_reminder: 'Reservation reminder',
  order_status: 'Order update',
  promotional: 'Promotional',
};

export function NotificationsPage() {
  const { restaurant, restaurantId } = useTenant();
  const [type, setType] = useState<NotificationType>('promotional');
  const [recipient, setRecipient] = useState('All guests');
  const [message, setMessage] = useState('');

  const notifications = useLiveQuery(() => (restaurantId ? notificationService.list(restaurantId) : []), {
    restaurantId: restaurantId ?? undefined,
    types: ['notification:created', 'data:changed'],
  });

  function applyTemplate(t: NotificationType) {
    setType(t);
    const name = restaurant?.name ?? 'our restaurant';
    if (t === 'promotional') setMessage(`🎉 This weekend only — 20% off all main courses at ${name}! Show this message to redeem.`);
    if (t === 'reservation_reminder') setMessage(`Hi! A friendly reminder about your reservation at ${name} today. We can't wait to host you. 🍽️`);
    if (t === 'order_status') setMessage(`Your order is ready! Please collect it from the counter. — ${name}`);
  }

  function send() {
    if (!message.trim() || !restaurantId) return;
    notificationService.send(restaurantId, { type, recipient: recipient.trim() || 'All guests', message: message.trim() });
    toast.success('WhatsApp message sent (simulated).');
    setMessage('');
  }

  return (
    <div>
      <PageHeader title="Notifications" subtitle="WhatsApp messages for reservations, order updates and offers." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Composer */}
        <div className="card-surface h-fit p-5">
          <h2 className="mb-4 font-semibold">Send a WhatsApp message</h2>
          <div className="space-y-3">
            <Select label="Message type" value={type} onChange={(e) => applyTemplate(e.target.value as NotificationType)}>
              <option value="promotional">Promotional offer</option>
              <option value="reservation_reminder">Reservation reminder</option>
              <option value="order_status">Order update</option>
            </Select>
            <Input label="Recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} hint="A guest name, number, or a segment like 'All guests'." />
            <Textarea label="Message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message…" />
            <Button fullWidth onClick={send} disabled={!message.trim()}>
              <Send className="h-4 w-4" /> Send message
            </Button>
            <p className="text-center text-xs text-ink-muted">
              Simulated — wire Meta WhatsApp Cloud API / Twilio in <code>notificationService</code> to go live.
            </p>
          </div>
        </div>

        {/* Message log — WhatsApp style */}
        <div>
          <h2 className="mb-3 font-semibold">Sent messages</h2>
          {notifications.length === 0 ? (
            <EmptyState icon={<MessageCircle className="h-8 w-8" />} title="No messages yet" description="Sent and automated messages appear here." />
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className="ml-auto max-w-md rounded-2xl rounded-tr-sm bg-[#e7f6e7] p-3 shadow-soft">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-sage-600">To: {n.recipient}</span>
                    <Badge tone="sage">{TYPE_LABEL[n.type]}</Badge>
                  </div>
                  <p className="whitespace-pre-line text-sm text-ink">{n.message}</p>
                  <p className="mt-1 text-right text-[10px] text-ink-muted">{formatDateTime(n.createdAt)} · ✓✓ sent</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
