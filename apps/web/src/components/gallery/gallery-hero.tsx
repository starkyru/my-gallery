'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import type { GalleryImage } from './types';
import { UPLOAD_URL } from '@/config';
import { ArrowUpRightIcon } from '@/components/icons/arrow-up-right-icon';
import { ArrowDownIcon } from '@/components/icons/arrow-down-icon';

gsap.registerPlugin(ScrollTrigger);

interface GalleryHeroProps {
  images: GalleryImage[];
}

export function GalleryHero({ images }: GalleryHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 15000, stopOnInteraction: false }),
  ]);

  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
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
    <section ref={containerRef} className="relative h-screen overflow-hidden">
      {hasImages ? (
        <div ref={emblaRef} className="h-full overflow-hidden">
          <div className="flex h-full">
            {images.map((img) => (
              <div key={img.id} className="relative h-full min-w-0 flex-[0_0_100%]">
                <img
                  src={`${UPLOAD_URL}/${img.watermarkPath}`}
                  alt={img.title}
                  className="h-full w-full object-contain"
                />
                <Link
                  href={`/gallery/${img.id}`}
                  className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-2 text-white/80 transition-colors hover:bg-black/60 hover:text-white"
                  aria-label={`View ${img.title}`}
                >
                  <ArrowUpRightIcon />
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-full bg-black" />
      )}

      {hasImages && images.length > 1 && (
        <div className="absolute bottom-20 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {images.map((_, i) => (
            <DotButton key={i} index={i} emblaApi={emblaApi} onClick={() => scrollTo(i)} />
          ))}
        </div>
      )}

      <div className="absolute bottom-12 left-1/2 z-10 -translate-x-1/2 animate-bounce text-white/70">
        <ArrowDownIcon />
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
