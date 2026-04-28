'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth';
import gsap from 'gsap';
import type { ImagePrintOption } from '@gallery/shared';
import { UPLOAD_URL } from '@/config';
import { BuyModal } from './buy-modal';
import { SidePanel } from './side-panel';
import { BottomOverlay } from './bottom-overlay';
import { EditIcon } from '@/components/icons/edit-icon';
import { useArSupport } from '@/hooks/useArSupport';
import { useWalls } from '@/hooks/useWalls';
import { blurhashToDataURL } from '@/lib/blurhash';

const WallPreview = dynamic(() => import('@/components/wall-preview').then((m) => m.WallPreview), {
  ssr: false,
});
const ArViewer = dynamic(() => import('@/components/ar-viewer').then((m) => m.ArViewer), {
  ssr: false,
});

interface ImageDetailProps {
  image: {
    id: number;
    title: string;
    description: string | null;
    price: number;
    watermarkPath: string;
    thumbnailPath: string;
    width: number;
    height: number;
    category: string;
    artist: { id: number; name: string; slug: string; bio: string | null };
    allowDownloadOriginal: boolean;
    printEnabled: boolean;
    printLimit: number | null;
    printsSold: number;
    perOptionLimits: boolean;
    printOptions: ImagePrintOption[];
    tags?: { id: number; name: string; slug: string }[];
    mediaTypes?: { id: number; name: string; slug: string }[];
    paintTypes?: { id: number; name: string; slug: string }[];
    shotDate?: string | null;
    place?: string | null;
    sizeWidthCm?: number | null;
    sizeHeightCm?: number | null;
    originalAvailable?: boolean;
    blurHash?: string | null;
    type?: string;
    project?: { id: number; name: string; slug: string } | null;
  };
}

export function ImageDetail({ image }: ImageDetailProps) {
  const isAdmin = useAuthStore((s) => s.role === 'admin');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [wallPreviewOpen, setWallPreviewOpen] = useState(false);
  const [arViewerOpen, setArViewerOpen] = useState(false);
  const [bgColor, setBgColor] = useState('#000000');
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { supported: arSupported, mode: arMode } = useArSupport();
  const { walls, selectedWall, selectWall } = useWalls();
  const blurDataURL = image.blurHash ? blurhashToDataURL(image.blurHash) : undefined;

  const hasBuyOptions =
    image.allowDownloadOriginal ||
    image.originalAvailable ||
    (image.printEnabled && image.printOptions?.length > 0);

  const printOptionsWithDimensions = (image.printOptions ?? []).filter(
    (o) => Number(o.widthCm) > 0 && Number(o.heightCm) > 0,
  );

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.from(overlayRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.4,
        ease: 'power3.out',
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="relative h-full w-full transition-colors duration-300"
        style={{
          backgroundColor: selectedWall ? undefined : bgColor,
          backgroundImage: selectedWall
            ? `url(${UPLOAD_URL}/${selectedWall.imagePath})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Admin edit link */}
        {isAdmin && (
          <a
            href={`/admin/images/${image.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-4 z-20 rounded-full bg-white/15 p-2.5 text-white backdrop-blur-sm hover:bg-gallery-accent hover:text-gallery-black transition-colors duration-300"
            title="Edit image"
          >
            <EditIcon size={18} />
          </a>
        )}

        {/* Full-screen image */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-out ${
            imageLoaded ? 'blur-0 scale-100 opacity-100' : 'blur-md scale-[1.02] opacity-0'
          }`}
        >
          {/* Invisible spacer to reserve layout before image loads */}
          <img
            src={`${UPLOAD_URL}/${image.watermarkPath}`}
            alt=""
            width={image.width}
            height={image.height}
            className="h-full w-full object-contain invisible"
            aria-hidden="true"
          />
          <Image
            src={`${UPLOAD_URL}/${image.watermarkPath}`}
            alt={image.title}
            width={image.width}
            height={image.height}
            className="absolute inset-0 h-full w-full object-contain"
            priority
            placeholder={blurDataURL ? 'blur' : 'empty'}
            blurDataURL={blurDataURL}
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* Side panel — background color + action buttons */}
        <SidePanel
          walls={walls}
          selectedWall={selectedWall}
          selectWall={selectWall}
          bgColor={bgColor}
          setBgColor={setBgColor}
          printOptionsWithDimensions={printOptionsWithDimensions}
          onWallPreview={() => setWallPreviewOpen(true)}
          arSupported={arSupported}
          onArView={() => setArViewerOpen(true)}
          hasBuyOptions={hasBuyOptions}
          onBuy={() => setBuyOpen(true)}
        />

        {/* Bottom overlay — info accordion */}
        <BottomOverlay ref={overlayRef} image={image} />
      </div>

      <BuyModal open={buyOpen} onClose={() => setBuyOpen(false)} image={image} />

      {/* Wall Preview */}
      <WallPreview
        open={wallPreviewOpen}
        onClose={() => setWallPreviewOpen(false)}
        imageUrl={`${UPLOAD_URL}/${image.watermarkPath}`}
        imageWidth={image.width}
        imageHeight={image.height}
        printOptions={printOptionsWithDimensions}
      />

      {/* AR Viewer */}
      <ArViewer
        open={arViewerOpen}
        onClose={() => setArViewerOpen(false)}
        imageUrl={`${UPLOAD_URL}/${image.watermarkPath}`}
        imageWidth={image.width}
        imageHeight={image.height}
        mode={arMode}
      />
    </>
  );
}
