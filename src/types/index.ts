// ─────────────────────────────────────────────────────────────────────────────
// ToDining domain models — single source of truth for the entire app.
// Mirrors the 14 database modules from the product spec (+ service_requests,
// upsell_rules). Every tenant-scoped entity carries `restaurantId`.
// ─────────────────────────────────────────────────────────────────────────────

export type ID = string;
export type ISODate = string;

// ── Roles & staff ────────────────────────────────────────────────────────────
export type Role = 'owner' | 'manager' | 'waiter' | 'kitchen';

export interface Staff {
  id: ID;
  restaurantId: ID;
  name: string;
  email: string;
  role: Role;
  avatarColor?: string;
  active: boolean;
}

// ── Restaurant (tenant) ────────────────────────────────────────────────────────
export interface RestaurantSettings {
  taxRate: number; // e.g. 0.05 = 5%
  serviceChargeRate: number; // e.g. 0.10 = 10%
  currency: string; // ISO code, e.g. "INR"
  currencySymbol: string; // e.g. "₹"
}

export interface Restaurant {
  id: ID;
  name: string;
  slug: string;
  tagline?: string;
  logoColor: string;
  settings: RestaurantSettings;
}

// ── Tables & QR ────────────────────────────────────────────────────────────────
export type TableStatus = 'available' | 'reserved' | 'occupied';

export interface RestaurantTable {
  id: ID;
  restaurantId: ID;
  number: number;
  seats: number;
  status: TableStatus;
}

export interface QrCode {
  id: ID;
  restaurantId: ID;
  tableId: ID;
  token: string;
  /** Deep link a phone opens after scanning. */
  url: string;
}

// ── Menu ─────────────────────────────────────────────────────────────────────
export type MenuCategoryName =
  | 'Starters'
  | 'Main Course'
  | 'Desserts'
  | 'Beverages'
  | 'Combo Meals';

export interface MenuCategory {
  id: ID;
  restaurantId: ID;
  name: string;
  sort: number;
}

export interface MenuItem {
  id: ID;
  restaurantId: ID;
  categoryId: ID;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  /** Inventory ingredients consumed per unit sold (auto-deduct). */
  recipe?: { inventoryItemId: ID; qty: number }[];
  tags?: string[];
}

// ── Cart (client-only, pre-order) ──────────────────────────────────────────────
export interface CartItem {
  menuItemId: ID;
  name: string;
  price: number;
  imageUrl: string;
  qty: number;
}

// ── Orders ─────────────────────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed';

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'pending',
  'preparing',
  'ready',
  'served',
  'completed',
];

export interface OrderItem {
  id: ID;
  menuItemId: ID;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: ID;
  restaurantId: ID;
  tableId: ID;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ── Service requests (Waiter Call System) ───────────────────────────────────────
export type ServiceRequestType = 'waiter' | 'water' | 'bill' | 'assistance';
export type ServiceRequestStatus = 'open' | 'resolved';

export interface ServiceRequest {
  id: ID;
  restaurantId: ID;
  tableId: ID;
  tableNumber: number;
  type: ServiceRequestType;
  status: ServiceRequestStatus;
  createdAt: ISODate;
}

// ── Reservations ────────────────────────────────────────────────────────────────
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Reservation {
  id: ID;
  restaurantId: ID;
  name: string;
  mobile: string;
  email: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  guests: number;
  notes?: string;
  status: ReservationStatus;
  createdAt: ISODate;
}

// ── Billing ──────────────────────────────────────────────────────────────────────
export interface Bill {
  id: ID;
  restaurantId: ID;
  orderId: ID;
  tableNumber: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  grandTotal: number;
  createdAt: ISODate;
}

// ── Feedback ────────────────────────────────────────────────────────────────────
export interface Feedback {
  id: ID;
  restaurantId: ID;
  orderId?: ID;
  tableNumber?: number;
  foodRating: number; // 1..5
  serviceRating: number;
  experienceRating: number;
  comment?: string;
  createdAt: ISODate;
}

// ── Inventory ────────────────────────────────────────────────────────────────────
export interface InventoryItem {
  id: ID;
  restaurantId: ID;
  name: string;
  unit: string; // e.g. "kg", "pcs", "bottles"
  stockQty: number;
  lowThreshold: number;
}

// ── Customers ────────────────────────────────────────────────────────────────────
export interface Customer {
  id: ID;
  restaurantId: ID;
  name: string;
  mobile: string;
  email?: string;
}

// ── Upsell rules (AI-based suggestions) ──────────────────────────────────────────
export interface UpsellRule {
  id: ID;
  restaurantId: ID;
  triggerItemId: ID;
  suggestedItemId: ID;
  message: string;
}

// ── Notifications (WhatsApp etc.) ────────────────────────────────────────────────
export type NotificationChannel = 'whatsapp';
export type NotificationType =
  | 'reservation_confirmed'
  | 'reservation_reminder'
  | 'order_status'
  | 'promotional';
export type NotificationStatus = 'queued' | 'sent';

export interface Notification {
  id: ID;
  restaurantId: ID;
  channel: NotificationChannel;
  type: NotificationType;
  recipient: string; // phone / name
  message: string;
  status: NotificationStatus;
  createdAt: ISODate;
}
