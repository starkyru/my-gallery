'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GalleryImage } from '@/components/gallery';
import type { Category } from '@gallery/shared';
import { CategoryCard } from './category-card';

interface CategoryWithImage {
  category: Category;
  image: GalleryImage;
  tall: boolean;
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

function assignTallItems(
  items: Omit<CategoryWithImage, 'tall'>[],
  cols: number,
): CategoryWithImage[] {
  const n = items.length;
  if (n === 0) return [];

  const rows = Math.ceil(n / cols);
  const totalCells = rows * cols;
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

/** Make both sides occupy the same number of rows in a 1-column layout
 *  by promoting non-tall items to tall on the shorter side. */
function balanceSides(sides: { categories: CategoryWithImage[] }[]): void {
  if (sides.length < 2) return;

  const totalRows = (cats: CategoryWithImage[]) =>
    cats.reduce((sum, c) => sum + (c.tall ? 2 : 1), 0);

  const rowCounts = sides.map((s) => totalRows(s.categories));
  const maxRows = Math.max(...rowCounts);

  for (let i = 0; i < sides.length; i++) {
    let deficit = maxRows - rowCounts[i];
    for (const cat of sides[i].categories) {
      if (deficit <= 0) break;
      if (!cat.tall) {
        cat.tall = true;
        deficit--;
      }
    }
    if (deficit !== maxRows - rowCounts[i]) {
      // Re-sort after modifying tall flags
      sides[i].categories.sort((a, b) => (a.tall === b.tall ? 0 : a.tall ? -1 : 1));
    }
  }
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

  // Tall assignment — re-runs when maxCols changes across breakpoints
  const sides = useMemo(() => {
    const result = rawSides.map(({ type, label, route, items }) => ({
      type,
      label,
      route,
      categories: assignTallItems(items, maxCols),
    }));
    balanceSides(result);
    return result;
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
