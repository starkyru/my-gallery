'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useImages } from '@/hooks/useImages';
import { useImageCache } from '@/hooks/useImageCache';
import { api } from '@/lib/api';
import { shuffleArray } from '@gallery/shared';
import type { Artist } from '@gallery/shared';
import type { GalleryImage } from '@/components/gallery/types';
import { Tile } from '@/components/overtone/tile';
import { Mosaic } from '@/components/overtone/mosaic';
import { Flourish } from '@/components/overtone/flourish';
import { AboutStrip } from '@/components/about/about-strip';

export default function HomePage() {
  const { images, loading: imagesLoading } = useImages();
  const imageCache = useImageCache();
  const [artists, setArtists] = useState<Artist[]>([]);

  useEffect(() => {
    let cancelled = false;
    api.artists.list().then((arts) => {
      if (!cancelled) setArtists(arts.filter((a: Artist) => a.isActive));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!imagesLoading && images.length > 0) {
      imageCache.setAll(images);
    }
  }, [imagesLoading, images, imageCache]);

  const shuffled = useMemo(() => shuffleArray(images), [images]);
  const heroSet = shuffled.slice(0, 6);
  const mosaicSet = shuffled.slice(6, 14);

  if (imagesLoading) return null;

  return (
    <>
      {/* HERO */}
      <HeroSection images={heroSet} />

      {/* MOSAIC */}
      <section className="px-5 md:px-7 lg:px-10 py-8 md:py-12 lg:py-14">
        <Mosaic images={mosaicSet} columns={6} gap={8} />
      </section>

      {/* ABOUT STRIP */}
      <AboutStrip artists={artists} />

      {/* FILTER STRIP */}
      <FilterStrip images={images} />
    </>
  );
}

/* ---- Hero ---- */

function HeroSection({ images }: { images: GalleryImage[] }) {
  return (
    <section className="relative px-5 md:px-7 lg:px-10 pt-8 md:pt-12 lg:pt-14">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-6 md:gap-9 lg:gap-14 items-center">
        {/* Left: headline */}
        <div className="relative pb-5 md:pb-[60px]">
          <h1 className="ot-display text-[56px] md:text-[72px] lg:text-[88px] m-0 leading-[1.02] tracking-[-0.01em]">
            Art that <br />
            speaks in <span className="text-ot-ochre italic">colors</span>
            <br />
            and moments.
          </h1>
          <Flourish width={120} className="mt-[26px]" />
          <div className="ot-eyebrow mt-[18px] tracking-[0.32em]">Paintings &amp; Photography</div>
          <p className="font-serif italic text-lg text-ot-ink-soft mt-3.5">
            Seen. Felt. Remembered.
          </p>
          <div className="mt-[30px]">
            <Link href="/photographs" className="ot-btn">
              Explore Gallery
            </Link>
          </div>
        </div>

        {/* Right: photo cluster */}
        <div className="hidden md:grid grid-cols-3 grid-rows-2 gap-3 h-[420px] lg:h-[520px]">
          {images.slice(0, 6).map((img) => (
            <Tile key={img.id} image={img} fill showMeta={false} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---- Filter strip ---- */

function FilterStrip({ images }: { images: GalleryImage[] }) {
  const [tab, setTab] = useState<'All' | 'Photographs' | 'Paintings'>('All');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const base = useMemo(() => {
    if (tab === 'All') return images;
    return images.filter((w) =>
      tab === 'Photographs' ? w.type === 'photo' : w.type === 'painting',
    );
  }, [images, tab]);

  const tags = useMemo(() => {
    const counts: Record<string, number> = {};
    base.forEach((w) =>
      w.tags?.forEach((t) => {
        counts[t.name] = (counts[t.name] || 0) + 1;
      }),
    );
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t);
  }, [base]);

  const filtered = useMemo(() => {
    if (!activeTag) return base;
    return base.filter((w) => w.tags?.some((wt) => wt.name === activeTag));
  }, [base, activeTag]);

  return (
    <section className="py-[60px] md:py-20">
      <div className="px-5 md:px-7 lg:px-10">
        {/* Tabs */}
        <div className="flex gap-7 justify-center mb-[22px]">
          {(['All', 'Photographs', 'Paintings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setActiveTag(null);
              }}
              className="bg-transparent border-none cursor-pointer py-1.5 px-1 font-sans text-xs tracking-[0.22em] uppercase transition-colors"
              style={{
                color: tab === t ? 'var(--color-ot-ochre-deep)' : 'var(--color-ot-ink)',
                borderBottom:
                  tab === t ? '1px solid var(--color-ot-ochre)' : '1px solid transparent',
                fontWeight: tab === t ? 500 : 400,
              }}
            >
              {t === 'All' ? 'All Works' : t}
            </button>
          ))}
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 justify-center max-w-[980px] mx-auto mb-9">
          <button
            className={`ot-chip ${!activeTag ? 'active' : ''}`}
            onClick={() => setActiveTag(null)}
          >
            All
          </button>
          {tags.slice(0, 16).map((t) => (
            <button
              key={t}
              className={`ot-chip ${activeTag === t ? 'active' : ''}`}
              onClick={() => setActiveTag((prev) => (prev === t ? null : t))}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1.5 md:gap-2">
          {filtered.slice(0, 12).map((w) => (
            <Tile key={w.id} image={w} aspect={1} />
          ))}
        </div>

        <div className="flex justify-center mt-9">
          <Link href="/photographs" className="ot-btn ot-btn--ghost">
            View More Works
          </Link>
        </div>
      </div>
    </section>
  );
}
