import { create } from 'zustand';
import { api } from '@/lib/api';
import type { GalleryImage, Category, Artist, Project } from '@gallery/shared';

interface GalleryFilters {
  category?: string;
  artistId?: number;
  projectId?: number;
  featured?: boolean;
}

interface GalleryState {
  images: GalleryImage[];
  categories: Category[];
  artists: Artist[];
  projects: Project[];
  filters: GalleryFilters;
  loading: boolean;
  error: string | null;
  setFilters: (filters: GalleryFilters) => void;
  fetchImages: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchArtists: () => Promise<void>;
  fetchProjects: (artistId?: number) => Promise<void>;
  refreshAll: () => Promise<void>;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildParams(filters: GalleryFilters): string {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.artistId) params.set('artistId', String(filters.artistId));
  if (filters.projectId) params.set('projectId', String(filters.projectId));
  if (filters.featured) params.set('featured', 'true');
  return params.toString();
}

export const useGalleryStore = create<GalleryState>()((set, get) => ({
  images: [],
  categories: [],
  artists: [],
  projects: [],
  filters: {},
  loading: false,
  error: null,

  setFilters: (filters) => {
    set({ filters });
    get().fetchImages();
  },

  fetchImages: async () => {
    set({ loading: true, error: null });
    try {
      const images = shuffle(await api.images.list(buildParams(get().filters)));
      set({ images, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await api.categories.list();
      set({ categories });
    } catch {
      // silently fail for metadata
    }
  },

  fetchArtists: async () => {
    try {
      const artists = await api.artists.list();
      set({ artists });
    } catch {
      // silently fail for metadata
    }
  },

  fetchProjects: async (artistId) => {
    try {
      const projects = await api.projects.list(artistId);
      set({ projects });
    } catch {
      // silently fail for metadata
    }
  },

  refreshAll: async () => {
    // fetchImages is critical — let it throw so the loading screen can catch it.
    // Categories and artists are non-critical metadata.
    set({ loading: true, error: null });
    const images = shuffle(await api.images.list(buildParams(get().filters)));
    set({ images, loading: false });
    // Fire-and-forget for metadata
    get().fetchCategories();
    get().fetchArtists();
  },
}));
