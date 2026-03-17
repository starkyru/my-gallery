'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FilterToolbar } from '../filter-toolbar';
import { GalleryCard } from './gallery-card';
import { SkeletonGrid } from './skeleton-grid';
import type { GalleryImage } from './types';

gsap.registerPlugin(ScrollTrigger);

export function GalleryGrid({ images, loading }: { images: GalleryImage[]; loading?: boolean }) {
  const [filter, setFilter] = useState('');
  const [visible, setVisible] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const prevFilter = useRef('');

  const filtered = filter ? images.filter((img) => img.category === filter) : images;

  const handleFilter = useCallback(
    (value: string) => {
      if (value === filter) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setFilter(value);
        return;
      }
      // Fade out, swap, fade in
      setVisible(false);
      setTimeout(() => {
        setFilter(value);
        prevFilter.current = value;
        // Let React render new items, then fade in
        requestAnimationFrame(() => setVisible(true));
      }, 300);
    },
    [filter],
  );

  // GSAP scroll-triggered entrance
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!gridRef.current) return;

    // Small delay so DOM is ready after filter change
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

  if (loading) {
    return (
      <section id="works" className="mx-auto max-w-7xl px-6 py-24">
        <SkeletonGrid />
      </section>
    );
  }

  return (
    <section id="works" className="mx-auto max-w-7xl px-6 py-24">
      {/* Category filter */}
      <FilterToolbar value={filter} onChange={handleFilter} className="mb-12 justify-center" />

      {/* Image count */}
      <p className="text-center text-gallery-gray text-sm mb-8 transition-opacity duration-300">
        {filtered.length} {filtered.length === 1 ? 'work' : 'works'}
      </p>

      {/* Grid with fade transition */}
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
  );
}
