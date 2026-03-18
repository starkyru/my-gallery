'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { FilterToolbar } from '@/components/filter-toolbar';
import { GalleryCard } from '@/components/gallery';
import type { GalleryImage } from '@/components/gallery';

const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || 'http://localhost:4000/uploads';

interface ArtistDetailProps {
  artist: {
    id: number;
    name: string;
    bio: string | null;
    portraitPath: string | null;
    instagramUrl: string | null;
  };
  images: GalleryImage[];
}

export function ArtistDetail({ artist, images }: ArtistDetailProps) {
  const [filter, setFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = images.filter((img) => {
    if (filter && img.category !== filter) return false;
    if (projectFilter && img.projectId !== Number(projectFilter)) return false;
    return true;
  });

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

  const handleProjectFilter = useCallback(
    (value: string) => {
      if (value === projectFilter) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setProjectFilter(value);
        return;
      }
      setVisible(false);
      setTimeout(() => {
        setProjectFilter(value);
        requestAnimationFrame(() => setVisible(true));
      }, 300);
    },
    [projectFilter],
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
          <div className="flex items-center gap-3 mb-4">
            <h1 className="font-serif text-4xl md:text-5xl">{artist.name}</h1>
            {artist.instagramUrl && artist.instagramUrl.startsWith('https://') && (
              <a
                href={artist.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gallery-gray hover:text-gallery-accent transition-colors"
                aria-label={`${artist.name} on Instagram`}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            )}
          </div>
          {artist.bio && <p className="text-gallery-gray leading-relaxed text-lg">{artist.bio}</p>}
        </div>
      </div>

      {/* Works section */}
      {images.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl mb-8">Works by {artist.name}</h2>
          <FilterToolbar
            value={filter}
            onChange={handleFilter}
            projectValue={projectFilter}
            onProjectChange={handleProjectFilter}
            artistId={artist.id}
            className="mb-8"
          />

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
