'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { GalleryImage } from '@/components/gallery';

interface UseImagesOptions {
  artistId?: number;
  paintTypes?: string;
  type?: 'photo' | 'painting';
}

export function useImages(options?: UseImagesOptions) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchImages() {
      try {
        setLoading(true);
        const parts: string[] = [];
        if (options?.artistId) parts.push(`artistId=${encodeURIComponent(options.artistId)}`);
        if (options?.paintTypes) parts.push(`paintTypes=${encodeURIComponent(options.paintTypes)}`);
        if (options?.type) parts.push(`type=${encodeURIComponent(options.type)}`);
        const params = parts.length > 0 ? parts.join('&') : undefined;
        const data = await api.images.list(params);
        if (!cancelled) {
          setImages(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch images'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchImages();
    return () => {
      cancelled = true;
    };
  }, [options?.artistId, options?.paintTypes, options?.type]);

  return { images, loading, error };
}
