'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import Image from 'next/image';
import type { GalleryImage } from './types';
import { ImageInfoOverlay } from './image-info-overlay';
import { UPLOAD_URL } from '@/config';
import { ShareIcon } from '@/components/icons/share-icon';
import { ArrowDownIcon } from '@/components/icons/arrow-down-icon';
import { useWalls } from '@/hooks/useWalls';

gsap.registerPlugin(ScrollTrigger);

interface GalleryHeroProps {
  images: GalleryImage[];
}

const BG_COLORS = [
  { color: '#ffffff', label: 'White' },
  { color: '#808080', label: 'Gray' },
  { color: '#d4c5a9', label: 'Beige' },
  { color: '#000000', label: 'Black' },
];

export function GalleryHero({ images }: GalleryHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bgColor, setBgColor] = useState('#000000');
  const { walls, selectedWall, selectWall } = useWalls();

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
    <section
      ref={containerRef}
      className="relative h-screen overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: selectedWall ? undefined : bgColor,
        backgroundImage: selectedWall ? `url(${UPLOAD_URL}/${selectedWall.imagePath})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {hasImages ? (
        <div ref={emblaRef} className="h-full overflow-hidden">
          <div className="flex h-full">
            {images.map((img) => (
              <Link
                key={img.id}
                href={`/gallery/${img.id}`}
                className="relative block h-full min-w-0 flex-[0_0_100%]"
                aria-label={`View ${img.title}`}
              >
                <img
                  src={`${UPLOAD_URL}/${img.watermarkPath}`}
                  alt={img.title}
                  className="h-full w-full object-contain"
                />
                <div className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-2 text-white/80">
                  <ShareIcon />
                </div>
                <ImageInfoOverlay
                  title={img.title}
                  projectName={img.project?.name}
                  artistName={img.artist.name}
                />
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-full bg-black" />
      )}

      {/* Background selection */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1.5">
        {walls.length > 0
          ? walls.map((wall) => (
              <button
                key={wall.id}
                type="button"
                onClick={() => selectWall(wall)}
                className={`relative w-8 h-8 rounded overflow-hidden border-2 transition-all duration-200 ${
                  selectedWall?.id === wall.id
                    ? 'border-gallery-accent scale-110'
                    : 'border-white/30 hover:border-white/60'
                }`}
                aria-label={wall.name}
                title={wall.name}
              >
                <Image
                  src={`${UPLOAD_URL}/${wall.thumbnailPath}`}
                  alt={wall.name}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </button>
            ))
          : BG_COLORS.map(({ color, label }) => (
              <button
                key={color}
                type="button"
                onClick={() => setBgColor(color)}
                className={`w-8 h-8 rounded border transition-all duration-200 ${
                  bgColor === color
                    ? 'border-gallery-accent scale-110'
                    : 'border-white/30 hover:border-white/60'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`${label} background`}
                title={`${label} background`}
              />
            ))}
      </div>

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
