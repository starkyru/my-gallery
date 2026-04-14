'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { GalleryImage } from '@/components/gallery';

interface ArtistInfo {
  id: number;
  name: string;
  slug: string;
  bio: string | null;
  portraitPath: string | null;
  instagramUrl: string | null;
  isActive?: boolean;
}

interface ImageCacheHandle {
  getAll: () => GalleryImage[];
  hasData: () => boolean;
}

export function useArtistData(slug: string, imageCache: ImageCacheHandle) {
  const [artist, setArtist] = useState<ArtistInfo | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const artistData = (await api.artists.get(slug)) as ArtistInfo;
        if (cancelled || !artistData || artistData.isActive === false) {
          if (!cancelled) setLoading(false);
          return;
        }
        setArtist(artistData);

        // Use cached images if available, otherwise fetch
        if (imageCache.hasData()) {
          const cached = imageCache.getAll().filter((img) => img.artist.id === artistData.id);
          if (!cancelled) setImages(cached);
        } else {
          const fetched = await api.images.list(`artistId=${artistData.id}`);
          if (!cancelled) setImages(fetched);
        }
      } catch {
        // artist not found
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, imageCache]);

  return { artist, images, loading };
}
