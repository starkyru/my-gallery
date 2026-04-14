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
}

function CategoryCard({
  category,
  image,
  href,
}: {
  category: Category;
  image: GalleryImage;
  href: string;
}) {
  const blurDataURL = image.blurHash ? blurhashToDataURL(image.blurHash) : undefined;

  return (
    <Link href={href} className="relative block aspect-[5/4] overflow-hidden group">
      <Image
        src={`${UPLOAD_URL}/${image.thumbnailPath}`}
        alt={category.name}
        fill
        className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105 origin-top"
        sizes="(max-width: 768px) 50vw, 25vw"
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
      />
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors duration-300" />
      <span className="absolute bottom-0 left-0 right-0 py-2 bg-gray-500/30 backdrop-blur-sm text-center font-serif text-lg md:text-xl text-white tracking-wide">
        {category.name}
      </span>
    </Link>
  );
}

function buildCategoryList(
  filteredImages: GalleryImage[],
  categories: Category[],
): CategoryWithImage[] {
  const result: CategoryWithImage[] = [];
  for (const cat of categories) {
    const match = filteredImages.find((img) => img.category === cat.slug);
    if (match) {
      result.push({ category: cat, image: match });
    }
  }
  return result;
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
        categories: buildCategoryList(artistImages, categories),
      };
    });
  }, [images, categories, artists]);

  if (sides.every((s) => s.categories.length === 0)) {
    return null;
  }

  return (
    <section>
      <div className="flex flex-col md:flex-row">
        {sides.map(({ artist, categories: cats }) => (
          <div key={artist.id} className="flex-1">
            {cats.length > 0 && (
              <div className="grid grid-cols-4">
                {cats.map(({ category, image }) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    image={image}
                    href={`/artists/${artist.slug}?category=${category.slug}`}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
