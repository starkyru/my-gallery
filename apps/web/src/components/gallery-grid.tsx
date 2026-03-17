'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { api } from '@/lib/api';

gsap.registerPlugin(ScrollTrigger);

const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || 'http://localhost:4000/uploads';

interface GalleryImage {
  id: number;
  title: string;
  price: number;
  thumbnailPath: string;
  watermarkPath: string;
  width: number;
  height: number;
  category: string;
  blurHash?: string | null;
  artist?: { name: string };
}

function GalleryCard({ image, index }: { image: GalleryImage; index: number }) {
  const [loaded, setLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!cardRef.current) return;

    const ctx = gsap.context(() => {
      // Parallax depth — cards shift slightly on scroll for layered feel
      gsap.to(cardRef.current, {
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
        y: -20 - (index % 3) * 10,
        ease: 'none',
      });
    }, cardRef);

    return () => ctx.revert();
  }, [index]);

  return (
    <Link href={`/gallery/${image.id}`} className="gallery-card block break-inside-avoid group">
      <div ref={cardRef} className="relative overflow-hidden rounded-lg bg-white/5">
        <div
          className={`transition-all duration-1000 ease-out ${
            loaded ? 'blur-0 scale-100' : 'blur-sm scale-[1.02]'
          }`}
        >
          <Image
            src={`${UPLOAD_URL}/${image.watermarkPath}`}
            alt={image.title}
            width={image.width}
            height={image.height}
            className="w-full h-auto transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onLoad={() => setLoaded(true)}
          />
        </div>

        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Subtle always-visible bottom vignette for readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-0 pointer-events-none" />

        {/* Hover info */}
        <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
          <h3 className="font-serif text-lg leading-tight">{image.title}</h3>
          <p className="text-gallery-gray text-sm mt-1">
            {image.artist?.name} &middot; ${image.price}
          </p>
        </div>

        {/* Hover border glow */}
        <div className="absolute inset-0 rounded-lg ring-1 ring-white/0 group-hover:ring-gallery-accent/30 transition-all duration-500 pointer-events-none" />
      </div>
    </Link>
  );
}

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [filter, setFilter] = useState('');
  const [visible, setVisible] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const prevFilter = useRef('');
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([
    { label: 'All', value: '' },
  ]);

  useEffect(() => {
    api.categories
      .list()
      .then((cats) => {
        setCategories([
          { label: 'All', value: '' },
          ...cats.map((c) => ({ label: c.name, value: c.slug })),
        ]);
      })
      .catch(() => {});
  }, []);

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

  return (
    <section id="works" className="mx-auto max-w-7xl px-6 py-24">
      {/* Category filter */}
      <div className="flex flex-wrap gap-3 mb-12 justify-center">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleFilter(cat.value)}
            className={`px-4 py-2 text-sm rounded-full border transition-all duration-300 ${
              filter === cat.value
                ? 'border-gallery-accent text-gallery-accent bg-gallery-accent/10'
                : 'border-white/10 text-gallery-gray hover:border-white/30 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

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
