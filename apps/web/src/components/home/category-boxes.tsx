'use client';

import { useMemo } from 'react';
import type { GalleryImage } from '@/components/gallery';
import type { Category } from '@gallery/shared';
import { CategoryCard } from './category-card';

interface CategoryWithImage {
  category: Category;
  image: GalleryImage;
  tall: boolean;
}

// Max columns at largest breakpoint — used for tall item calculation.
// At smaller breakpoints (2 or 3 cols), the extra tall items just
// create additional rows which auto-rows-fr distributes evenly.
const MAX_COLS = 4;

const TYPE_SIDES: { type: 'photo' | 'painting'; label: string; route: string }[] = [
  { type: 'photo', label: 'Photographs', route: '/photographs' },
  { type: 'painting', label: 'Paintings', route: '/paintings' },
];

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
    const matches = filteredImages.filter((img) => img.category === cat.slug);
    if (matches.length > 0) {
      const image = matches[Math.floor(Math.random() * matches.length)];
      items.push({ category: cat, image });
    }
  }
  return items;
}

export function CategoryBoxes({
  images,
  categories,
}: {
  images: GalleryImage[];
  categories: Category[];
}) {
  const sides = useMemo(() => {
    return TYPE_SIDES.map(({ type, label, route }) => {
      const typeImages = images.filter((img) => img.type === type);
      return {
        type,
        label,
        route,
        categories: assignTallItems(collectCategories(typeImages, categories)),
      };
    }).filter((s) => s.categories.length > 0);
  }, [images, categories]);

  if (sides.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex md:flex-row md:h-screen">
        {sides.map(({ type, label, route, categories: cats }) => (
          <div key={type} className="relative flex-1 md:h-full group/side">
            <span
              className={`absolute top-20 md:top-24 left-1/2 -translate-x-1/2 z-20 px-30 py-2 font-serif italic text-2xl md:text-4xl lg:text-5xl whitespace-nowrap pointer-events-none backdrop-blur-sm text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]`}
            >
              {label}
            </span>
            <div
              className="relative z-0 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 h-full"
              style={{ gridAutoFlow: 'dense', gridAutoRows: 'minmax(100px, 1fr)' }}
            >
              {cats.map(({ category, image, tall }) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  image={image}
                  href={`${route}?category=${category.slug}`}
                  tall={tall}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
