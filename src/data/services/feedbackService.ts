import type { Feedback } from '@/types';
import { getDb, mutate } from '@/data/mock/store';
import { realtimeBus } from '@/data/realtime/bus';
import { makeId } from '@/lib/id';

export type FeedbackInput = Omit<Feedback, 'id' | 'restaurantId' | 'createdAt'>;

export const feedbackService = {
  list(restaurantId: string): Feedback[] {
    return getDb()
      .feedback.filter((f) => f.restaurantId === restaurantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  create(restaurantId: string, input: FeedbackInput): Feedback {
    const fb = mutate((db) => {
      const f: Feedback = { ...input, id: makeId('fb'), restaurantId, createdAt: new Date().toISOString() };
      db.feedback.push(f);
      return f;
    });
    realtimeBus.emit({ type: 'data:changed', restaurantId, payload: { entity: 'feedback' } });
    return fb;
  },

  averages(restaurantId: string) {
    const all = this.list(restaurantId);
    if (!all.length) return { food: 0, service: 0, experience: 0, overall: 0, count: 0 };
    const avg = (sel: (f: Feedback) => number) => all.reduce((s, f) => s + sel(f), 0) / all.length;
    const food = avg((f) => f.foodRating);
    const service = avg((f) => f.serviceRating);
    const experience = avg((f) => f.experienceRating);
    return {
      food: +food.toFixed(1),
      service: +service.toFixed(1),
      experience: +experience.toFixed(1),
      overall: +((food + service + experience) / 3).toFixed(1),
      count: all.length,
    };
  },
};
