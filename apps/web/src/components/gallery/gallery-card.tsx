'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { GalleryImage } from './types';
import { UPLOAD_URL } from '@/config';

gsap.registerPlugin(ScrollTrigger);

export function GalleryCard({ image, index }: { image: GalleryImage; index: number }) {
  const [loaded, setLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/artists/${image.artist.slug}`);
              }}
              className="hover:text-gallery-accent transition-colors cursor-pointer"
            >
              {image.artist.name}
            </span>{' '}
            &middot; ${image.price}
          </p>
        </div>

        {/* Hover border glow */}
        <div className="absolute inset-0 rounded-lg ring-1 ring-white/0 group-hover:ring-gallery-accent/30 transition-all duration-500 pointer-events-none" />
      </div>
    </Link>
  );
}
