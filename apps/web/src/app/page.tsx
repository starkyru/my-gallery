'use client';

import { useMemo } from 'react';
import { GalleryHero, GalleryGrid } from '@/components/gallery';
import { useImages } from '@/hooks/useImages';

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function HomePage() {
  const { images, loading } = useImages();

  const heroImages = useMemo(() => pickRandom(images, 6), [images]);

  return (
    <>
      <GalleryHero images={heroImages} />
      <GalleryGrid images={images} loading={loading} />
    </>
  );
}
