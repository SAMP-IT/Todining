import type { OrderStatus, ReservationStatus, TableStatus } from '@/types';
import { Badge, type BadgeProps } from './Badge';

const ORDER_TONE: Record<OrderStatus, BadgeProps['tone']> = {
  pending: 'gold',
  preparing: 'ember',
  ready: 'blue',
  served: 'sage',
  completed: 'neutral',
};

const RES_TONE: Record<ReservationStatus, BadgeProps['tone']> = {
  pending: 'gold',
  confirmed: 'sage',
  cancelled: 'red',
  completed: 'neutral',
};

const TABLE_TONE: Record<TableStatus, BadgeProps['tone']> = {
  available: 'sage',
  reserved: 'gold',
  occupied: 'red',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_TONE[status]} dot>{cap(status)}</Badge>;
}

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  return <Badge tone={RES_TONE[status]} dot>{cap(status)}</Badge>;
}

export function TableStatusBadge({ status }: { status: TableStatus }) {
  return <Badge tone={TABLE_TONE[status]} dot>{cap(status)}</Badge>;
}
