'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '@/config';
import type { GalleryImage } from './types';

gsap.registerPlugin(ScrollTrigger);

interface GalleryHeroProps {
  images: GalleryImage[];
}

export function GalleryHero({ images }: GalleryHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);

  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
      });
      gsap.from(subtitleRef.current, {
        y: 40,
        opacity: 0,
        duration: 1,
        delay: 0.3,
        ease: 'power3.out',
      });

      gsap.to(containerRef.current, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
        y: 100,
        opacity: 0.3,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const hasImages = images.length > 0;

  return (
    <section ref={containerRef} className="relative min-h-screen overflow-hidden">
      {hasImages ? (
        <div ref={emblaRef} className="absolute inset-0">
          <div className="flex h-full">
            {images.map((img) => (
              <div key={img.id} className="relative min-w-0 flex-[0_0_100%]">
                <img
                  src={img.watermarkPath}
                  alt={img.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 bg-black" />
      )}

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1
          ref={titleRef}
          className="font-serif text-5xl tracking-tight text-white md:text-7xl lg:text-8xl"
        >
          {config.galleryName}
        </h1>
        <p ref={subtitleRef} className="mt-6 max-w-xl text-lg text-white/80 md:text-xl">
          {config.galleryDescription}
        </p>
      </div>

      {hasImages && images.length > 1 && (
        <div className="absolute bottom-20 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {images.map((_, i) => (
            <DotButton key={i} index={i} emblaApi={emblaApi} onClick={() => scrollTo(i)} />
          ))}
        </div>
      )}

      <div className="absolute bottom-12 left-1/2 z-10 -translate-x-1/2 animate-bounce">
        <svg
          className="h-6 w-6 text-white/70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
}

function DotButton({
  index,
  emblaApi,
  onClick,
}: {
  index: number;
  emblaApi: ReturnType<typeof useEmblaCarousel>[1];
  onClick: () => void;
}) {
  const { selectedIndex } = useSelectedIndex(emblaApi);
  const isActive = selectedIndex === index;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-2.5 w-2.5 rounded-full transition-colors ${
        isActive ? 'bg-white' : 'bg-white/40'
      }`}
      aria-label={`Go to slide ${index + 1}`}
    />
  );
}

function useSelectedIndex(emblaApi: ReturnType<typeof useEmblaCarousel>[1]) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  return { selectedIndex };
}
