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
  initialCategory,
  initialTags,
  initialMediaType,
  initialPaintType,
}: {
  images: GalleryImage[];
  loading?: boolean;
  initialCategory?: string;
  initialTags?: string[];
  initialMediaType?: string;
  initialPaintType?: string;
}) {
  const [filter, setFilter] = useState(initialCategory ?? '');
  const [artistFilter, setArtistFilter] = useState<string[]>([]);
  const [projectFilter, setProjectFilter] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>(initialTags ?? []);
  const [mediaTypeFilter, setMediaTypeFilter] = useState(initialMediaType ?? '');
  const [paintTypeFilter, setPaintTypeFilter] = useState(initialPaintType ?? '');
  const [visible, setVisible] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const prevFilter = useRef('');

  const matchesFilters = useCallback(
    (img: GalleryImage, skip?: 'category' | 'tag' | 'media' | 'paint') => {
      if (skip !== 'category' && filter && img.category !== filter) return false;
      if (artistFilter.length > 0 && !artistFilter.includes(String(img.artist.id))) return false;
      if (projectFilter && img.projectId !== Number(projectFilter)) return false;
      if (skip !== 'tag' && tagFilter.length > 0) {
        const imgSlugs = (img.tags ?? []).map((t) => t.slug);
        if (!tagFilter.some((slug) => imgSlugs.includes(slug))) return false;
      }
      if (skip !== 'media' && mediaTypeFilter) {
        const slugs = (img.mediaTypes ?? []).map((m) => m.slug);
        if (!slugs.includes(mediaTypeFilter)) return false;
      }
      if (skip !== 'paint' && paintTypeFilter) {
        const slugs = (img.paintTypes ?? []).map((p) => p.slug);
        if (!slugs.includes(paintTypeFilter)) return false;
      }
      return true;
    },
    [filter, artistFilter, projectFilter, tagFilter, mediaTypeFilter, paintTypeFilter],
  );

  const filtered = useMemo(
    () => images.filter((img) => matchesFilters(img)),
    [images, matchesFilters],
  );

  // Compute which filter values would yield results given other active filters
  const availableFilters = useMemo(() => {
    const categories = new Set<string>();
    const tags = new Set<string>();
    const mediaTypes = new Set<string>();
    const paintTypes = new Set<string>();

    for (const img of images) {
      if (matchesFilters(img, 'category')) categories.add(img.category);
      if (matchesFilters(img, 'tag')) {
        for (const t of img.tags ?? []) tags.add(t.slug);
      }
      if (matchesFilters(img, 'media')) {
        for (const m of img.mediaTypes ?? []) mediaTypes.add(m.slug);
      }
      if (matchesFilters(img, 'paint')) {
        for (const p of img.paintTypes ?? []) paintTypes.add(p.slug);
      }
    }

    return { categories, tags, mediaTypes, paintTypes };
  }, [images, matchesFilters]);

  const updateUrl = useCallback((key: string, value: string) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  const handleFilter = useCallback(
    (value: string) => {
      if (value === filter) return;
      const apply = () => {
        setFilter(value);
        prevFilter.current = value;
        updateUrl('category', value);
      };
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        apply();
        return;
      }
      setVisible(false);
      setTimeout(() => {
        apply();
        requestAnimationFrame(() => setVisible(true));
      }, 300);
    },
    [filter, updateUrl],
  );

  const handleSingleFilter = useCallback(
    (setter: (v: string) => void, urlKey: string) => (value: string) => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) {
        setter(value);
      } else {
        setVisible(false);
        setTimeout(() => {
          setter(value);
          requestAnimationFrame(() => setVisible(true));
        }, 300);
      }
      updateUrl(urlKey, value);
    },
    [updateUrl],
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
    const url = new URL(window.location.href);
    if (values.length > 0) {
      url.searchParams.set('tags', values.join(','));
    } else {
      url.searchParams.delete('tags');
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  const handleMediaTypeFilter = useMemo(
    () => handleSingleFilter(setMediaTypeFilter, 'media'),
    [handleSingleFilter],
  );
  const handlePaintTypeFilter = useMemo(
    () => handleSingleFilter(setPaintTypeFilter, 'paint'),
    [handleSingleFilter],
  );

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
        artistValues={artistFilter}
        onArtistChange={(v) => {
          setArtistFilter(v);
          setProjectFilter('');
        }}
        projectValue={projectFilter}
        onProjectChange={setProjectFilter}
        tagValues={tagFilter}
        onTagChange={handleTagFilter}
        mediaTypeValue={mediaTypeFilter}
        onMediaTypeChange={handleMediaTypeFilter}
        paintTypeValue={paintTypeFilter}
        onPaintTypeChange={handlePaintTypeFilter}
        availableFilters={availableFilters}
      />

      {/* Image count + reset */}
      <div className="text-center text-gallery-gray text-sm mb-8 transition-opacity duration-300">
        {filtered.length} {filtered.length === 1 ? 'work' : 'works'}
        {(filter ||
          artistFilter.length > 0 ||
          projectFilter ||
          tagFilter.length > 0 ||
          mediaTypeFilter ||
          paintTypeFilter) && (
          <button
            onClick={() => {
              setFilter('');
              updateUrl('category', '');
              setArtistFilter([]);
              setProjectFilter('');
              handleTagFilter([]);
              handleMediaTypeFilter('');
              handlePaintTypeFilter('');
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
