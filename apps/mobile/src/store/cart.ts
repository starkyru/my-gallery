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
  total: () => number;
  hasPrintItems: () => boolean;
}

function cartItemKey(item: { imageId: number; type: string; printSku: string | null }) {
  return `${item.imageId}-${item.type}-${item.printSku || ''}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          if (state.items.length >= 50) return state;
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
      removeByImageId: (imageId) =>
        set((state) => ({
          items: state.items.filter((i) => i.imageId !== imageId),
        })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, item) => sum + item.price, 0),
      hasPrintItems: () => get().items.some((i) => i.type === 'print'),
    }),
    {
      name: 'gallery-cart',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
