import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem, OrderItemType } from '@gallery/shared';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (imageId: number, type: OrderItemType, printSku: string | null) => void;
  removeByImageId: (imageId: number) => void;
  clear: () => void;
}

function cartItemKey(item: { imageId: number; type: string; printSku: string | null }) {
  return `${item.imageId}-${item.type}-${item.printSku || ''}`;
}

function normalizePrice(price: unknown) {
  if (typeof price === 'number') {
    return Number.isFinite(price) ? price : 0;
  }

  if (typeof price === 'string') {
    const parsed = Number(price);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeItem(item: CartItem): CartItem {
  return {
    ...item,
    price: normalizePrice(item.price),
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          if (state.items.length >= 50) return state;
          const normalizedItem = normalizeItem(item);
          const key = cartItemKey(normalizedItem);
          if (state.items.some((i) => cartItemKey(i) === key)) return state;
          return { items: [...state.items, normalizedItem] };
        }),
      removeItem: (imageId, type, printSku) =>
        set((state) => ({
          items: state.items.filter(
            (i) => cartItemKey(i) !== cartItemKey({ imageId, type, printSku }),
          ),
        })),
      removeByImageId: (imageId) =>
        set((state) => ({
          items: state.items.filter((i) => i.imageId !== imageId),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'gallery-cart',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.items = state.items.map(normalizeItem);
        }
      },
    },
  ),
);
