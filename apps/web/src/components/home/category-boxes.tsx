'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GalleryImage } from '@/components/gallery';
import type { Category } from '@gallery/shared';
import { CategoryCard } from './category-card';

interface CategoryWithImage {
  category: Category;
  image: GalleryImage;
  rowSpan: number;
}

function getMaxCols(width: number): number {
  if (width < 768) return 2;
  if (width <= 1200) return 3;
  return 4;
}

const TYPE_SIDES: { type: 'photo' | 'painting'; label: string; route: string }[] = [
  { type: 'photo', label: 'Photographs', route: '/photographs' },
  { type: 'painting', label: 'Paintings', route: '/paintings' },
];

/**
 * Mobile (<768px, 1 column per side):
 *   Balance heights — bigger side all rowSpan=1, smaller side gets extra spans.
 *
 * Multi-column (768px+):
 *   Each side independently fills its own grid (rowSpan 1 or 2 only).
 *   Height equalization comes from CSS (h-screen + minmax rows).
 */
function assignRowSpans(
  sidesItems: Omit<CategoryWithImage, 'rowSpan'>[][],
  cols: number,
  isMobile: boolean,
): CategoryWithImage[][] {
  if (sidesItems.length === 0) return [];

  if (isMobile) {
    // 1 column per side — balance total rows between sides
    const counts = sidesItems.map((items) => items.length);
    const targetRows = Math.max(...counts);

    return sidesItems.map((items) => {
      const n = items.length;
      if (n === 0) return [];

      const extra = targetRows - n;
      const baseExtra = Math.floor(extra / n);
      const remainder = extra % n;

      const indexed = items.map((item, i) => ({ i, seed: item.category.id * 7 + i }));
      indexed.sort((a, b) => a.seed - b.seed);
      const bonusIndices = new Set(indexed.slice(0, remainder).map((e) => e.i));

      const result = items.map((item, i) => ({
        ...item,
        rowSpan: 1 + baseExtra + (bonusIndices.has(i) ? 1 : 0),
      }));

      result.sort((a, b) => b.rowSpan - a.rowSpan);
      return result;
    });
  }

  // Multi-column: each side independently fills its grid (rowSpan 1 or 2)
  return sidesItems.map((items) => {
    const n = items.length;
    if (n === 0) return [];

    const rows = Math.ceil(n / cols);
    const totalCells = rows * cols;
    const tallCount = Math.max(0, Math.min(totalCells - n, n));

    const indexed = items.map((item, i) => ({ i, seed: item.category.id * 7 + i }));
    indexed.sort((a, b) => a.seed - b.seed);
    const tallIndices = new Set(indexed.slice(0, tallCount).map((e) => e.i));

    const result = items.map((item, i) => ({
      ...item,
      rowSpan: tallIndices.has(i) ? 2 : 1,
    }));

    result.sort((a, b) => b.rowSpan - a.rowSpan);
    return result;
  });
}

function collectCategories(
  filteredImages: GalleryImage[],
  categories: Category[],
): Omit<CategoryWithImage, 'rowSpan'>[] {
  const items: Omit<CategoryWithImage, 'rowSpan'>[] = [];
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
  const [maxCols, setMaxCols] = useState(4);

  useEffect(() => {
    function update() {
      setMaxCols((prev) => {
        const next = getMaxCols(window.innerWidth);
        return prev === next ? prev : next;
      });
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Stable image selection — only re-runs when data changes, not on resize
  const rawSides = useMemo(() => {
    return TYPE_SIDES.map(({ type, label, route }) => {
      const typeImages = images.filter((img) => img.type === type);
      return {
        type,
        label,
        route,
        items: collectCategories(typeImages, categories),
      };
    }).filter((s) => s.items.length > 0);
  }, [images, categories]);

  // Row span assignment — re-runs when maxCols changes across breakpoints
  const sides = useMemo(() => {
    const isMobile = maxCols === getMaxCols(0); // mobile when cols matches <768 value
    const spanResults = assignRowSpans(
      rawSides.map((s) => s.items),
      maxCols,
      isMobile,
    );
    return rawSides.map(({ type, label, route }, i) => ({
      type,
      label,
      route,
      categories: spanResults[i],
    }));
  }, [rawSides, maxCols]);

  if (sides.length === 0) {
    return null;
  }

  const mobileRowHeight = `${0.5}vw`;

  return (
    <section>
      <style>{`
        .category-side-grid { grid-auto-rows: ${mobileRowHeight}; }
        @media (min-width: 768px) {
          .category-side-grid { grid-auto-rows: minmax(200px, 1fr); }
        }
      `}</style>
      <div className="flex md:flex-row md:h-screen">
        {sides.map(({ type, label, route, categories: cats }) => (
          <div key={type} className="relative flex-1 md:h-full group/side">
            <span
              className={`absolute top-20 md:top-24 left-1/2 -translate-x-1/2 z-20 px-30 py-2 font-serif italic text-2xl md:text-4xl lg:text-5xl whitespace-nowrap pointer-events-none backdrop-blur-sm text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]`}
            >
              {label}
            </span>
            <div
              className="relative z-0 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 md:h-full category-side-grid"
              style={{ gridAutoFlow: 'dense' }}
            >
              {cats.map(({ category, image, rowSpan }) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  image={image}
                  href={`${route}?category=${category.slug}`}
                  rowSpan={rowSpan}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
