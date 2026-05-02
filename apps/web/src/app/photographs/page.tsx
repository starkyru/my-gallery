'use client';

import { useImages } from '@/hooks/useImages';
import { GalleryPageContent } from '@/components/overtone/gallery-page';

export default function PhotographsPage() {
  const { images, loading } = useImages();

  if (loading) return null;

  return <GalleryPageContent images={images} medium="photo" />;
}
