'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import type { ImagePrintOption } from '@gallery/shared';

const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || 'http://localhost:4000/uploads';

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
    photographer?: { name: string; bio: string | null };
    printEnabled: boolean;
    printLimit: number | null;
    printsSold: number;
    printOptions: ImagePrintOption[];
  };
}

export function ImageDetail({ image }: ImageDetailProps) {
  const { addItem, items } = useCartStore();
  const [selectedSku, setSelectedSku] = useState<string>('');

  const originalInCart = items.some((i) => i.imageId === image.id && i.type === 'original');

  const selectedPrintOption = image.printOptions?.find((o) => o.sku === selectedSku);
  const printInCart = selectedSku
    ? items.some((i) => i.imageId === image.id && i.type === 'print' && i.printSku === selectedSku)
    : false;

  const remaining = image.printLimit !== null ? image.printLimit - image.printsSold : null;
  const soldOut = remaining !== null && remaining <= 0;

  return (
    <div className="mx-auto max-w-6xl px-6 pt-28 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="relative overflow-hidden rounded-lg bg-white/5">
          <Image
            src={`${UPLOAD_URL}/${image.watermarkPath}`}
            alt={image.title}
            width={image.width}
            height={image.height}
            className="w-full h-auto"
            priority
          />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-gallery-accent text-sm uppercase tracking-widest mb-2">
            {image.category.replace(/_/g, ' ')}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl mb-4">{image.title}</h1>
          {image.photographer && (
            <p className="text-gallery-gray mb-6">by {image.photographer.name}</p>
          )}
          {image.description && (
            <p className="text-gallery-gray leading-relaxed mb-8">{image.description}</p>
          )}

          {/* Digital Original */}
          <div className="mb-6 p-4 border border-white/10 rounded-lg">
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
