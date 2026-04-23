'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { GalleryGrid } from '@/components/gallery';
import { useImages } from '@/hooks/useImages';
import { shuffleArray } from '@gallery/shared';

export default function PhotographsPage() {
  const { images, loading } = useImages({ type: 'photo' });
  const searchParams = useSearchParams();

  const initialTags = useMemo(() => {
    const tagsParam = searchParams.get('tags');
    return tagsParam ? tagsParam.split(',').filter(Boolean) : undefined;
  }, [searchParams]);

  const initialCategory = searchParams.get('category') ?? undefined;
  const initialMediaType = searchParams.get('media') ?? undefined;
  const initialPaintType = searchParams.get('paint') ?? undefined;

  const shuffled = useMemo(() => shuffleArray(images), [images]);

  return (
    <div className="pt-20">
      <h1 className="font-serif text-4xl md:text-5xl text-center mb-4">Photographs</h1>
      <GalleryGrid
        images={shuffled}
        loading={loading}
        initialCategory={initialCategory}
        initialTags={initialTags}
        initialMediaType={initialMediaType}
        initialPaintType={initialPaintType}
      />
    </div>
  );
}
