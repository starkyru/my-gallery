import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { api } from '@/lib/api';

const KEYCHAIN_SERVICE = 'gallery-auth';

/** Keychain-backed storage adapter for the JWT token only. */
const keychainTokenStorage = {
  getItem: async (): Promise<string | null> => {
    const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
    return credentials ? credentials.password : null;
  },
  setItem: async (_key: string, value: string): Promise<void> => {
    await Keychain.setGenericPassword('token', value, {
      service: KEYCHAIN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  removeItem: async (): Promise<void> => {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  },
};

interface AuthState {
  token: string | null;
  role: string | null;
  artistId: number | null;
  loading: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      artistId: null,
      loading: false,
      hydrated: false,

      hydrate: async () => {
        const storedToken = await keychainTokenStorage.getItem();
        if (storedToken) {
          set({ token: storedToken, hydrated: true });
        } else {
          set({ hydrated: true });
        }
      },

      login: async (username, password) => {
        set({ loading: true });
        try {
          const res = await api.auth.login(username, password);
          const token = res.accessToken;
          await keychainTokenStorage.setItem('token', token);
          set({
            token,
            role: res.role,
            artistId: res.artistId ?? null,
            loading: false,
          });
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      logout: () => {
        keychainTokenStorage.removeItem();
        set({ token: null, role: null, artistId: null });
      },
    }),
    {
      name: 'gallery-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist non-sensitive data to AsyncStorage; token goes to Keychain
      partialize: (state) => ({
        role: state.role,
        artistId: state.artistId,
      }),
    },
  ),
);
