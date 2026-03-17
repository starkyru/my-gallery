'use client';

import { GalleryHero, GalleryGrid } from '@/components/gallery';
import { useImages } from '@/hooks/useImages';

export default function HomePage() {
  const { images, loading } = useImages();

  return (
    <>
      <GalleryHero />
      <GalleryGrid images={images} loading={loading} />
    </>
  );
}
