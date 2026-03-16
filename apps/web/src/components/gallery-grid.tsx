'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ImageCategory } from '@gallery/shared';

gsap.registerPlugin(ScrollTrigger);

const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || 'http://localhost:4000/uploads';

const CATEGORIES = [
  { label: 'All', value: '' },
  ...Object.values(ImageCategory).map((c) => ({
    label: c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    value: c,
  })),
];

interface GalleryImage {
  id: number;
  title: string;
  price: number;
  thumbnailPath: string;
  watermarkPath: string;
  width: number;
  height: number;
  category: string;
  photographer?: { name: string };
}

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [filter, setFilter] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = filter ? images.filter((img) => img.category === filter) : images;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!gridRef.current) return;

    const cards = gridRef.current.querySelectorAll('.gallery-card');
    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
          y: 60,
          opacity: 0,
          duration: 0.8,
          delay: (i % 4) * 0.1,
          ease: 'power2.out',
        });
      });
    }, gridRef);

    return () => ctx.revert();
  }, [filtered]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="flex flex-wrap gap-3 mb-12 justify-center">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-4 py-2 text-sm rounded-full border transition-colors ${
              filter === cat.value
                ? 'border-gallery-accent text-gallery-accent'
                : 'border-white/10 text-gallery-gray hover:border-white/30'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div
        ref={gridRef}
        className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
      >
        {filtered.map((image) => (
          <Link
            key={image.id}
            href={`/gallery/${image.id}`}
            className="gallery-card block break-inside-avoid group"
          >
            <div className="relative overflow-hidden rounded-lg bg-white/5">
              <Image
                src={`${UPLOAD_URL}/${image.watermarkPath}`}
                alt={image.title}
                width={image.width}
                height={image.height}
                className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <h3 className="font-serif text-lg">{image.title}</h3>
                <p className="text-gallery-gray text-sm">
                  {image.photographer?.name} &middot; ${image.price}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gallery-gray py-24">No images found.</p>
      )}
    </section>
  );
}
