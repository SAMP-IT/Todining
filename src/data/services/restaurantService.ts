import type { Restaurant } from '@/types';
import { getDb, mutate } from '@/data/mock/store';

export const restaurantService = {
  list(): Restaurant[] {
    return getDb().restaurants;
  },
  getById(id: string): Restaurant | undefined {
    return getDb().restaurants.find((r) => r.id === id);
  },
  getBySlug(slug: string): Restaurant | undefined {
    return getDb().restaurants.find((r) => r.slug === slug);
  },
  update(id: string, patch: Partial<Restaurant>): Restaurant | undefined {
    return mutate((db) => {
      const r = db.restaurants.find((x) => x.id === id);
      if (r) Object.assign(r, patch);
      return r;
    });
  },
};
