'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { FilterToolbar } from '@/components/filter-toolbar';
import { GalleryCard } from '@/components/gallery-grid';
import type { GalleryImage } from '@/components/gallery-grid';

const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || 'http://localhost:4000/uploads';

interface ArtistDetailProps {
  artist: {
    id: number;
    name: string;
    bio: string | null;
    portraitPath: string | null;
  };
  images: GalleryImage[];
}

export function ArtistDetail({ artist, images }: ArtistDetailProps) {
  const [filter, setFilter] = useState('');
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = filter ? images.filter((img) => img.category === filter) : images;

  const handleFilter = useCallback(
    (value: string) => {
      if (value === filter) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setFilter(value);
        return;
      }
      setVisible(false);
      setTimeout(() => {
        setFilter(value);
        requestAnimationFrame(() => setVisible(true));
      }, 300);
    },
    [filter],
  );

  // Entrance animations
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      if (portraitRef.current) {
        gsap.from(portraitRef.current, {
          x: -40,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
        });
      }
      if (infoRef.current) {
        gsap.from(infoRef.current, {
          x: 40,
          opacity: 0,
          duration: 1,
          delay: 0.15,
          ease: 'power3.out',
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Grid entrance on filter change
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!gridRef.current) return;

    const timeout = setTimeout(() => {
      const cards = gridRef.current?.querySelectorAll('.gallery-card');
      if (!cards) return;

      const ctx = gsap.context(() => {
        cards.forEach((card, i) => {
          gsap.from(card, {
            scrollTrigger: {
              trigger: card,
              start: 'top 92%',
              toggleActions: 'play none none none',
            },
            y: 80,
            opacity: 0,
            duration: 0.9,
            delay: (i % 4) * 0.12,
            ease: 'power3.out',
          });
        });
      }, gridRef);

      return () => ctx.revert();
    }, 50);

    return () => clearTimeout(timeout);
  }, [filtered]);

  return (
    <div ref={containerRef} className="mx-auto max-w-7xl px-6 pt-28 pb-24">
      {/* Artist header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
        <div ref={portraitRef} className="lg:col-span-1">
          {artist.portraitPath ? (
            <div className="relative overflow-hidden rounded-lg bg-white/5">
              <img
                src={`${UPLOAD_URL}/${artist.portraitPath}`}
                alt={artist.name}
                className="w-full h-auto"
              />
            </div>
          ) : (
            <div className="aspect-square rounded-lg bg-white/5 flex items-center justify-center">
              <span className="text-6xl text-gallery-gray">
                {artist.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div ref={infoRef} className="lg:col-span-2 flex flex-col justify-center">
          <h1 className="font-serif text-4xl md:text-5xl mb-4">{artist.name}</h1>
          {artist.bio && <p className="text-gallery-gray leading-relaxed text-lg">{artist.bio}</p>}
        </div>
      </div>

      {/* Works section */}
      {images.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl mb-8">Works by {artist.name}</h2>
          <FilterToolbar value={filter} onChange={handleFilter} className="mb-8" />

          <p className="text-gallery-gray text-sm mb-8 transition-opacity duration-300">
            {filtered.length} {filtered.length === 1 ? 'work' : 'works'}
          </p>

          <div
            ref={gridRef}
            className={`columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5 transition-all duration-300 ease-out ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {filtered.map((image, i) => (
              <GalleryCard key={image.id} image={image} index={i} />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-gallery-gray py-24">No images found.</p>
          )}
        </section>
      )}
    </div>
  );
}
