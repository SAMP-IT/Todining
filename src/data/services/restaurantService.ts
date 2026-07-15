import type {
  MenuCategory, QrCode, Restaurant, RestaurantSettings, RestaurantTable, Role, Staff,
} from '@/types';
import { getDb, mutate, type Database } from '@/data/mock/store';
import { realtimeBus } from '@/data/realtime/bus';
import { makeId } from '@/lib/id';
import { hashPassword } from '@/lib/password';

const DEFAULT_SETTINGS: RestaurantSettings = {
  taxRate: 0.05,
  serviceChargeRate: 0.1,
  currency: 'INR',
  currencySymbol: '₹',
};

// The five standard categories every new hotel starts with (matches the seed).
const DEFAULT_CATEGORIES = ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Combo Meals'];
const DEFAULT_TABLE_COUNT = 4;

/** kebab-case a hotel name, guaranteeing uniqueness against existing slugs. */
function makeUniqueSlug(name: string): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'hotel';
  const taken = new Set(getDb().restaurants.map((r) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export interface CreateHotelInput {
  name: string;
  /** Owner login email (required — used for sign-in). */
  ownerEmail: string;
  /** Optional alternate login handle. */
  ownerUsername?: string;
  /** Owner display name (defaults to "<Hotel> Owner"). */
  ownerName?: string;
  /** Plaintext password for the owner account (hashed before storage). */
  password?: string;
  tagline?: string;
  description?: string;
  logoColor?: string;
  logoUrl?: string;
}

export interface CreateHotelResult {
  restaurant: Restaurant;
  owner: Staff;
}

export interface CreateBranchInput {
  /** Parent hotel this branch belongs to. */
  hotelId: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  /** Branch manager display name (free text — not a login account). */
  manager?: string;
  description?: string;
  status?: 'active' | 'inactive';
  /** Optional brand colour; defaults to the parent hotel's colour. */
  logoColor?: string;
}

/** Provision the default data every new workspace (hotel or branch) starts with:
 *  the five standard menu categories and a handful of tables, each with a QR. */
function provisionDefaults(db: Database, restaurantId: string, slug: string): void {
  DEFAULT_CATEGORIES.forEach((name, i) => {
    const category: MenuCategory = { id: makeId('cat'), restaurantId, name, sort: i };
    db.categories.push(category);
  });
  for (let i = 1; i <= DEFAULT_TABLE_COUNT; i += 1) {
    const table: RestaurantTable = {
      id: makeId('tbl'), restaurantId, number: i, seats: i % 3 === 0 ? 2 : 4, status: 'available',
    };
    db.tables.push(table);
    const qr: QrCode = {
      id: makeId('qr'), restaurantId, tableId: table.id, token: table.id, url: `/r/${slug}/t/${table.id}`,
    };
    db.qrCodes.push(qr);
  }
}

export const restaurantService = {
  list(): Restaurant[] {
    return getDb().restaurants;
  },
  /** Top-level hotels only (parentId === null). The workspace manager lists these. */
  listHotels(): Restaurant[] {
    return getDb().restaurants.filter((r) => !r.parentId);
  },
  /** Child branches of a hotel, in creation order. */
  listBranches(hotelId: string): Restaurant[] {
    return getDb().restaurants.filter((r) => r.parentId === hotelId);
  },
  getById(id: string): Restaurant | undefined {
    return getDb().restaurants.find((r) => r.id === id);
  },
  getBySlug(slug: string): Restaurant | undefined {
    return getDb().restaurants.find((r) => r.slug === slug);
  },

  /**
   * Provision a brand-new hotel workspace: the restaurant row + default settings,
   * the five default menu categories, a handful of tables (each with a QR), and
   * an owner staff account with login credentials. Everything is scoped to the
   * new hotel id so the data is isolated from every other workspace from birth.
   */
  create(input: CreateHotelInput): CreateHotelResult {
    const now = new Date().toISOString();
    const id = makeId('rest');
    const slug = makeUniqueSlug(input.name);
    const ownerId = makeId('stf');

    console.info('[ToDining][hotel] Creating workspace…', { id, slug, name: input.name });

    const result = mutate((db) => {
      const restaurant: Restaurant = {
        id,
        name: input.name.trim(),
        slug,
        tagline: input.tagline?.trim() || undefined,
        description: input.description?.trim() || undefined,
        logoColor: input.logoColor || '#c0451c',
        logoUrl: input.logoUrl || undefined,
        parentId: null,
        createdBy: ownerId,
        createdAt: now,
        updatedAt: now,
        settings: { ...DEFAULT_SETTINGS },
      };
      db.restaurants.push(restaurant);

      const owner: Staff = {
        id: ownerId,
        restaurantId: id,
        name: input.ownerName?.trim() || `${restaurant.name} Owner`,
        email: input.ownerEmail.trim().toLowerCase(),
        username: input.ownerUsername?.trim() || undefined,
        passwordHash: input.password ? hashPassword(input.password) : undefined,
        role: 'owner' as Role,
        avatarColor: restaurant.logoColor,
        active: true,
      };
      db.staff.push(owner);

      provisionDefaults(db, id, slug);

      return { restaurant, owner };
    });

    console.info('[ToDining][hotel] Workspace created, write-through queued:', id);
    // 'all' makes the TenantProvider, workspace dashboard, switcher and every
    // live query re-read so the new hotel card appears immediately.
    realtimeBus.emit({ type: 'data:changed', restaurantId: id, payload: { entity: 'all' } });
    return result;
  },

  /**
   * Provision a new branch under an existing hotel. A branch is a full,
   * independent restaurant workspace (its own menu, tables, QRs, orders, staff,
   * settings…) that belongs to its parent hotel via `parentId`. It inherits the
   * hotel's branding and settings by default, and starts with the same default
   * categories/tables/QRs as a hotel. Data stays isolated by `restaurantId`.
   */
  createBranch(input: CreateBranchInput): Restaurant {
    const hotel = getDb().restaurants.find((r) => r.id === input.hotelId && !r.parentId);
    if (!hotel) throw new Error(`Cannot create branch: hotel ${input.hotelId} not found.`);

    const now = new Date().toISOString();
    const id = makeId('rest');
    const slug = makeUniqueSlug(input.name);

    console.info('[ToDining][branch] Creating branch…', { id, slug, name: input.name, hotelId: hotel.id });

    const branch = mutate((db) => {
      const created: Restaurant = {
        id,
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || undefined,
        logoColor: input.logoColor || hotel.logoColor,
        logoUrl: hotel.logoUrl,
        parentId: hotel.id,
        code: input.code?.trim() || undefined,
        address: input.address?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        email: input.email?.trim() || undefined,
        manager: input.manager?.trim() || undefined,
        status: input.status ?? 'active',
        createdAt: now,
        updatedAt: now,
        // Inherit the hotel's tax/currency settings; each branch can diverge later.
        settings: { ...hotel.settings },
      };
      db.restaurants.push(created);
      provisionDefaults(db, id, slug);
      return created;
    });

    console.info('[ToDining][branch] Branch created, write-through queued:', id);
    realtimeBus.emit({ type: 'data:changed', restaurantId: id, payload: { entity: 'all' } });
    return branch;
  },

  update(id: string, patch: Partial<Restaurant>): Restaurant | undefined {
    const updated = mutate((db) => {
      const r = db.restaurants.find((x) => x.id === id);
      if (r) Object.assign(r, patch, { updatedAt: new Date().toISOString() });
      return r;
    });
    // Broadcast so the admin sidebar, restaurant switcher and — crucially — the
    // live customer website (header, menu currency/tagline) re-read the renamed/
    // re-themed restaurant instead of showing stale identity until a reload.
    if (updated) realtimeBus.emit({ type: 'data:changed', restaurantId: id, payload: { entity: 'restaurant' } });
    return updated;
  },
};
