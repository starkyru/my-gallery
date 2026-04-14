'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GalleryGrid } from '@/components/gallery';
import { useImages } from '@/hooks/useImages';
import { SplitHero } from '@/components/home/split-hero';
import { CategoryBoxes } from '@/components/home/category-boxes';
import { HomeAbout } from '@/components/home/home-about';
import { api } from '@/lib/api';
import type { Artist, Category } from '@gallery/shared';

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function HomePage() {
  const { images, loading: imagesLoading } = useImages();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [sideDataLoading, setSideDataLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.categories.list(), api.artists.list()]).then(([cats, arts]) => {
      if (!cancelled) {
        setCategories(cats);
        setArtists(arts.filter((a) => a.isActive));
        setSideDataLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = imagesLoading || sideDataLoading;

  const initialTags = useMemo(() => {
    const tagsParam = searchParams.get('tags');
    return tagsParam ? tagsParam.split(',').filter(Boolean) : undefined;
  }, [searchParams]);

  const shuffled = useMemo(() => pickRandom(images, images.length), [images]);

  if (loading) {
    return null;
  }

  return (
    <>
      <SplitHero images={images} artists={artists} />
      <CategoryBoxes images={images} categories={categories} artists={artists} />
      <HomeAbout />
      <GalleryGrid images={shuffled} initialTags={initialTags} />
    </>
  );
}
