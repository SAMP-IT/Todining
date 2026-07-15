import { useState } from 'react';
import { toast } from 'sonner';
import { Check, MessageCircle, Send } from 'lucide-react';
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

/** Each template gets its own badge tone so the log scans by colour, not by reading. */
const TYPE_TONE: Record<NotificationType, 'ember' | 'sage' | 'gold' | 'blue'> = {
  reservation_confirmed: 'sage',
  reservation_reminder: 'gold',
  order_status: 'blue',
  promotional: 'ember',
};

/** Micro-label, shared by the composer and the log. */
const EYEBROW = 'text-[0.55rem] font-bold uppercase tracking-[0.2em] text-ink-muted';

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
        {/* ── Composer ────────────────────────────────────────────────────── */}
        <div className="h-fit rounded-xl border border-ink/10 bg-white p-5">
          <div className="mb-4 border-b border-ink/10 pb-3">
            <h2 className="font-display text-xl font-semibold leading-tight">Compose a message</h2>
            <p className="mt-0.5 text-xs text-ink-muted">Pick a template, name the recipient, then preview it in the log.</p>
          </div>

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
          </div>

          {/* The honest footnote: nothing leaves the building yet. */}
          <p className="mt-4 border-t border-ink/10 pt-3 text-center text-[0.68rem] leading-relaxed text-ink-muted">
            Simulated · wire the Meta WhatsApp Cloud API or Twilio into{' '}
            <code className="rounded bg-ink/5 px-1 py-0.5 font-sans text-[0.64rem] font-semibold text-ink-soft">notificationService</code>{' '}
            to go live.
          </p>
        </div>

        {/* ── Message log ─────────────────────────────────────────────────── */}
        <div>
          <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-ink/10 pb-2">
            <h2 className="font-display text-xl font-semibold leading-tight">Sent messages</h2>
            {notifications.length > 0 && (
              <span className={`tnum ${EYEBROW}`}>
                {notifications.length} sent
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <EmptyState icon={<MessageCircle className="h-8 w-8" />} title="No messages yet" description="Sent and automated messages appear here." />
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <article key={n.id} className="rounded-xl border border-ink/10 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={EYEBROW}>To</p>
                      <p className="mt-0.5 truncate font-display text-lg font-semibold leading-tight">{n.recipient}</p>
                    </div>
                    <Badge tone={TYPE_TONE[n.type]} className="shrink-0">{TYPE_LABEL[n.type]}</Badge>
                  </div>

                  {/* The message body, set as a quoted block: tinted paper, no
                      side stripe (banned by DESIGN.md). */}
                  <p className="mt-3 whitespace-pre-line rounded-lg bg-cream-deep/60 px-3.5 py-2.5 text-sm leading-relaxed text-ink-soft">
                    {n.message}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between gap-3 text-[0.68rem] text-ink-muted">
                    <span className="tnum">{formatDateTime(n.createdAt)}</span>
                    <span className="flex shrink-0 items-center gap-1 font-semibold text-sage-600">
                      <Check className="h-3 w-3" strokeWidth={3} />
                      {n.status === 'sent' ? 'Sent' : 'Queued'}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
