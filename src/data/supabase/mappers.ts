// ─────────────────────────────────────────────────────────────────────────────
// Row mappers — translate between the app's camelCase domain objects and
// Supabase's snake_case rows. One spec per cache table; the store drives
// hydration, write-through and realtime generically off this registry.
//
// SPECS is ordered to satisfy foreign-key dependencies on insert (restaurants
// before everything, menu_items before upsell_rules, orders before order_items…).
// ─────────────────────────────────────────────────────────────────────────────
import type {
  Bill, Customer, Feedback, InventoryItem, MenuCategory, MenuItem, Notification,
  Order, OrderItem, QrCode, Reservation, Restaurant, RestaurantTable,
  ServiceRequest, Staff, UpsellRule,
} from '@/types';
import type { Database } from '@/data/mock/store';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;
const num = (v: any): number => (v == null ? 0 : Number(v));

export interface TableSpec<T = any> {
  /** Key of the array in the in-memory Database cache. */
  dbKey: keyof Database;
  /** Supabase table name. */
  table: string;
  toRow(obj: T): Row;
  fromRow(row: Row): T;
}

const restaurants: TableSpec<Restaurant> = {
  dbKey: 'restaurants',
  table: 'restaurants',
  toRow: (r) => ({
    id: r.id, name: r.name, slug: r.slug, tagline: r.tagline ?? null,
    description: r.description ?? null, logo_color: r.logoColor, logo_url: r.logoUrl ?? null,
    parent_id: r.parentId ?? null, created_by: r.createdBy ?? null,
    created_at: r.createdAt ?? null, updated_at: r.updatedAt ?? null,
    code: r.code ?? null, address: r.address ?? null, phone: r.phone ?? null,
    email: r.email ?? null, manager: r.manager ?? null, status: r.status ?? 'active',
    tax_rate: r.settings.taxRate, service_charge_rate: r.settings.serviceChargeRate,
    currency: r.settings.currency, currency_symbol: r.settings.currencySymbol,
  }),
  fromRow: (row) => ({
    id: row.id, name: row.name, slug: row.slug, tagline: row.tagline ?? undefined,
    description: row.description ?? undefined,
    logoColor: row.logo_color ?? '#d9521f', logoUrl: row.logo_url ?? undefined,
    parentId: row.parent_id ?? null, createdBy: row.created_by ?? undefined,
    createdAt: row.created_at ?? undefined, updatedAt: row.updated_at ?? undefined,
    code: row.code ?? undefined, address: row.address ?? undefined, phone: row.phone ?? undefined,
    email: row.email ?? undefined, manager: row.manager ?? undefined,
    status: (row.status ?? 'active') as 'active' | 'inactive',
    settings: {
      taxRate: num(row.tax_rate), serviceChargeRate: num(row.service_charge_rate),
      currency: row.currency, currencySymbol: row.currency_symbol,
    },
  }),
};

const staff: TableSpec<Staff> = {
  dbKey: 'staff',
  table: 'staff',
  toRow: (s) => ({
    id: s.id, restaurant_id: s.restaurantId, name: s.name, email: s.email,
    username: s.username ?? null, password_hash: s.passwordHash ?? null,
    role: s.role, avatar_color: s.avatarColor ?? null, active: s.active,
  }),
  fromRow: (row) => ({
    id: row.id, restaurantId: row.restaurant_id, name: row.name, email: row.email,
    username: row.username ?? undefined, passwordHash: row.password_hash ?? undefined,
    role: row.role, avatarColor: row.avatar_color ?? undefined, active: row.active,
  }),
};

const categories: TableSpec<MenuCategory> = {
  dbKey: 'categories',
  table: 'menu_categories',
  toRow: (c) => ({ id: c.id, restaurant_id: c.restaurantId, name: c.name, sort: c.sort }),
  fromRow: (row) => ({ id: row.id, restaurantId: row.restaurant_id, name: row.name, sort: row.sort }),
};

