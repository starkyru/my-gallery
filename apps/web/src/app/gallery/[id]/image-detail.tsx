'use client';

import Image from 'next/image';
import { useCartStore } from '@/store/cart';

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
  };
}

export function ImageDetail({ image }: ImageDetailProps) {
  const { addItem, items } = useCartStore();
  const inCart = items.some((i) => i.imageId === image.id);

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
          <p className="text-3xl font-light mb-8">${image.price}</p>
          <button
            onClick={() =>
              addItem({
                imageId: image.id,
                title: image.title,
                price: image.price,
                thumbnailPath: image.thumbnailPath,
              })
            }
            disabled={inCart}
            className="w-full sm:w-auto px-8 py-3 bg-gallery-accent text-gallery-black font-medium rounded-lg hover:bg-gallery-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {inCart ? 'In Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
