'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@gallery/shared';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (imageId: number) => void;
  clear: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.imageId === item.imageId)) return state;
          return { items: [...state.items, item] };
        }),
      removeItem: (imageId) =>
        set((state) => ({ items: state.items.filter((i) => i.imageId !== imageId) })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, item) => sum + item.price, 0),
    }),
    { name: 'gallery-cart' },
  ),
);
