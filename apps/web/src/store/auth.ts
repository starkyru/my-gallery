'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  role: 'admin' | 'artist' | null;
  artistId: number | null;
  hydrated: boolean;
  setAuth: (
    token: string | null,
    role?: 'admin' | 'artist' | null,
    artistId?: number | null,
  ) => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      role: null,
      artistId: null,
      hydrated: false,
      setAuth: (token, role = null, artistId = null) =>
        set({ token, role: token ? role : null, artistId: token ? artistId : null }),
      isAuthenticated: () => !!get().token,
      isAdmin: () => get().role === 'admin',
    }),
    {
      name: 'gallery-auth',
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hydrated: true });
      },
      partialize: (state) => ({
        token: state.token,
        role: state.role,
        artistId: state.artistId,
      }),
    },
  ),
);
