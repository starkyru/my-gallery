'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import type { ImagePrintOption } from '@gallery/shared';
import { UPLOAD_URL } from '@/config';
import { BuyModal } from './buy-modal';
import { EditIcon } from '@/components/icons/edit-icon';
import { useArSupport } from '@/hooks/useArSupport';
import { useImages } from '@/hooks/useImages';
import { blurhashToDataURL } from '@/lib/blurhash';
import { Tile } from '@/components/overtone/tile';

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
    createdAt?: string;
  };
}

export function ImageDetail({ image }: ImageDetailProps) {
  const isAdmin = useAuthStore((s) => s.role === 'admin');
  const [buyOpen, setBuyOpen] = useState(false);
  const [wallPreviewOpen, setWallPreviewOpen] = useState(false);
  const [arViewerOpen, setArViewerOpen] = useState(false);
  const { supported: arSupported, mode: arMode } = useArSupport();
  const blurDataURL = image.blurHash ? blurhashToDataURL(image.blurHash) : undefined;

  const hasBuyOptions =
    image.allowDownloadOriginal ||
    image.originalAvailable ||
    (image.printEnabled && image.printOptions?.length > 0);

  const printOptionsWithDimensions = (image.printOptions ?? []).filter(
    (o) => Number(o.widthCm) > 0 && Number(o.heightCm) > 0,
  );

  const medium = image.type === 'photo' ? 'Photograph' : 'Painting';
  const aspect = image.width / image.height;
  const backHref = image.type === 'photo' ? '/photographs' : '/paintings';
  const year = image.shotDate
    ? new Date(image.shotDate).getFullYear()
    : image.createdAt
      ? new Date(image.createdAt).getFullYear()
      : null;

  const sizeDisplay =
    image.sizeWidthCm && image.sizeHeightCm
      ? `${+(image.sizeWidthCm / 2.54).toFixed(1)} \u00d7 ${+(image.sizeHeightCm / 2.54).toFixed(1)} in`
      : null;

  const edition =
    image.printLimit && image.printsSold !== undefined
      ? `${image.printsSold} / ${image.printLimit}`
      : null;

  // More by this artist
  const { images: allImages } = useImages();
  const moreByArtist = useMemo(
    () => allImages.filter((w) => w.artist.id === image.artist.id && w.id !== image.id).slice(0, 4),
    [allImages, image.artist.id, image.id],
  );

  // Reset scroll
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [image.id]);

  return (
    <>
      {/* Top bar */}
      <div className="flex justify-between items-center px-5 md:px-10 pt-5 md:pt-7">
        <Link href={backHref} className="ot-btn ot-btn--ghost">
          &larr; Back to gallery
        </Link>
        <div className="flex items-center gap-3">
          <span className="ot-meta">
            {image.type === 'photo' ? 'PH' : 'PT'}-{String(image.id).padStart(3, '0')}
          </span>
          {isAdmin && (
            <a
              href={`/admin/images/${image.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ot-mute hover:text-ot-ochre transition-colors"
              title="Edit image"
            >
              <EditIcon size={16} />
            </a>
          )}
        </div>
      </div>

      {/* 2-column detail */}
      <section className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6 md:gap-14 px-5 md:px-10 py-6 md:py-14 pb-16 md:pb-[100px]">
        {/* Left: image plate */}
        <div className="bg-ot-paper-2 p-5 md:p-10 flex items-center justify-center min-h-[360px] md:min-h-[560px]">
          <div
            className="w-full max-w-[720px] relative"
            style={{
              aspectRatio: aspect,
              boxShadow: '0 30px 60px -20px rgba(29,37,51,0.25)',
            }}
          >
            <Image
              src={`${UPLOAD_URL}/${image.watermarkPath}`}
              alt={image.title}
              fill
              sizes="(max-width: 768px) 90vw, 55vw"
              className="object-contain"
              priority
              placeholder={blurDataURL ? 'blur' : 'empty'}
              blurDataURL={blurDataURL}
            />
          </div>
        </div>

        {/* Right: info */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="ot-eyebrow mb-3.5">
              {medium} &middot; {image.category}
            </div>
            <h1 className="ot-display text-[40px] md:text-[60px] m-0 italic leading-[1.05]">
              {image.title}
            </h1>
            <div className="mt-3.5 text-sm text-ot-ink-soft">
              by{' '}
              <Link
                href={`/artists/${image.artist.slug}`}
                className="border-b border-ot-ochre pb-0.5 text-ot-ink no-underline hover:text-ot-ochre-deep transition-colors"
              >
                {image.artist.name}
              </Link>
              {year && <> &middot; {year}</>}
            </div>
          </div>

          {/* Description */}
          {image.description && (
            <p className="text-[15px] leading-[1.65] text-ot-ink-soft m-0 pt-2 border-t border-ot-line-soft">
              {image.description}
            </p>
          )}

          {/* Specs */}
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 pt-5 border-t border-ot-line-soft text-[13px]">
            {sizeDisplay && (
              <>
                <dt className="ot-meta">SIZE</dt>
                <dd className="m-0">{sizeDisplay}</dd>
              </>
            )}
            {year && (
              <>
                <dt className="ot-meta">YEAR</dt>
                <dd className="m-0">{year}</dd>
              </>
            )}
            <dt className="ot-meta">MEDIUM</dt>
            <dd className="m-0">
              {image.type === 'photo' ? 'Archival pigment print' : 'Acrylic on canvas'}
            </dd>
            {edition && (
              <>
                <dt className="ot-meta">EDITION</dt>
                <dd className="m-0">{edition}</dd>
              </>
            )}
            {image.place && (
              <>
                <dt className="ot-meta">PLACE</dt>
                <dd className="m-0">{image.place}</dd>
              </>
            )}
            <dt className="ot-meta">SHIPS</dt>
            <dd className="m-0">From Charlotte, NC &middot; 5&ndash;8 days</dd>
          </dl>

          {/* Price + actions */}
          <div className="pt-6 border-t border-ot-line-soft flex items-end justify-between gap-4">
            <div>
              <div className="ot-meta">PRICE</div>
              <div className="ot-display text-[40px] mt-1">${image.price}</div>
            </div>
            <div className="flex gap-2.5">
              {hasBuyOptions && (
                <button className="ot-btn ot-btn--solid" onClick={() => setBuyOpen(true)}>
                  Add to cart &rarr;
                </button>
              )}
              {printOptionsWithDimensions.length > 0 && (
                <button className="ot-btn ot-btn--ghost" onClick={() => setWallPreviewOpen(true)}>
                  Wall Preview
                </button>
              )}
              {arSupported && (
                <button className="ot-btn ot-btn--ghost" onClick={() => setArViewerOpen(true)}>
                  AR
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          {image.tags && image.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {image.tags.map((t) => (
                <span key={t.id} className="ot-chip" style={{ pointerEvents: 'none' }}>
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* More by this artist */}
      {moreByArtist.length > 0 && (
        <section className="px-5 md:px-10 pb-16 md:pb-[100px]">
          <div className="flex items-end justify-between gap-8 mb-9">
            <div>
              <div className="ot-section-tag mb-[18px]">More by this artist</div>
              <h2 className="ot-display text-[56px] m-0 leading-[1.05]">
                Other <em>{image.type === 'photo' ? 'photographs' : 'paintings'}</em>
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {moreByArtist.map((w) => (
              <Tile key={w.id} image={w} aspect={1} />
            ))}
          </div>
        </section>
      )}

      <BuyModal open={buyOpen} onClose={() => setBuyOpen(false)} image={image} />

      <WallPreview
        open={wallPreviewOpen}
        onClose={() => setWallPreviewOpen(false)}
        imageUrl={`${UPLOAD_URL}/${image.watermarkPath}`}
        imageWidth={image.width}
        imageHeight={image.height}
        printOptions={printOptionsWithDimensions}
      />

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
