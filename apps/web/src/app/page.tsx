'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GalleryGrid } from '@/components/gallery';
import { useImages } from '@/hooks/useImages';
import { useImageCache } from '@/hooks/useImageCache';
import { CategoryBoxes } from '@/components/home/category-boxes';
import { HomeAbout } from '@/components/home/home-about';
import { api } from '@/lib/api';
import { shuffleArray } from '@gallery/shared';
import type { Category } from '@gallery/shared';

export default function HomePage() {
  const { images, loading: imagesLoading } = useImages();
  const imageCache = useImageCache();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [sideDataLoading, setSideDataLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.categories.list().then((cats) => {
      if (!cancelled) {
        setCategories(cats);
        setSideDataLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = imagesLoading || sideDataLoading;

  // Populate cache so artist pages can reuse the data
  useEffect(() => {
    if (!imagesLoading && images.length > 0) {
      imageCache.setAll(images);
    }
  }, [imagesLoading, images, imageCache]);

  const initialTags = useMemo(() => {
    const tagsParam = searchParams.get('tags');
    return tagsParam ? tagsParam.split(',').filter(Boolean) : undefined;
  }, [searchParams]);

  const initialCategory = searchParams.get('category') ?? undefined;
  const initialMediaType = searchParams.get('media') ?? undefined;
  const initialPaintType = searchParams.get('paint') ?? undefined;
  const initialProject = searchParams.get('project') ?? undefined;

  const shuffled = useMemo(() => shuffleArray(images), [images]);

  if (loading) {
    return null;
  }

  return (
    <>
      <CategoryBoxes images={images} categories={categories} />
      <HomeAbout />
      <GalleryGrid
        images={shuffled}
        initialCategory={initialCategory}
        initialTags={initialTags}
        initialMediaType={initialMediaType}
        initialPaintType={initialPaintType}
        initialProject={initialProject}
      />
    </>
  );
}
