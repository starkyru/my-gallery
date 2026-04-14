'use client';

import { createContext, useContext, useCallback, useRef } from 'react';
import type { GalleryImage } from '@/components/gallery';

interface ImageCacheContextValue {
  getAll: () => GalleryImage[];
  setAll: (images: GalleryImage[]) => void;
  hasData: () => boolean;
}

const ImageCacheContext = createContext<ImageCacheContextValue>({
  getAll: () => [],
  setAll: () => {},
  hasData: () => false,
});

export function ImageCacheProvider({ children }: { children: React.ReactNode }) {
  const cacheRef = useRef<GalleryImage[]>([]);

  const getAll = useCallback(() => cacheRef.current, []);
  const setAll = useCallback((images: GalleryImage[]) => {
    cacheRef.current = images;
  }, []);
  const hasData = useCallback(() => cacheRef.current.length > 0, []);

  return (
    <ImageCacheContext.Provider value={{ getAll, setAll, hasData }}>
      {children}
    </ImageCacheContext.Provider>
  );
}

export function useImageCache() {
  return useContext(ImageCacheContext);
}
