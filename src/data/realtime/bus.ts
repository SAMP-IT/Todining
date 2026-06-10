// ─────────────────────────────────────────────────────────────────────────────
// Realtime event bus — simulates Supabase Realtime.
// Services emit events here when data changes; dashboards subscribe and update
// instantly. Swapping to Supabase later means pointing subscriptions at channels.
// ─────────────────────────────────────────────────────────────────────────────

export type RealtimeEvent =
  | { type: 'order:created'; restaurantId: string; payload: { orderId: string; tableNumber: number } }
  | { type: 'order:updated'; restaurantId: string; payload: { orderId: string; status: string } }
  | { type: 'service:created'; restaurantId: string; payload: { tableNumber: number; kind: string } }
  | { type: 'service:resolved'; restaurantId: string; payload: { id: string } }
  | { type: 'reservation:created'; restaurantId: string; payload: { id: string; name: string } }
  | { type: 'reservation:updated'; restaurantId: string; payload: { id: string; status: string } }
  | { type: 'table:updated'; restaurantId: string; payload: { tableId: string; status: string } }
  | { type: 'inventory:low'; restaurantId: string; payload: { name: string } }
  | { type: 'notification:created'; restaurantId: string; payload: { id: string } }
  | { type: 'data:changed'; restaurantId: string; payload: { entity: string } };

type Handler = (event: RealtimeEvent) => void;

class RealtimeBus {
  private handlers = new Set<Handler>();

  subscribe(handler: Handler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  emit(event: RealtimeEvent): void {
    // Clone the set so handlers that unsubscribe mid-iteration don't break it.
    [...this.handlers].forEach((h) => h(event));
  }
}

export const realtimeBus = new RealtimeBus();
