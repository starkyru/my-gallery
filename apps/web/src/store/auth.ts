'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  role: 'admin' | 'photographer' | null;
  photographerId: number | null;
  setAuth: (
    token: string | null,
    role?: 'admin' | 'photographer' | null,
    photographerId?: number | null,
  ) => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      role: null,
      photographerId: null,
      setAuth: (token, role = null, photographerId = null) =>
        set({ token, role: token ? role : null, photographerId: token ? photographerId : null }),
      isAuthenticated: () => !!get().token,
      isAdmin: () => get().role === 'admin',
    }),
    { name: 'gallery-auth' },
  ),
);
