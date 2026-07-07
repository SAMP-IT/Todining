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
  /** Optional alternate login handle (hotel owners created via the workspace form). */
  username?: string;
  /** One-way hash of the login password (see src/lib/password.ts). Demo-grade —
   *  production must move auth to Supabase Auth. Absent for seeded demo staff. */
  passwordHash?: string;
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
  /** Longer free-text blurb shown on the workspace card. */
  description?: string;
  logoColor: string;
  /** Optional uploaded/hosted logo image. Falls back to the colored initial. */
  logoUrl?: string;
  /** Branch support: a branch points at its parent hotel via parentId.
   *  null/undefined === a top-level hotel (whose own data is its "Main Branch"). */
  parentId?: ID | null;
  /** Branch-identity fields (captured by the Create Branch form; null on hotels
   *  unless filled). A branch is a Restaurant — these just describe it. */
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  manager?: string;
  /** Branch operational state. Defaults to 'active'. */
  status?: 'active' | 'inactive';
  /** Tenant audit columns (Step 9). */
  createdBy?: ID;
  createdAt?: ISODate;
  updatedAt?: ISODate;
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
  /** The dining session this order belongs to. Every order placed on the same
   *  table before "Complete Dining" shares one sessionId, so they bill together
   *  as a single session (see DiningSession). Legacy rows fall back to their own
   *  id, keeping each pre-session order its own one-order session. */
  sessionId: ID;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ── Dining session (table session) ───────────────────────────────────────────
// A derived aggregate, not a stored table: the customer scans a QR, orders one
// or more times on the same table, and the whole visit is ONE session. The
// session stays open (customer still dining, no bill) until "Complete Dining",
// which closes it, completes every order in it and generates exactly one bill.
export type DiningSessionStatus = 'active' | 'closed';

export interface DiningSession {
  /** Equals the shared Order.sessionId. */
  id: ID;
  restaurantId: ID;
  tableId: ID;
  tableNumber: number;
  /** Every order placed during the visit, oldest first. */
  orders: Order[];
  /** All order lines across the session, in order. */
  items: OrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  /** 'active' while dining; 'closed' once a bill has been generated. */
  status: DiningSessionStatus;
  /** Set once the session is billed. */
  billId?: ID;
  openedAt: ISODate;
  closedAt?: ISODate;
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
  /** Permanent, human-readable invoice number — `INV-<year>-<0000>`, unique per
   *  restaurant. Assigned once when the bill is generated and stored in the DB;
   *  never recalculated. Distinct from `id`, which stays the internal key.
   *  Optional only so rows predating the invoice_number column still hydrate. */
  invoiceNumber?: ID;
  /** The dining session this bill settles. One bill per session. */
  sessionId?: ID;
  /** Representative order of the session (the first one placed). Kept for
   *  back-compat with per-order lookups and legacy single-order bills. */
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