const menuItems: TableSpec<MenuItem> = {
  dbKey: 'menuItems',
  table: 'menu_items',
  toRow: (m) => ({
    id: m.id, restaurant_id: m.restaurantId, category_id: m.categoryId,
    name: m.name, description: m.description, price: m.price,
    image_url: m.imageUrl, is_available: m.isAvailable, tags: m.tags ?? [],
  }),
  fromRow: (row) => ({
    id: row.id, restaurantId: row.restaurant_id, categoryId: row.category_id,
    name: row.name, description: row.description ?? '', price: num(row.price),
    imageUrl: row.image_url ?? '', isAvailable: row.is_available, tags: row.tags ?? [],
  }),
};

const tables: TableSpec<RestaurantTable> = {
  dbKey: 'tables',
  table: 'tables',
  toRow: (t) => ({ id: t.id, restaurant_id: t.restaurantId, number: t.number, seats: t.seats, status: t.status }),
  fromRow: (row) => ({ id: row.id, restaurantId: row.restaurant_id, number: row.number, seats: row.seats, status: row.status }),
};

const qrCodes: TableSpec<QrCode> = {
  dbKey: 'qrCodes',
  table: 'qr_codes',
  toRow: (q) => ({ id: q.id, restaurant_id: q.restaurantId, table_id: q.tableId, token: q.token, url: q.url }),
  fromRow: (row) => ({ id: row.id, restaurantId: row.restaurant_id, tableId: row.table_id, token: row.token, url: row.url }),
};

const inventory: TableSpec<InventoryItem> = {
  dbKey: 'inventory',
  table: 'inventory_items',
  toRow: (i) => ({ id: i.id, restaurant_id: i.restaurantId, name: i.name, unit: i.unit, stock_qty: i.stockQty, low_threshold: i.lowThreshold }),
  fromRow: (row) => ({ id: row.id, restaurantId: row.restaurant_id, name: row.name, unit: row.unit, stockQty: num(row.stock_qty), lowThreshold: num(row.low_threshold) }),
};

const upsellRules: TableSpec<UpsellRule> = {
  dbKey: 'upsellRules',
  table: 'upsell_rules',
  toRow: (u) => ({ id: u.id, restaurant_id: u.restaurantId, trigger_item_id: u.triggerItemId, suggested_item_id: u.suggestedItemId, message: u.message }),
  fromRow: (row) => ({ id: row.id, restaurantId: row.restaurant_id, triggerItemId: row.trigger_item_id, suggestedItemId: row.suggested_item_id, message: row.message }),
};

const customers: TableSpec<Customer> = {
  dbKey: 'customers',
  table: 'customers',
  toRow: (c) => ({ id: c.id, restaurant_id: c.restaurantId, name: c.name, mobile: c.mobile, email: c.email ?? null }),
  fromRow: (row) => ({ id: row.id, restaurantId: row.restaurant_id, name: row.name, mobile: row.mobile, email: row.email ?? undefined }),
};

// Orders are mapped flat here; their embedded `items` are synced to the
// `order_items` child table separately (see orderItemsToRows / order hydration).
const orders: TableSpec<Order> = {
  dbKey: 'orders',
  table: 'orders',
  toRow: (o) => ({
    id: o.id, restaurant_id: o.restaurantId, table_id: o.tableId, table_number: o.tableNumber,
    session_id: o.sessionId, status: o.status, subtotal: o.subtotal, tax: o.tax,
    service_charge: o.serviceCharge, total: o.total, created_at: o.createdAt, updated_at: o.updatedAt,
  }),
  fromRow: (row) => ({
    id: row.id, restaurantId: row.restaurant_id, tableId: row.table_id, tableNumber: row.table_number,
    // Legacy rows predating dining sessions fall back to their own id, so each is
    // its own single-order session and nothing breaks.
    sessionId: row.session_id ?? row.id,
    items: [], status: row.status, subtotal: num(row.subtotal), tax: num(row.tax),
    serviceCharge: num(row.service_charge), total: num(row.total),
    createdAt: row.created_at, updatedAt: row.updated_at,
  }),
};

const serviceRequests: TableSpec<ServiceRequest> = {
  dbKey: 'serviceRequests',
  table: 'service_requests',
  toRow: (s) => ({ id: s.id, restaurant_id: s.restaurantId, table_id: s.tableId, table_number: s.tableNumber, type: s.type, status: s.status, created_at: s.createdAt }),
  fromRow: (row) => ({ id: row.id, restaurantId: row.restaurant_id, tableId: row.table_id, tableNumber: row.table_number, type: row.type, status: row.status, createdAt: row.created_at }),
};

