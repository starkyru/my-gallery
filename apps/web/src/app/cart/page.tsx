'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { api } from '@/lib/api';
import { UPLOAD_URL } from '@/lib/consts';

export default function CartPage() {
  const { items, removeItem, removeByImageId, total } = useCartStore();
  const validatedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const imageIds = [...new Set(items.map((i) => i.imageId))];
    const toValidate = imageIds.filter((id) => !validatedRef.current.has(id));
    if (toValidate.length === 0) return;

    Promise.allSettled(
      toValidate.map((id) =>
        api.images.get(id).then(
          () => ({ id, valid: true }),
          () => ({ id, valid: false }),
        ),
      ),
    ).then((results) => {
      for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        if (r.value.valid) validatedRef.current.add(r.value.id);
        else removeByImageId(r.value.id);
      }
    });
  }, [items, removeByImageId]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 pt-28 pb-24 text-center">
        <h1 className="font-serif text-4xl mb-4">Your Cart</h1>
        <p className="text-gallery-gray mb-8">Your cart is empty.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 border border-gallery-accent text-gallery-accent rounded-lg hover:bg-gallery-accent hover:text-gallery-black transition-colors"
        >
          Browse Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 pt-28 pb-24">
      <h1 className="font-serif text-4xl mb-8">Your Cart</h1>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={`${item.imageId}-${item.type}-${item.printSku || ''}`}
            className="flex items-center gap-4 p-4 border border-white/10 rounded-lg"
          >
            <Image
              src={`${UPLOAD_URL}/${item.thumbnailPath}`}
              alt={item.title}
              width={80}
              height={80}
              className="rounded object-cover w-20 h-20"
            />
            <div className="flex-1">
              <h3 className="font-serif text-lg">{item.title}</h3>
              <p className="text-gallery-gray text-sm">
                {item.type === 'print'
                  ? `Print \u2014 ${item.printDescription}`
                  : 'Digital Download'}
              </p>
              <p className="text-gallery-gray">${item.price}</p>
            </div>
            <button
              onClick={() => removeItem(item.imageId, item.type, item.printSku)}
              className="text-gallery-gray hover:text-red-400 transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-8">
        <p className="text-2xl">
          Total: <span className="font-serif">${total()}</span>
        </p>
        <Link
          href="/checkout"
          className="px-8 py-3 bg-gallery-accent text-gallery-black font-medium rounded-lg hover:bg-gallery-accent-light transition-colors"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
