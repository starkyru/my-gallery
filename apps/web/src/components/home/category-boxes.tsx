'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { GalleryImage } from '@/components/gallery';
import type { Artist, Category } from '@gallery/shared';
import { UPLOAD_URL } from '@/config';
import { blurhashToDataURL } from '@/lib/blurhash';

interface CategoryWithImage {
  category: Category;
  image: GalleryImage;
  tall: boolean;
}

function CategoryCard({
  category,
  image,
  href,
  tall,
}: {
  category: Category;
  image: GalleryImage;
  href: string;
  tall: boolean;
}) {
  const blurDataURL = image.blurHash ? blurhashToDataURL(image.blurHash) : undefined;

  return (
    <Link
      href={href}
      className={`relative block overflow-hidden group ${tall ? 'row-span-2' : ''}`}
    >
      <Image
        src={`${UPLOAD_URL}/${tall ? image.watermarkPath : image.thumbnailPath}`}
        alt={category.name}
        fill
        className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105 origin-top"
        sizes={
          tall
            ? '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'
            : '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'
        }
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
      />
      {/* <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors duration-300" /> */}
      <span className="absolute bottom-0 left-0 right-0 py-1 md:py-2 bg-gray-500/30 backdrop-blur-sm text-center font-serif text-sm md:text-lg lg:text-xl text-white tracking-wide">
        {category.name}
      </span>
    </Link>
  );
}

// Max columns at largest breakpoint — used for tall item calculation.
// At smaller breakpoints (2 or 3 cols), the extra tall items just
// create additional rows which auto-rows-fr distributes evenly.
const MAX_COLS = 4;

function assignTallItems(items: Omit<CategoryWithImage, 'tall'>[]): CategoryWithImage[] {
  const n = items.length;
  if (n === 0) return [];

  const rows = Math.ceil(n / MAX_COLS);
  const totalCells = rows * MAX_COLS;
  const tallCount = Math.max(0, Math.min(totalCells - n, n));

  // Pick which items become tall, using category id for stable selection
  const indexed = items.map((item, i) => ({ item, i, seed: item.category.id * 7 + i }));
  indexed.sort((a, b) => a.seed - b.seed);
  const tallIndices = new Set(indexed.slice(0, tallCount).map((e) => e.i));

  const result = items.map((item, i) => ({ ...item, tall: tallIndices.has(i) }));
  // Tall items first so CSS grid dense packing places them before
  // single-row items fill rows and block 2-row spans
  result.sort((a, b) => (a.tall === b.tall ? 0 : a.tall ? -1 : 1));
  return result;
}

function collectCategories(
  filteredImages: GalleryImage[],
  categories: Category[],
): Omit<CategoryWithImage, 'tall'>[] {
  const items: Omit<CategoryWithImage, 'tall'>[] = [];
  for (const cat of categories) {
    const match = filteredImages.find((img) => img.category === cat.slug);
    if (match) {
      items.push({ category: cat, image: match });
    }
  }
  return items;
}

export function CategoryBoxes({
  images,
  categories,
  artists,
}: {
  images: GalleryImage[];
  categories: Category[];
  artists: Artist[];
}) {
  const sides = useMemo(() => {
    return artists.slice(0, 2).map((artist) => {
      const artistImages = images.filter((img) => img.artist.id === artist.id);
      return {
        artist,
        categories: assignTallItems(collectCategories(artistImages, categories)),
      };
    });
  }, [images, categories, artists]);

  if (sides.every((s) => s.categories.length === 0)) {
    return null;
  }

  return (
    <section>
      <div className="flex md:flex-row md:h-screen">
        {sides.map(({ artist, categories: cats }) => (
          <div
            key={artist.id}
            className="flex-1 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 md:h-full"
            style={{ gridAutoFlow: 'dense', gridAutoRows: 'minmax(100px, 1fr)' }}
          >
            {cats.map(({ category, image, tall }) => (
              <CategoryCard
                key={category.id}
                category={category}
                image={image}
                href={`/artists/${artist.slug}?category=${category.slug}`}
                tall={tall}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