const reservations: TableSpec<Reservation> = {
  dbKey: 'reservations',
  table: 'reservations',
  toRow: (r) => ({ id: r.id, restaurant_id: r.restaurantId, name: r.name, mobile: r.mobile, email: r.email, date: r.date, time: r.time, guests: r.guests, notes: r.notes ?? null, status: r.status, created_at: r.createdAt }),
  fromRow: (row) => ({ id: row.id, restaurantId: row.restaurant_id, name: row.name, mobile: row.mobile, email: row.email, date: row.date, time: typeof row.time === 'string' ? row.time.slice(0, 5) : row.time, guests: row.guests, notes: row.notes ?? undefined, status: row.status, createdAt: row.created_at }),
};

const bills: TableSpec<Bill> = {
  dbKey: 'bills',
  table: 'bills',
  toRow: (b) => ({ id: b.id, restaurant_id: b.restaurantId, invoice_number: b.invoiceNumber ?? null, session_id: b.sessionId ?? null, order_id: b.orderId, table_number: b.tableNumber, subtotal: b.subtotal, tax: b.tax, service_charge: b.serviceCharge, grand_total: b.grandTotal, created_at: b.createdAt }),
  fromRow: (row) => ({ id: row.id, restaurantId: row.restaurant_id, invoiceNumber: row.invoice_number ?? undefined, sessionId: row.session_id ?? undefined, orderId: row.order_id, tableNumber: row.table_number, items: [], subtotal: num(row.subtotal), tax: num(row.tax), serviceCharge: num(row.service_charge), grandTotal: num(row.grand_total), createdAt: row.created_at }),
};

const feedback: TableSpec<Feedback> = {
  dbKey: 'feedback',
  table: 'feedback',
  toRow: (f) => ({ id: f.id, restaurant_id: f.restaurantId, order_id: f.orderId ?? null, table_number: f.tableNumber ?? null, food_rating: f.foodRating, service_rating: f.serviceRating, experience_rating: f.experienceRating, comment: f.comment ?? null, created_at: f.createdAt }),
  fromRow: (row) => ({ id: row.id, restaurantId: row.restaurant_id, orderId: row.order_id ?? undefined, tableNumber: row.table_number ?? undefined, foodRating: row.food_rating, serviceRating: row.service_rating, experienceRating: row.experience_rating, comment: row.comment ?? undefined, createdAt: row.created_at }),
};

const notifications: TableSpec<Notification> = {
  dbKey: 'notifications',
  table: 'notifications',
  toRow: (n) => ({ id: n.id, restaurant_id: n.restaurantId, channel: n.channel, type: n.type, recipient: n.recipient, message: n.message, status: n.status, created_at: n.createdAt }),
  fromRow: (row) => ({ id: row.id, restaurantId: row.restaurant_id, channel: row.channel, type: row.type, recipient: row.recipient, message: row.message, status: row.status, createdAt: row.created_at }),
};

/** FK-safe insertion order. */
export const SPECS: TableSpec[] = [
  restaurants, staff, categories, menuItems, tables, qrCodes, inventory,
  upsellRules, customers, orders, serviceRequests, reservations, bills,
  feedback, notifications,
];

/** Lookup a spec by its Supabase table name (used by the realtime router). */
export const SPEC_BY_TABLE: Record<string, TableSpec> = Object.fromEntries(
  SPECS.map((s) => [s.table, s]),
);

// ── order_items child table ──────────────────────────────────────────────────
export const ORDER_ITEMS_TABLE = 'order_items';

export function orderItemsToRows(order: Order): Row[] {
  return order.items.map((it: OrderItem) => ({
    id: it.id, order_id: order.id, menu_item_id: it.menuItemId,
    name: it.name, qty: it.qty, unit_price: it.unitPrice,
  }));
}

export function orderItemFromRow(row: Row): OrderItem & { orderId: string } {
  return { id: row.id, orderId: row.order_id, menuItemId: row.menu_item_id, name: row.name, qty: row.qty, unitPrice: num(row.unit_price) };
}
