'use client';

import { use } from 'react';
import { ArtistDetail } from './artist-detail';
import { useImageCache } from '@/hooks/useImageCache';
import { useArtistData } from './use-artist-data';

export default function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const imageCache = useImageCache();
  const { artist, images, loading } = useArtistData(slug, imageCache);

  if (loading) return null;
  if (!artist) return null;

  return <ArtistDetail artist={artist} images={images} />;
}
