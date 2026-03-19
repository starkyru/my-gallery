'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { GalleryConfig } from '@gallery/shared';

interface ConfigState {
  config: GalleryConfig;
  hydrated: boolean;
  load: () => Promise<void>;
}

const DEFAULT_CONFIG: GalleryConfig = {
  galleryName: 'Gallery',
  subtitle: '',
  siteUrl: '',
};

export const useConfigStore = create<ConfigState>()((set, get) => ({
  config: DEFAULT_CONFIG,
  hydrated: false,
  load: async () => {
    if (get().hydrated) return;
    try {
      const config = await api.galleryConfig.get();
      set({ config, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));
