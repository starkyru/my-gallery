'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { GalleryHero, GalleryGrid } from '@/components/gallery';
import { useImages } from '@/hooks/useImages';

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function HomePage() {
  const { images, loading } = useImages();
  const searchParams = useSearchParams();

  const initialTags = useMemo(() => {
    const tagsParam = searchParams.get('tags');
    return tagsParam ? tagsParam.split(',').filter(Boolean) : undefined;
  }, [searchParams]);

  const shuffled = useMemo(() => pickRandom(images, images.length), [images]);
  const heroImages = useMemo(() => shuffled.slice(0, 6), [shuffled]);

  return (
    <>
      <GalleryHero images={heroImages} />
      <GalleryGrid images={shuffled} loading={loading} initialTags={initialTags} />
    </>
  );
}
