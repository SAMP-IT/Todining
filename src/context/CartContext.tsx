import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem, MenuItem } from '@/types';

interface CartValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: MenuItem, qty?: number) => void;
  setQty: (menuItemId: string, qty: number) => void;
  increment: (menuItemId: string) => void;
  decrement: (menuItemId: string) => void;
  remove: (menuItemId: string) => void;
  clear: () => void;
  qtyOf: (menuItemId: string) => number;
}

const CartContext = createContext<CartValue | null>(null);

/** Cart is scoped per table session and persisted so a refresh keeps the order. */
export function CartProvider({ scopeKey, children }: { scopeKey: string; children: ReactNode }) {
  const storageKey = `todining_cart_${scopeKey}`;
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const add = useCallback((item: MenuItem, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) => (c.menuItemId === item.id ? { ...c, qty: c.qty + qty } : c));
      }
      return [
        ...prev,
        { menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl, qty },
      ];
    });
  }, []);

  const setQty = useCallback((menuItemId: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((c) => c.menuItemId !== menuItemId)
        : prev.map((c) => (c.menuItemId === menuItemId ? { ...c, qty } : c)),
    );
  }, []);

  const increment = useCallback((id: string) => setItems((prev) => prev.map((c) => (c.menuItemId === id ? { ...c, qty: c.qty + 1 } : c))), []);
  const decrement = useCallback(
    (id: string) =>
      setItems((prev) =>
        prev.flatMap((c) => (c.menuItemId === id ? (c.qty > 1 ? [{ ...c, qty: c.qty - 1 }] : []) : [c])),
      ),
    [],
  );
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((c) => c.menuItemId !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartValue>(() => {
    const count = items.reduce((s, c) => s + c.qty, 0);
    const subtotal = items.reduce((s, c) => s + c.price * c.qty, 0);
    return {
      items,
      count,
      subtotal,
      add,
      setQty,
      increment,
      decrement,
      remove,
      clear,
      qtyOf: (id) => items.find((c) => c.menuItemId === id)?.qty ?? 0,
    };
  }, [items, add, setQty, increment, decrement, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
