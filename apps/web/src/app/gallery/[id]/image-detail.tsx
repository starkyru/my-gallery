'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import gsap from 'gsap';
import type { ImagePrintOption } from '@gallery/shared';
import { UPLOAD_URL } from '@/config';

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
    artist: { id: number; name: string; bio: string | null };
    allowDownloadOriginal: boolean;
    printEnabled: boolean;
    printLimit: number | null;
    printsSold: number;
    printOptions: ImagePrintOption[];
    tags?: { id: number; name: string; slug: string }[];
  };
}

export function ImageDetail({ image }: ImageDetailProps) {
  const { addItem, items } = useCartStore();
  const [selectedSku, setSelectedSku] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const originalInCart = items.some((i) => i.imageId === image.id && i.type === 'original');

  const selectedPrintOption = image.printOptions?.find((o) => o.sku === selectedSku);
  const printInCart = selectedSku
    ? items.some((i) => i.imageId === image.id && i.type === 'print' && i.printSku === selectedSku)
    : false;

  const remaining = image.printLimit !== null ? image.printLimit - image.printsSold : null;
  const soldOut = remaining !== null && remaining <= 0;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.from(imageRef.current, {
        x: -40,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });

      gsap.from(detailsRef.current, {
        x: 40,
        opacity: 0,
        duration: 1,
        delay: 0.15,
        ease: 'power3.out',
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="mx-auto max-w-6xl px-6 pt-28 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div ref={imageRef} className="relative overflow-hidden rounded-lg bg-white/5">
          <div
            className={`transition-all duration-1000 ease-out ${
              imageLoaded ? 'blur-0 scale-100' : 'blur-md scale-[1.03]'
            }`}
          >
            <Image
              src={`${UPLOAD_URL}/${image.watermarkPath}`}
              alt={image.title}
              width={image.width}
              height={image.height}
              className="w-full h-auto"
              priority
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        </div>
        <div ref={detailsRef} className="flex flex-col justify-center">
          <p className="text-gallery-accent text-sm uppercase tracking-widest mb-2">
            {image.category.replace(/_/g, ' ')}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl mb-4">{image.title}</h1>
          {image.tags && image.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {image.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/?tags=${tag.slug}`}
                  className="px-3 py-1 text-xs rounded-full border border-white/10 text-gallery-gray hover:border-gallery-accent hover:text-gallery-accent transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
          <p className="text-gallery-gray mb-6">
            by{' '}
            <Link
              href={`/artists/${image.artist.id}`}
              className="hover:text-gallery-accent transition-colors"
            >
              {image.artist.name}
            </Link>
          </p>
          {image.description && (
            <p className="text-gallery-gray leading-relaxed mb-8">{image.description}</p>
          )}

          {/* Digital Original */}
          {image.allowDownloadOriginal && (
            <div className="mb-6 p-4 border border-white/10 rounded-lg hover:border-white/20 transition-colors duration-300">
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
                    type: 'original' as any,
                    printSku: null,
                    printDescription: null,
                  })
                }
                disabled={originalInCart}
                className="w-full px-6 py-2.5 bg-gallery-accent text-gallery-black font-medium rounded-lg hover:bg-gallery-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {originalInCart ? 'In Cart' : 'Add to Cart'}
              </button>
            </div>
          )}

          {/* Print Options */}
          {image.printEnabled && image.printOptions?.length > 0 && (
            <div className="p-4 border border-white/10 rounded-lg hover:border-white/20 transition-colors duration-300">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">Buy Print</p>
                  {remaining !== null && !soldOut && (
                    <p className="text-gallery-accent text-sm">
                      Limited edition &mdash; {remaining} of {image.printLimit} remaining
                    </p>
                  )}
                  {soldOut && <p className="text-red-400 text-sm">Sold out</p>}
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
                    {image.printOptions.map((opt) => (
                      <option key={opt.sku} value={opt.sku}>
                        {opt.description} &mdash; ${opt.price}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      if (!selectedPrintOption) return;
                      addItem({
                        imageId: image.id,
                        title: image.title,
                        price: selectedPrintOption.price,
                        thumbnailPath: image.thumbnailPath,
                        type: 'print' as any,
                        printSku: selectedPrintOption.sku,
                        printDescription: selectedPrintOption.description,
                      });
                    }}
                    disabled={!selectedSku || printInCart}
                    className="w-full px-6 py-2.5 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-white/10"
                  >
                    {printInCart ? 'In Cart' : 'Add Print to Cart'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
