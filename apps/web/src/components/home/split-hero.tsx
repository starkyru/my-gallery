'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { GalleryImage } from '@/components/gallery';
import type { Artist } from '@gallery/shared';
import { UPLOAD_URL } from '@/config';
import { blurhashToDataURL } from '@/lib/blurhash';

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function HeroPanel({
  image,
  label,
  href,
}: {
  image: GalleryImage | undefined;
  label: string;
  href: string;
}) {
  const blurDataURL = image?.blurHash ? blurhashToDataURL(image.blurHash) : undefined;

  return (
    <Link
      href={href}
      className="relative flex-1 flex items-end justify-center h-[40vh] md:h-[80vh] overflow-hidden group"
    >
      {image && (
        <Image
          src={`${UPLOAD_URL}/${image.watermarkPath}`}
          alt={label}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
          placeholder={blurDataURL ? 'blur' : 'empty'}
          blurDataURL={blurDataURL}
          priority
        />
      )}
      {/* <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-500" /> */}
      <div className="relative z-10 mb-8 px-6 py-3 bg-gray-500/30 backdrop-blur-sm">
        <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl tracking-widest text-white select-none">
          {label}
        </h2>
      </div>
    </Link>
  );
}

export function SplitHero({ images, artists }: { images: GalleryImage[]; artists: Artist[] }) {
  const panels = useMemo(() => {
    return artists.slice(0, 2).map((artist) => {
      const artistImages = images.filter((img) => img.artist.id === artist.id);
      return {
        artist,
        image: pickRandom(artistImages),
      };
    });
  }, [images, artists]);

  return (
    <div className="flex flex-col md:flex-row w-full">
      {panels.map(({ artist, image }) => (
        <HeroPanel
          key={artist.id}
          image={image}
          label={artist.name.toUpperCase()}
          href={`/artists/${artist.slug}`}
        />
      ))}
    </div>
  );
}
