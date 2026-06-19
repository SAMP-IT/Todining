import { useEffect, useRef } from 'react';
import { realtimeBus, type RealtimeEvent } from '@/data/realtime/bus';

/**
 * Subscribe to realtime events, optionally filtered by restaurant + event types.
 * The handler ref is kept current so consumers don't need to memoize it.
 */
export function useRealtime(
  handler: (event: RealtimeEvent) => void,
  options?: { restaurantId?: string; types?: RealtimeEvent['type'][] },
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const restaurantId = options?.restaurantId;
  const types = options?.types?.join(',');

  useEffect(() => {
    const typeList = types ? (types.split(',') as RealtimeEvent['type'][]) : undefined;
    return realtimeBus.subscribe((event) => {
      // '*' is a broadcast (cross-tab sync / full reset) — it must reach every
      // subscriber regardless of the restaurant filter.
      if (restaurantId && event.restaurantId !== restaurantId && event.restaurantId !== '*') return;
      if (typeList && !typeList.includes(event.type)) return;
      handlerRef.current(event);
    });
  }, [restaurantId, types]);
}
