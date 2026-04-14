'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { GalleryGrid } from '@/components/gallery';
import { useImages } from '@/hooks/useImages';
import { shuffleArray } from '@gallery/shared';

export default function PaintingsPage() {
  const { images, loading } = useImages({ type: 'painting' });
  const searchParams = useSearchParams();

  const initialTags = useMemo(() => {
    const tagsParam = searchParams.get('tags');
    return tagsParam ? tagsParam.split(',').filter(Boolean) : undefined;
  }, [searchParams]);

  const shuffled = useMemo(() => shuffleArray(images), [images]);

  return (
    <div className="pt-20">
      <h1 className="font-serif text-4xl md:text-5xl text-center mb-4">Paintings</h1>
      <GalleryGrid images={shuffled} loading={loading} initialTags={initialTags} />
    </div>
  );
}
