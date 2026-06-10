import type { Notification, NotificationType } from '@/types';
import { getDb, mutate } from '@/data/mock/store';
import { realtimeBus } from '@/data/realtime/bus';
import { makeId } from '@/lib/id';

export interface SendInput {
  type: NotificationType;
  recipient: string;
  message: string;
}

/**
 * WhatsApp notification service — SIMULATED.
 * Messages are composed and logged exactly as they'd be sent. To go live, swap
 * the body of `send()` for a Meta WhatsApp Cloud API / Twilio call; the rest of
 * the app is unaffected because everyone depends on this interface.
 */
export const notificationService = {
  list(restaurantId: string): Notification[] {
    return getDb()
      .notifications.filter((n) => n.restaurantId === restaurantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  send(restaurantId: string, input: SendInput): Notification {
    const notif = mutate((db) => {
      const n: Notification = {
        id: makeId('ntf'),
        restaurantId,
        channel: 'whatsapp',
        type: input.type,
        recipient: input.recipient,
        message: input.message,
        status: 'sent',
        createdAt: new Date().toISOString(),
      };
      db.notifications.push(n);
      return n;
    });
    realtimeBus.emit({ type: 'notification:created', restaurantId, payload: { id: notif.id } });
    return notif;
  },
};
