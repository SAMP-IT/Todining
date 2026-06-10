import { useReducer } from 'react';
import { useRealtime } from './useRealtime';
import type { RealtimeEvent } from '@/data/realtime/bus';

/**
 * Run a synchronous service selector and re-run it whenever a matching realtime
 * event fires. This is how dashboards stay live: the store is synchronous, so we
 * just force a re-render and re-read on the events we care about.
 */
export function useLiveQuery<T>(
  selector: () => T,
  options?: { restaurantId?: string; types?: RealtimeEvent['type'][] },
): T {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useRealtime(() => force(), options);
  return selector();
}
