'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import gsap from 'gsap';
import type { ImagePrintOption, OrderItemType } from '@gallery/shared';
import { UPLOAD_URL } from '@/config';
import { Modal } from '@/components/modal';
import { ShoppingBagIcon } from '@/components/icons/shopping-bag-icon';
import { ChevronDownIcon } from '@/components/icons/chevron-down-icon';
import { FrameIcon } from '@/components/icons/frame-icon';
import { CameraIcon } from '@/components/icons/camera-icon';
import { useArSupport } from '@/hooks/useArSupport';
import { useWalls } from '@/hooks/useWalls';

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
  };
}

export function ImageDetail({ image }: ImageDetailProps) {
  const { addItem, items } = useCartStore();
  const [selectedSku, setSelectedSku] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);
  const [buyOpen, setBuyOpen] = useState(false);
  const [wallPreviewOpen, setWallPreviewOpen] = useState(false);
  const [arViewerOpen, setArViewerOpen] = useState(false);
  const [bgColor, setBgColor] = useState('#000000');
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { supported: arSupported, mode: arMode } = useArSupport();
  const { walls, selectedWall, selectWall } = useWalls();

  const originalInCart = items.some((i) => i.imageId === image.id && i.type === 'original');

  const selectedPrintOption = image.printOptions?.find((o) => o.sku === selectedSku);
  const printInCart = selectedSku
    ? items.some((i) => i.imageId === image.id && i.type === 'print' && i.printSku === selectedSku)
    : false;

  const remaining =
    !image.perOptionLimits && image.printLimit !== null
      ? image.printLimit - image.printsSold
      : null;
  const soldOut = remaining !== null && remaining <= 0;

  const selectedOptionSoldOut =
    image.perOptionLimits && selectedPrintOption
      ? selectedPrintOption.printLimit !== null &&
        selectedPrintOption.soldCount >= selectedPrintOption.printLimit
      : false;
  const selectedOptionRemaining =
    image.perOptionLimits && selectedPrintOption?.printLimit != null
      ? selectedPrintOption.printLimit - selectedPrintOption.soldCount
      : null;

  const hasBuyOptions =
    image.allowDownloadOriginal || (image.printEnabled && image.printOptions?.length > 0);

  const printOptionsWithDimensions = (image.printOptions ?? []).filter(
    (o) => Number(o.widthCm) > 0 && Number(o.heightCm) > 0,
  );

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
        className="relative h-screen w-full transition-colors duration-300"
        style={{
          backgroundColor: selectedWall ? undefined : bgColor,
          backgroundImage: selectedWall
            ? `url(${UPLOAD_URL}/${selectedWall.imagePath})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Full-screen image */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-out ${
            imageLoaded ? 'blur-0 scale-100 opacity-100' : 'blur-md scale-[1.02] opacity-0'
          }`}
        >
          <Image
            src={`${UPLOAD_URL}/${image.watermarkPath}`}
            alt={image.title}
            width={image.width}
            height={image.height}
            className="h-full w-full object-contain"
            priority
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* Side panel — background color + action buttons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2 items-center">
          <div className="flex flex-col gap-1.5 mb-1">
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
              : [
                  { color: '#ffffff', label: 'White' },
                  { color: '#808080', label: 'Gray' },
                  { color: '#d4c5a9', label: 'Beige' },
                  { color: '#000000', label: 'Black' },
                ].map(({ color, label }) => (
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
          {printOptionsWithDimensions.length > 0 && (
            <button
              type="button"
              onClick={() => setWallPreviewOpen(true)}
              className="rounded-full bg-white/15 p-3 text-white backdrop-blur-sm hover:bg-gallery-accent hover:text-gallery-black transition-colors duration-300"
              aria-label="View on wall"
              title="View on wall"
            >
              <FrameIcon size={20} />
            </button>
          )}
          {arSupported && (
            <button
              type="button"
              onClick={() => setArViewerOpen(true)}
              className="rounded-full bg-white/15 p-3 text-white backdrop-blur-sm hover:bg-gallery-accent hover:text-gallery-black transition-colors duration-300"
              aria-label="View in AR"
              title="View in AR"
            >
              <CameraIcon size={20} />
            </button>
          )}
          {hasBuyOptions && (
            <button
              type="button"
              onClick={() => setBuyOpen(true)}
              className="rounded-full bg-white/15 p-3 text-white backdrop-blur-sm hover:bg-gallery-accent hover:text-gallery-black transition-colors duration-300"
              aria-label="Buy options"
              title="Buy options"
            >
              <ShoppingBagIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Bottom overlay — info accordion + buy button */}
        <div
          ref={overlayRef}
          className="absolute bottom-0 left-0 right-0 z-10 bg-linear-to-t from-black/80 via-black/50 to-transparent"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
        >
          <div className="px-4 pb-6 pt-16 sm:px-6">
            {/* Title row — always visible */}
            <div className="flex items-end justify-between mb-2">
              <button
                type="button"
                onClick={() => setInfoOpen((v) => !v)}
                className="flex items-center gap-2 group text-left min-w-0"
              >
                {infoOpen ? (
                  <div>
                    <span className="block text-lg font-semibold text-white">{image.title}</span>
                    {((image.mediaTypes && image.mediaTypes.length > 0) ||
                      (image.paintTypes && image.paintTypes.length > 0)) && (
                      <span className="block text-sm text-white/60">
                        {[
                          ...(image.mediaTypes ?? []).map((m) => m.name),
                          ...(image.paintTypes ?? []).map((p) => p.name),
                        ].join(', ')}
                      </span>
                    )}
                    <span className="block text-sm text-white/70">
                      by{' '}
                      <Link
                        href={`/artists/${image.artist.slug}`}
                        className="hover:text-gallery-accent transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {image.artist.name}
                      </Link>
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-white/80">
                    <span className="font-semibold">{image.title}</span>
                    <span className="text-white/50"> &middot; {image.artist.name}</span>
                  </span>
                )}
                <ChevronDownIcon
                  className={`w-5 h-5 shrink-0 text-white/70 transition-transform duration-300 group-hover:text-white ${
                    infoOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* Accordion content */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-out max-w-xl ${
                infoOpen ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              {image.description && (
                <p className="text-white/80 text-sm leading-relaxed mb-2">{image.description}</p>
              )}

              <p className="text-gallery-gray text-xs mb-2">
                Category: {image.category.replace(/_/g, ' ')}
                {image.shotDate && <> &middot; {image.shotDate}</>}
                {image.place && <> &middot; {image.place}</>}
                {image.sizeWidthCm && image.sizeHeightCm && (
                  <>
                    {' '}
                    &middot; {+(Number(image.sizeWidthCm) / 2.54).toFixed(1)}&times;
                    {+(Number(image.sizeHeightCm) / 2.54).toFixed(1)}&Prime;
                  </>
                )}
              </p>

              {image.tags && image.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {image.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/?tags=${tag.slug}`}
                      className="px-2.5 py-0.5 text-xs rounded-full border border-white/20 text-white/70 hover:border-gallery-accent hover:text-gallery-accent transition-colors"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Buy modal */}
      <Modal open={buyOpen} onClose={() => setBuyOpen(false)} title="Purchase Options">
        <div className="flex flex-col gap-4">
          {/* Digital Original */}
          {image.allowDownloadOriginal && (
            <div className="p-4 border border-white/10 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">Digital Original</p>
                  <p className="text-gallery-gray text-sm">Full resolution download</p>
                </div>
                <p className="text-2xl font-light">${image.price}</p>
              </div>
              <button
                onClick={() =>
                  addItem({
                    imageId: image.id,
                    title: image.title,
                    price: image.price,
                    thumbnailPath: image.thumbnailPath,
                    type: 'original' as OrderItemType,
                    printSku: null,
                    printDescription: null,
                  })
                }
                disabled={originalInCart || Number(image.price) === 0}
                className="w-full px-6 py-2.5 bg-gallery-accent text-gallery-black font-medium rounded-lg hover:bg-gallery-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {originalInCart ? 'In Cart' : 'Add to Cart'}
              </button>
            </div>
          )}

          {/* Print Options */}
          {image.printEnabled && image.printOptions?.length > 0 && (
            <div className="p-4 border border-white/10 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">Buy Print</p>
                  {remaining !== null && !soldOut && (
                    <p className="text-gallery-accent text-sm">
                      Limited edition &mdash; {remaining} of {image.printLimit} remaining
                    </p>
                  )}
                  {soldOut && <p className="text-red-400 text-sm">Sold out</p>}
                  {image.perOptionLimits &&
                    selectedOptionRemaining !== null &&
                    !selectedOptionSoldOut && (
                      <p className="text-gallery-accent text-sm">
                        Limited edition &mdash; {selectedOptionRemaining} remaining
                      </p>
                    )}
                  {image.perOptionLimits && selectedOptionSoldOut && (
                    <p className="text-red-400 text-sm">This option is sold out</p>
                  )}
                </div>
                {selectedPrintOption && (
                  <p className="text-2xl font-light">${selectedPrintOption.price}</p>
                )}
              </div>

              {!soldOut && (
                <>
                  <select
                    value={selectedSku}
                    onChange={(e) => setSelectedSku(e.target.value)}
                    className="w-full mb-3 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gallery-accent text-sm"
                  >
                    <option value="">Select print size</option>
                    {image.printOptions.map((opt) => {
                      const optSoldOut =
                        image.perOptionLimits &&
                        opt.printLimit !== null &&
                        opt.soldCount >= opt.printLimit;
                      const optRemaining =
                        image.perOptionLimits && opt.printLimit !== null
                          ? opt.printLimit - opt.soldCount
                          : null;
                      return (
                        <option key={opt.sku} value={opt.sku} disabled={optSoldOut}>
                          {opt.description} &mdash; ${opt.price}
                          {optSoldOut ? ' (sold out)' : ''}
                          {optRemaining !== null && !optSoldOut ? ` (${optRemaining} left)` : ''}
                        </option>
                      );
                    })}
                  </select>

                  <button
                    onClick={() => {
                      if (!selectedPrintOption) return;
                      addItem({
                        imageId: image.id,
                        title: image.title,
                        price: selectedPrintOption.price,
                        thumbnailPath: image.thumbnailPath,
                        type: 'print' as OrderItemType,
                        printSku: selectedPrintOption.sku,
                        printDescription: selectedPrintOption.description,
                      });
                    }}
                    disabled={
                      !selectedSku ||
                      printInCart ||
                      selectedOptionSoldOut ||
                      Number(selectedPrintOption?.price) === 0
                    }
                    className="w-full px-6 py-2.5 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-white/10"
                  >
                    {printInCart ? 'In Cart' : 'Add Print to Cart'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </Modal>

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
