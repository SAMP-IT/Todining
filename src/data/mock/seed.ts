// ─────────────────────────────────────────────────────────────────────────────
// Seed data — the two production hotels this workspace ships with:
//   • "Velans"      (multi-cuisine fine dining) — owner login velans-main01
//   • "Cafe Aroma"  (cafe)                      — owner login cafe-aroma2026
//
// These are the ONLY two hotels. Each is fully isolated by restaurantId, so an
// owner who signs in only ever sees their own hotel's data. Owner accounts carry
// a hashed password (credentialed login); Manager/Waiter/Kitchen are password-
// less so they open their board directly (auth for those roles comes later).
//
// Timestamps are relative to load time so the analytics dashboard has realistic
// recent data out of the box.
// ─────────────────────────────────────────────────────────────────────────────

import type { Database } from './store';
import type {
  MenuItem,
  Order,
  OrderStatus,
  Reservation,
  RestaurantTable,
  Staff,
} from '@/types';
import { hashPassword } from '@/lib/password';

const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=500&q=70`;

function isoMinutesAgo(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString();
}
function isoDaysFromNow(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export function createSeedData(): Database {
  // ── Restaurants (the two hotels) ─────────────────────────────────────────
  const rA = 'rest_velans';
  const rB = 'rest_aroma';

  const restaurants = [
    {
      id: rA,
      name: 'Velans',
      slug: 'velans',
      tagline: 'Multi-cuisine fine dining',
      logoColor: '#d9521f',
      parentId: null,
      settings: { taxRate: 0.05, serviceChargeRate: 0.1, currency: 'INR', currencySymbol: '₹' },
    },
    {
      id: rB,
      name: 'Cafe Aroma',
      slug: 'cafe-aroma',
      tagline: 'Coffee, bites & calm',
      logoColor: '#4f8a5b',
      parentId: null,
      settings: { taxRate: 0.05, serviceChargeRate: 0.08, currency: 'INR', currencySymbol: '₹' },
    },
  ];

  // ── Staff ────────────────────────────────────────────────────────────────
  // Owners are credentialed (username + hashed password). The other three roles
  // are password-less so their Login-page quick-cards open the board directly.
  const staff: Staff[] = [
    // Velans
    { id: 'stf_owner', restaurantId: rA, name: 'Velan Raman', email: 'owner@velans.test', username: 'velans-main01', passwordHash: hashPassword('velans@2026'), role: 'owner', avatarColor: '#d9521f', active: true },
    { id: 'stf_mgr', restaurantId: rA, name: 'Vikram Shah', email: 'manager@velans.test', role: 'manager', avatarColor: '#c98a1f', active: true },
    { id: 'stf_waiter', restaurantId: rA, name: 'Ravi Kumar', email: 'waiter@velans.test', role: 'waiter', avatarColor: '#4f8a5b', active: true },
    { id: 'stf_kitchen', restaurantId: rA, name: 'Chef Meera', email: 'kitchen@velans.test', role: 'kitchen', avatarColor: '#9c3110', active: true },
    // Cafe Aroma
    { id: 'stf_owner_b', restaurantId: rB, name: 'Sara Iyer', email: 'owner@aroma.test', username: 'cafe-aroma2026', passwordHash: hashPassword('cafe@2026'), role: 'owner', avatarColor: '#4f8a5b', active: true },
    { id: 'stf_mgr_b', restaurantId: rB, name: 'Nikhil Rao', email: 'manager@aroma.test', role: 'manager', avatarColor: '#c98a1f', active: true },
    { id: 'stf_waiter_b', restaurantId: rB, name: 'Dev Menon', email: 'waiter@aroma.test', role: 'waiter', avatarColor: '#3d6e48', active: true },
    { id: 'stf_kitchen_b', restaurantId: rB, name: 'Chef Anu', email: 'kitchen@aroma.test', role: 'kitchen', avatarColor: '#9c3110', active: true },
  ];

  // ── Categories ───────────────────────────────────────────────────────────
  const catNames = ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Combo Meals'];
  const categories = [rA, rB].flatMap((rid) =>
    catNames.map((name, i) => ({ id: `cat_${rid}_${i}`, restaurantId: rid, name, sort: i })),
  );
  const cat = (rid: string, name: string) => categories.find((c) => c.restaurantId === rid && c.name === name)!.id;

  // ── Menu items ───────────────────────────────────────────────────────────
  const menuItems: MenuItem[] = [
    // Velans
    { id: 'mi_samosa', restaurantId: rA, categoryId: cat(rA, 'Starters'), name: 'Veg Samosa (2 pcs)', description: 'Crispy pastry with spiced potato & peas', price: 60, imageUrl: img('1601050690597-df0568f70950'), isAvailable: true, tags: ['veg'], recipe: [{ inventoryItemId: 'inv_a_flour', qty: 0.05 }] },
    { id: 'mi_wings', restaurantId: rA, categoryId: cat(rA, 'Starters'), name: 'Chilli Chicken', description: 'Wok-tossed chicken, garlic & green chilli', price: 220, imageUrl: img('1527477396000-e27163b481c2'), isAvailable: true, tags: ['spicy'], recipe: [{ inventoryItemId: 'inv_a_chicken', qty: 0.2 }] },
    { id: 'mi_paneer', restaurantId: rA, categoryId: cat(rA, 'Starters'), name: 'Paneer Tikka', description: 'Char-grilled cottage cheese, mint chutney', price: 240, imageUrl: img('1599487488170-d11ec9c172f0'), isAvailable: true, tags: ['veg'] },
    { id: 'mi_butter_chicken', restaurantId: rA, categoryId: cat(rA, 'Main Course'), name: 'Butter Chicken', description: 'Creamy tomato gravy, tandoori chicken', price: 320, imageUrl: img('1588166524941-3bf61a9c41db'), isAvailable: true, recipe: [{ inventoryItemId: 'inv_a_chicken', qty: 0.25 }] },
    { id: 'mi_biryani', restaurantId: rA, categoryId: cat(rA, 'Main Course'), name: 'Hyderabadi Biryani', description: 'Fragrant basmati, slow-cooked spices', price: 280, imageUrl: img('1563379091339-03b21ab4a4f8'), isAvailable: true, recipe: [{ inventoryItemId: 'inv_a_rice', qty: 0.2 }] },
    { id: 'mi_dal', restaurantId: rA, categoryId: cat(rA, 'Main Course'), name: 'Dal Makhani', description: 'Black lentils simmered overnight', price: 210, imageUrl: img('1546833999-b9f581a1996d'), isAvailable: true, tags: ['veg'] },
    { id: 'mi_naan', restaurantId: rA, categoryId: cat(rA, 'Main Course'), name: 'Garlic Naan', description: 'Tandoor flatbread, fresh garlic & butter', price: 60, imageUrl: img('1601050690597-df0568f70950'), isAvailable: false, tags: ['veg'] },
    { id: 'mi_gulab', restaurantId: rA, categoryId: cat(rA, 'Desserts'), name: 'Gulab Jamun (2 pcs)', description: 'Warm milk dumplings in rose syrup', price: 90, imageUrl: img('1606313564200-e75d5e30476c'), isAvailable: true, tags: ['veg'] },
    { id: 'mi_kulfi', restaurantId: rA, categoryId: cat(rA, 'Desserts'), name: 'Pista Kulfi', description: 'Slow-churned saffron-pistachio ice cream', price: 120, imageUrl: img('1497034825429-c343d7c6a68f'), isAvailable: true },
    { id: 'mi_lassi', restaurantId: rA, categoryId: cat(rA, 'Beverages'), name: 'Sweet Lassi', description: 'Whipped yoghurt, cardamom', price: 80, imageUrl: img('1622597467836-f3285f2131b8'), isAvailable: true },
    { id: 'mi_masala_chai', restaurantId: rA, categoryId: cat(rA, 'Beverages'), name: 'Masala Chai', description: 'Spiced milk tea', price: 40, imageUrl: img('1571934811356-5cc061b6821f'), isAvailable: true, recipe: [{ inventoryItemId: 'inv_a_milk', qty: 0.15 }] },
    { id: 'mi_coke_a', restaurantId: rA, categoryId: cat(rA, 'Beverages'), name: 'Coke', description: 'Chilled 300ml', price: 49, imageUrl: img('1554866585-cd94860890b7'), isAvailable: true, recipe: [{ inventoryItemId: 'inv_a_soft', qty: 1 }] },
    { id: 'mi_combo_a', restaurantId: rA, categoryId: cat(rA, 'Combo Meals'), name: 'Biryani Combo', description: 'Biryani + Coke + Gulab Jamun', price: 360, imageUrl: img('1563379091339-03b21ab4a4f8'), isAvailable: true },

    // Cafe Aroma
    { id: 'mi_fries', restaurantId: rB, categoryId: cat(rB, 'Starters'), name: 'Peri Peri Fries', description: 'Crispy fries tossed in peri peri', price: 99, imageUrl: img('1573080496219-bb080dd4f877'), isAvailable: true, tags: ['veg'] },
    { id: 'mi_nachos', restaurantId: rB, categoryId: cat(rB, 'Starters'), name: 'Loaded Nachos', description: 'Cheese, salsa, jalapeños', price: 180, imageUrl: img('1513456852971-30c0b8199d4d'), isAvailable: true, tags: ['veg'] },
    { id: 'mi_burger', restaurantId: rB, categoryId: cat(rB, 'Main Course'), name: 'Classic Burger', description: 'Juicy patty, cheddar, house sauce', price: 199, imageUrl: img('1568901346375-23c9450c58cd'), isAvailable: true, recipe: [{ inventoryItemId: 'inv_b_buns', qty: 1 }] },
    { id: 'mi_pizza', restaurantId: rB, categoryId: cat(rB, 'Main Course'), name: 'Margherita Pizza', description: 'San Marzano, mozzarella, basil', price: 320, imageUrl: img('1513104890138-7c749659a591'), isAvailable: true, tags: ['veg'] },
    { id: 'mi_pasta', restaurantId: rB, categoryId: cat(rB, 'Main Course'), name: 'Alfredo Pasta', description: 'Creamy parmesan, cracked pepper', price: 260, imageUrl: img('1551183053-bf91a1d81141'), isAvailable: true, tags: ['veg'] },
    { id: 'mi_brownie', restaurantId: rB, categoryId: cat(rB, 'Desserts'), name: 'Choco Lava Cake', description: 'Molten centre, vanilla scoop', price: 150, imageUrl: img('1606313564200-e75d5e30476c'), isAvailable: true },
    { id: 'mi_cheesecake', restaurantId: rB, categoryId: cat(rB, 'Desserts'), name: 'Blueberry Cheesecake', description: 'New York style, berry compote', price: 180, imageUrl: img('1578985545062-69928b1d9587'), isAvailable: true },
    { id: 'mi_latte', restaurantId: rB, categoryId: cat(rB, 'Beverages'), name: 'Caffè Latte', description: 'Double shot, silky milk', price: 130, imageUrl: img('1509042239860-f550ce710b93'), isAvailable: true, recipe: [{ inventoryItemId: 'inv_b_coffee', qty: 0.02 }] },
    { id: 'mi_coke_b', restaurantId: rB, categoryId: cat(rB, 'Beverages'), name: 'Coke', description: 'Chilled 300ml', price: 49, imageUrl: img('1554866585-cd94860890b7'), isAvailable: true },
    { id: 'mi_combo_b', restaurantId: rB, categoryId: cat(rB, 'Combo Meals'), name: 'Burger Combo', description: 'Burger + Fries + Coke', price: 299, imageUrl: img('1568901346375-23c9450c58cd'), isAvailable: true },
  ];

  // ── Upsell rules ──────────────────────────────────────────────────────────
  const upsellRules = [
    { id: 'up_1', restaurantId: rA, triggerItemId: 'mi_butter_chicken', suggestedItemId: 'mi_naan', message: 'Add Garlic Naan for ₹60?' },
    { id: 'up_2', restaurantId: rA, triggerItemId: 'mi_biryani', suggestedItemId: 'mi_coke_a', message: 'Add a Coke for ₹49?' },
    { id: 'up_3', restaurantId: rA, triggerItemId: 'mi_wings', suggestedItemId: 'mi_lassi', message: 'Cool it down with a Sweet Lassi for ₹80?' },
    { id: 'up_4', restaurantId: rB, triggerItemId: 'mi_burger', suggestedItemId: 'mi_fries', message: 'Add Peri Peri Fries for ₹99?' },
    { id: 'up_5', restaurantId: rB, triggerItemId: 'mi_pizza', suggestedItemId: 'mi_coke_b', message: 'Add a Coke for ₹49?' },
  ];

  // ── Tables & QR ─────────────────────────────────────────────────────────
  const makeTables = (rid: string, count: number): RestaurantTable[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `tbl_${rid}_${i + 1}`,
      restaurantId: rid,
      number: i + 1,
      seats: i % 3 === 0 ? 2 : 4,
      status: 'available' as const,
    }));
  const tables = [...makeTables(rA, 8), ...makeTables(rB, 6)];
  tables[2].status = 'occupied';
  tables[4].status = 'reserved';
  tables[9].status = 'occupied';

  const qrCodes = tables.map((t) => ({
    id: `qr_${t.id}`,
    restaurantId: t.restaurantId,
    tableId: t.id,
    token: t.id,
    url: `/r/${restaurants.find((r) => r.id === t.restaurantId)!.slug}/t/${t.id}`,
  }));

  // ── Inventory ───────────────────────────────────────────────────────────
  const inventory = [
    { id: 'inv_a_chicken', restaurantId: rA, name: 'Chicken', unit: 'kg', stockQty: 12, lowThreshold: 5 },
    { id: 'inv_a_rice', restaurantId: rA, name: 'Basmati Rice', unit: 'kg', stockQty: 30, lowThreshold: 8 },
    { id: 'inv_a_flour', restaurantId: rA, name: 'Flour', unit: 'kg', stockQty: 4, lowThreshold: 5 },
    { id: 'inv_a_milk', restaurantId: rA, name: 'Milk', unit: 'L', stockQty: 18, lowThreshold: 6 },
    { id: 'inv_a_soft', restaurantId: rA, name: 'Soft Drinks', unit: 'cans', stockQty: 40, lowThreshold: 12 },
    { id: 'inv_b_buns', restaurantId: rB, name: 'Burger Buns', unit: 'pcs', stockQty: 26, lowThreshold: 10 },
    { id: 'inv_b_coffee', restaurantId: rB, name: 'Coffee Beans', unit: 'kg', stockQty: 3, lowThreshold: 4 },
    { id: 'inv_b_cheese', restaurantId: rB, name: 'Cheese', unit: 'kg', stockQty: 7, lowThreshold: 3 },
  ];

  // ── Orders (recent, for dashboards + analytics) ───────────────────────────
  const item = (id: string) => menuItems.find((m) => m.id === id)!;
  function buildOrder(id: string, rid: string, tableId: string, tableNumber: number, lines: [string, number][], status: OrderStatus, minAgo: number): Order {
    const taxRate = restaurants.find((r) => r.id === rid)!.settings.taxRate;
    const scRate = restaurants.find((r) => r.id === rid)!.settings.serviceChargeRate;
    const orderItems = lines.map(([mid, qty], i) => {
      const m = item(mid);
      return { id: `oi_${id}_${i}`, menuItemId: mid, name: m.name, qty, unitPrice: m.price };
    });
    const subtotal = orderItems.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    const tax = Math.round(subtotal * taxRate);
    const serviceCharge = Math.round(subtotal * scRate);
    return {
      id, restaurantId: rid, tableId, tableNumber, sessionId: `sess_${id}`,
      items: orderItems, status,
      subtotal, tax, serviceCharge, total: subtotal + tax + serviceCharge,
      createdAt: isoMinutesAgo(minAgo), updatedAt: isoMinutesAgo(Math.max(0, minAgo - 5)),
    };
  }
  const orders: Order[] = [
    buildOrder('ord_1', rA, 'tbl_rest_velans_3', 3, [['mi_butter_chicken', 1], ['mi_naan', 2], ['mi_coke_a', 2]], 'preparing', 8),
    buildOrder('ord_2', rA, 'tbl_rest_velans_1', 1, [['mi_biryani', 2], ['mi_lassi', 2]], 'pending', 3),
    buildOrder('ord_3', rA, 'tbl_rest_velans_6', 6, [['mi_paneer', 1], ['mi_dal', 1], ['mi_masala_chai', 2]], 'ready', 14),
    buildOrder('ord_4', rA, 'tbl_rest_velans_2', 2, [['mi_samosa', 2], ['mi_wings', 1]], 'completed', 180),
    buildOrder('ord_5', rA, 'tbl_rest_velans_4', 4, [['mi_combo_a', 2]], 'completed', 320),
    buildOrder('ord_6', rA, 'tbl_rest_velans_5', 5, [['mi_butter_chicken', 1], ['mi_gulab', 1]], 'completed', 1440),
    buildOrder('ord_7', rB, 'tbl_rest_aroma_2', 2, [['mi_burger', 2], ['mi_fries', 1], ['mi_coke_b', 2]], 'preparing', 6),
    buildOrder('ord_8', rB, 'tbl_rest_aroma_4', 4, [['mi_pizza', 1], ['mi_latte', 2]], 'served', 22),
  ];

  // ── Reservations ──────────────────────────────────────────────────────────
  const reservations: Reservation[] = [
    { id: 'res_1', restaurantId: rA, name: 'Arun Nair', mobile: '+91 98765 43210', email: 'arun@mail.test', date: isoDaysFromNow(0), time: '19:00', guests: 4, notes: 'Window seat please', status: 'confirmed', createdAt: isoMinutesAgo(120) },
    { id: 'res_2', restaurantId: rA, name: 'Priya Das', mobile: '+91 90000 11111', email: 'priya@mail.test', date: isoDaysFromNow(1), time: '20:30', guests: 2, status: 'pending', createdAt: isoMinutesAgo(40) },
    { id: 'res_3', restaurantId: rA, name: 'Karthik R', mobile: '+91 91234 56789', email: 'k@mail.test', date: isoDaysFromNow(2), time: '13:00', guests: 6, notes: 'Birthday', status: 'pending', createdAt: isoMinutesAgo(15) },
    { id: 'res_4', restaurantId: rB, name: 'Neha Sharma', mobile: '+91 99887 76655', email: 'neha@mail.test', date: isoDaysFromNow(0), time: '18:00', guests: 3, status: 'confirmed', createdAt: isoMinutesAgo(200) },
  ];

  // ── Service requests ──────────────────────────────────────────────────────
  const serviceRequests = [
    { id: 'svc_1', restaurantId: rA, tableId: 'tbl_rest_velans_3', tableNumber: 3, type: 'water' as const, status: 'open' as const, createdAt: isoMinutesAgo(2) },
  ];

  // ── Feedback ────────────────────────────────────────────────────────────
  const feedback = [
    { id: 'fb_1', restaurantId: rA, orderId: 'ord_4', tableNumber: 2, foodRating: 5, serviceRating: 4, experienceRating: 5, comment: 'Butter chicken was incredible!', createdAt: isoMinutesAgo(160) },
    { id: 'fb_2', restaurantId: rA, orderId: 'ord_6', tableNumber: 5, foodRating: 4, serviceRating: 5, experienceRating: 4, comment: 'Lovely ambience.', createdAt: isoMinutesAgo(1400) },
    { id: 'fb_3', restaurantId: rB, orderId: 'ord_8', tableNumber: 4, foodRating: 5, serviceRating: 5, experienceRating: 5, comment: 'Best latte in town.', createdAt: isoMinutesAgo(20) },
  ];

  // ── Notifications ─────────────────────────────────────────────────────────
  const notifications = [
    { id: 'ntf_1', restaurantId: rA, channel: 'whatsapp' as const, type: 'reservation_confirmed' as const, recipient: 'Arun Nair', message: 'Hello Arun, your table reservation has been confirmed. Date: Today · Time: 7:00 PM. — Velans', status: 'sent' as const, createdAt: isoMinutesAgo(118) },
  ];

  const customers = [
    { id: 'cus_1', restaurantId: rA, name: 'Arun Nair', mobile: '+91 98765 43210', email: 'arun@mail.test' },
  ];

  const bill1CreatedAt = isoMinutesAgo(175);
  const bills = [
    {
      id: 'bill_1', restaurantId: rA, invoiceNumber: `INV-${bill1CreatedAt.slice(0, 4)}-0001`,
      sessionId: 'sess_ord_4', orderId: 'ord_4', tableNumber: 2,
      items: orders.find((o) => o.id === 'ord_4')!.items,
      subtotal: orders.find((o) => o.id === 'ord_4')!.subtotal,
      tax: orders.find((o) => o.id === 'ord_4')!.tax,
      serviceCharge: orders.find((o) => o.id === 'ord_4')!.serviceCharge,
      grandTotal: orders.find((o) => o.id === 'ord_4')!.total,
      createdAt: bill1CreatedAt,
    },
  ];

  return {
    restaurants,
    staff,
    tables,
    qrCodes,
    categories,
    menuItems,
    orders,
    serviceRequests,
    reservations,
    bills,
    feedback,
    inventory,
    customers,
    upsellRules,
    notifications,
  };
}
