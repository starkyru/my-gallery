'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, OrderItemType } from '@gallery/shared';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (imageId: number, type: OrderItemType, printSku: string | null) => void;
  clear: () => void;
  total: () => number;
  hasPrintItems: () => boolean;
}

function cartItemKey(item: { imageId: number; type: string; printSku: string | null }) {
  return `${item.imageId}-${item.type}-${item.printSku || ''}`;
}

function migrateItem(item: any): CartItem {
  return {
    ...item,
    type: item.type || 'original',
    printSku: item.printSku ?? null,
    printDescription: item.printDescription ?? null,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const key = cartItemKey(item);
          if (state.items.some((i) => cartItemKey(i) === key)) return state;
          return { items: [...state.items, item] };
        }),
      removeItem: (imageId, type, printSku) =>
        set((state) => ({
          items: state.items.filter(
            (i) => cartItemKey(i) !== cartItemKey({ imageId, type, printSku }),
          ),
        })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, item) => sum + item.price, 0),
      hasPrintItems: () => get().items.some((i) => i.type === 'print'),
    }),
    {
      name: 'gallery-cart',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.items = state.items.map(migrateItem);
        }
      },
    },
  ),
);
