'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FilterToolbar } from '../filter-toolbar';
import { GalleryCard } from './gallery-card';
import { SkeletonGrid } from './skeleton-grid';
import type { GalleryImage } from './types';

gsap.registerPlugin(ScrollTrigger);

export function GalleryGrid({
  images,
  loading,
  initialTags,
}: {
  images: GalleryImage[];
  loading?: boolean;
  initialTags?: string[];
}) {
  const [filter, setFilter] = useState('');
  const [artistFilter, setArtistFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>(initialTags ?? []);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string[]>([]);
  const [paintTypeFilter, setPaintTypeFilter] = useState<string[]>([]);
  const [visible, setVisible] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const prevFilter = useRef('');

  const filtered = useMemo(
    () =>
      images.filter((img) => {
        if (filter && img.category !== filter) return false;
        if (artistFilter && img.artist.id !== Number(artistFilter)) return false;
        if (projectFilter && img.projectId !== Number(projectFilter)) return false;
        if (tagFilter.length > 0) {
          const imgSlugs = (img.tags ?? []).map((t) => t.slug);
          if (!tagFilter.some((slug) => imgSlugs.includes(slug))) return false;
        }
        if (mediaTypeFilter.length > 0) {
          const slugs = (img.mediaTypes ?? []).map((m) => m.slug);
          if (!mediaTypeFilter.some((slug) => slugs.includes(slug))) return false;
        }
        if (paintTypeFilter.length > 0) {
          const slugs = (img.paintTypes ?? []).map((p) => p.slug);
          if (!paintTypeFilter.some((slug) => slugs.includes(slug))) return false;
        }
        return true;
      }),
    [images, filter, artistFilter, projectFilter, tagFilter, mediaTypeFilter, paintTypeFilter],
  );

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

  const handleTagFilter = useCallback((values: string[]) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTagFilter(values);
    } else {
      setVisible(false);
      setTimeout(() => {
        setTagFilter(values);
        requestAnimationFrame(() => setVisible(true));
      }, 300);
    }
    // Update URL without navigation
    const url = new URL(window.location.href);
    if (values.length > 0) {
      url.searchParams.set('tags', values.join(','));
    } else {
      url.searchParams.delete('tags');
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  // GSAP scroll-triggered entrance
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!gridRef.current) return;

    let ctx: gsap.Context | undefined;

    // Small delay so DOM is ready after filter change
    const timeout = setTimeout(() => {
      const cards = gridRef.current?.querySelectorAll('.gallery-card');
      if (!cards) return;

      ctx = gsap.context(() => {
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
    }, 50);

    return () => {
      clearTimeout(timeout);
      ctx?.revert();
    };
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
      {/* Category + tag filters */}
      <FilterToolbar
        value={filter}
        onChange={handleFilter}
        className="mt-8 mb-12 justify-center"
        artistValue={artistFilter}
        onArtistChange={(v) => {
          setArtistFilter(v);
          setProjectFilter('');
        }}
        projectValue={projectFilter}
        onProjectChange={setProjectFilter}
        tagValues={tagFilter}
        onTagChange={handleTagFilter}
        mediaTypeValues={mediaTypeFilter}
        onMediaTypeChange={setMediaTypeFilter}
        paintTypeValues={paintTypeFilter}
        onPaintTypeChange={setPaintTypeFilter}
      />

      {/* Image count + reset */}
      <div className="text-center text-gallery-gray text-sm mb-8 transition-opacity duration-300">
        {filtered.length} {filtered.length === 1 ? 'work' : 'works'}
        {(filter ||
          artistFilter ||
          projectFilter ||
          tagFilter.length > 0 ||
          mediaTypeFilter.length > 0 ||
          paintTypeFilter.length > 0) && (
          <button
            onClick={() => {
              setFilter('');
              setArtistFilter('');
              setProjectFilter('');
              handleTagFilter([]);
              setMediaTypeFilter([]);
              setPaintTypeFilter([]);
            }}
            className="ml-3 text-gallery-accent hover:text-gallery-accent-light transition-colors"
          >
            Reset filters
          </button>
        )}
      </div>

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
