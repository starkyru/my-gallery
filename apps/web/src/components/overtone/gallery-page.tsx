'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { GalleryImage } from '@/components/gallery/types';
import { Tile } from './tile';
import { Flourish } from './flourish';

type SortMode = 'recent' | 'price-asc' | 'price-desc';

interface GalleryPageContentProps {
  images: GalleryImage[];
  medium: 'photo' | 'painting';
}

export function GalleryPageContent({ images, medium }: GalleryPageContentProps) {
  const title = medium === 'photo' ? 'Photographs' : 'Paintings';
  const blurb =
    medium === 'photo'
      ? 'Limited-edition prints by Ilia. Printed on Hahnemuhle Photo Rag, signed and numbered, shipped flat from the studio.'
      : 'Original acrylic paintings by Sveta. Each piece is one-of-one, finished with a UV-protective varnish.';

  const allOfMedium = useMemo(() => images.filter((w) => w.type === medium), [images, medium]);

  const categories = useMemo(() => {
    const c: Record<string, number> = {};
    allOfMedium.forEach((w) => {
      c[w.category] = (c[w.category] || 0) + 1;
    });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [allOfMedium]);

  const [category, setCategory] = useState('All');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const categoryFiltered = useMemo(
    () => (category === 'All' ? allOfMedium : allOfMedium.filter((w) => w.category === category)),
    [allOfMedium, category],
  );

  const tags = useMemo(() => {
    const c: Record<string, number> = {};
    categoryFiltered.forEach((w) =>
      w.tags?.forEach((t) => {
        c[t.name] = (c[t.name] || 0) + 1;
      }),
    );
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [categoryFiltered]);
  const [sort, setSort] = useState<SortMode>('recent');

  // Reset active tag when it's no longer available in current category
  useEffect(() => {
    if (activeTags.length > 0) {
      const tagNames = new Set(tags.map(([t]) => t));
      if (!tagNames.has(activeTags[0])) {
        setActiveTags([]);
      }
    }
  }, [tags, activeTags]);

  const filtered = useMemo(() => {
    let r = categoryFiltered;
    if (activeTags.length)
      r = r.filter((w) => activeTags.every((t) => w.tags?.some((wt) => wt.name === t)));
    if (sort === 'price-asc') r = [...r].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') r = [...r].sort((a, b) => b.price - a.price);
    if (sort === 'recent') r = [...r].sort((a, b) => b.id - a.id);
    return r;
  }, [categoryFiltered, activeTags, sort]);

  function toggleTag(t: string) {
    setActiveTags((p) => (p.includes(t) ? [] : [t]));
  }

  return (
    <main>
      {/* Hero */}
      <section className="pt-10 md:pt-16 pb-6 md:pb-9">
        <div className="px-5 md:px-7 lg:px-10 text-center">
          <div className="ot-eyebrow mb-[18px]">Catalogue &middot; {filtered.length} works</div>
          <h1 className="ot-display text-[56px] md:text-[84px] lg:text-[104px] m-0 leading-[1.02]">
            {title.split('').map((c, i) =>
              i === 0 ? (
                <span key={i} className="text-ot-ochre italic">
                  {c}
                </span>
              ) : (
                c
              ),
            )}
          </h1>
          <Flourish width={100} className="mx-auto mt-5" />
          <p className="text-[15px] text-ot-ink-soft leading-relaxed mt-[22px] max-w-[540px] mx-auto">
            {blurb}
          </p>
        </div>
      </section>

      <section className="px-5 md:px-7 lg:px-10 pt-3 pb-8">
        {/* Medium toggle */}
        <div className="flex gap-7 justify-center mb-[22px]">
          {[
            { key: 'photo', label: 'Photographs', href: '/photographs' },
            { key: 'painting', label: 'Paintings', href: '/paintings' },
          ].map(({ key, label, href }) => (
            <Link
              key={key}
              href={href}
              className="bg-transparent border-none cursor-pointer py-1.5 px-1 font-sans text-xs tracking-[0.22em] uppercase no-underline transition-colors"
              style={{
                color: medium === key ? 'var(--color-ot-ochre-deep)' : 'var(--color-ot-ink)',
                borderBottom:
                  medium === key ? '1px solid var(--color-ot-ochre)' : '1px solid transparent',
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 justify-center max-w-[980px] mx-auto mb-3.5">
          <button
            className={`ot-chip ${category === 'All' ? 'active' : ''}`}
            onClick={() => setCategory('All')}
          >
            All <span className="count">{allOfMedium.length}</span>
          </button>
          {categories.map(([c, n]) => (
            <button
              key={c}
              className={`ot-chip ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c} <span className="count">{n}</span>
            </button>
          ))}
        </div>

        {/* Tag chips */}
        <div className="flex flex-wrap gap-2 justify-center max-w-[980px] mx-auto mb-7">
          {tags.slice(0, 14).map(([t]) => (
            <button
              key={t}
              className={`ot-chip ${activeTags.includes(t) ? 'active' : ''}`}
              onClick={() => toggleTag(t)}
            >
              {t}
            </button>
          ))}
          {activeTags.length > 0 && (
            <button
              className="ot-chip"
              onClick={() => setActiveTags([])}
              style={{ color: 'var(--color-ot-terra)', borderColor: 'var(--color-ot-terra)' }}
            >
              Clear &times;
            </button>
          )}
        </div>

        {/* Sort bar */}
        <div className="flex justify-between items-center py-4 border-t border-b border-ot-line-soft mb-7 flex-wrap gap-3">
          <div className="ot-meta">
            {filtered.length} works &middot; {category}
            {activeTags.length > 0 && ` \u00b7 ${activeTags.join(', ')}`}
          </div>
          <div className="flex items-center gap-2">
            <span className="ot-meta">Sort</span>
            {(
              [
                ['recent', 'Recent'],
                ['price-asc', '$ low \u2192 high'],
                ['price-desc', '$ high \u2192 low'],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className={`ot-chip ${sort === k ? 'active' : ''}`}
                style={{ height: 26, padding: '0 12px', fontSize: 11 }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-ot-mute">
            <div className="ot-display text-[40px] italic mb-3">Nothing here yet.</div>
            <p className="text-sm">Try removing a tag or switching categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {filtered.map((w) => (
              <Tile key={w.id} image={w} aspect={1} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
