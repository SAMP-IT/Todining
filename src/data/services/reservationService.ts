import type { Reservation, ReservationStatus } from '@/types';
import { getDb, mutate } from '@/data/mock/store';
import { realtimeBus } from '@/data/realtime/bus';
import { makeId } from '@/lib/id';
import { notificationService } from './notificationService';
import { restaurantService } from './restaurantService';
import { formatReservationSlot } from '@/lib/format';

export type ReservationInput = Omit<Reservation, 'id' | 'restaurantId' | 'status' | 'createdAt'>;

export const reservationService = {
  list(restaurantId: string): Reservation[] {
    return getDb()
      .reservations.filter((r) => r.restaurantId === restaurantId)
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  },

  byStatus(restaurantId: string, status: ReservationStatus): Reservation[] {
    return this.list(restaurantId).filter((r) => r.status === status);
  },

  create(restaurantId: string, input: ReservationInput): Reservation {
    const res = mutate((db) => {
      const r: Reservation = {
        ...input,
        id: makeId('res'),
        restaurantId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      db.reservations.push(r);
      return r;
    });
    realtimeBus.emit({ type: 'reservation:created', restaurantId, payload: { id: res.id, name: res.name } });
    return res;
  },

  setStatus(id: string, status: ReservationStatus): Reservation | undefined {
    const res = mutate((db) => {
      const r = db.reservations.find((x) => x.id === id);
      if (r) r.status = status;
      return r;
    });
    if (!res) return undefined;
    realtimeBus.emit({ type: 'reservation:updated', restaurantId: res.restaurantId, payload: { id, status } });

    // WhatsApp confirmation (simulated) on confirm.
    if (status === 'confirmed') {
      const restaurant = restaurantService.getById(res.restaurantId);
      notificationService.send(res.restaurantId, {
        type: 'reservation_confirmed',
        recipient: res.name,
        message: `Hello ${res.name.split(' ')[0]}, your table reservation has been confirmed.\n${formatReservationSlot(res.date, res.time)} · ${res.guests} guests.\n— ${restaurant?.name ?? 'SmartDine'}`,
      });
    }
    return res;
  },

  reschedule(id: string, date: string, time: string): Reservation | undefined {
    const res = mutate((db) => {
      const r = db.reservations.find((x) => x.id === id);
      if (r) {
        r.date = date;
        r.time = time;
      }
      return r;
    });
    if (res) realtimeBus.emit({ type: 'reservation:updated', restaurantId: res.restaurantId, payload: { id, status: res.status } });
    return res;
  },
};
