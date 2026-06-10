import type { ServiceRequest, ServiceRequestType } from '@/types';
import { getDb, mutate } from '@/data/mock/store';
import { realtimeBus } from '@/data/realtime/bus';
import { makeId } from '@/lib/id';
import { tableService } from './tableService';

export const SERVICE_REQUEST_LABELS: Record<ServiceRequestType, string> = {
  waiter: 'Call Waiter',
  water: 'Request Water',
  bill: 'Request Bill',
  assistance: 'Need Assistance',
};

export const serviceRequestService = {
  open(restaurantId: string): ServiceRequest[] {
    return getDb()
      .serviceRequests.filter((s) => s.restaurantId === restaurantId && s.status === 'open')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  create(restaurantId: string, tableId: string, type: ServiceRequestType): ServiceRequest {
    const table = tableService.get(tableId);
    const req = mutate((db) => {
      const r: ServiceRequest = {
        id: makeId('svc'),
        restaurantId,
        tableId,
        tableNumber: table?.number ?? 0,
        type,
        status: 'open',
        createdAt: new Date().toISOString(),
      };
      db.serviceRequests.push(r);
      return r;
    });
    realtimeBus.emit({ type: 'service:created', restaurantId, payload: { tableNumber: req.tableNumber, kind: type } });
    return req;
  },

  resolve(id: string): void {
    const r = mutate((db) => {
      const req = db.serviceRequests.find((x) => x.id === id);
      if (req) req.status = 'resolved';
      return req;
    });
    if (r) realtimeBus.emit({ type: 'service:resolved', restaurantId: r.restaurantId, payload: { id } });
  },
};
