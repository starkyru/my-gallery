'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { api } from '@/lib/api';
import { UPLOAD_URL } from '@/config';

export default function CartPage() {
  const { items, removeItem, total } = useCartStore();
  const validatedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const imageIds = [...new Set(items.map((i) => i.imageId))];
    const toValidate = imageIds.filter((id) => !validatedRef.current.has(id));
    if (toValidate.length === 0) return;

    const { removeByImageId } = useCartStore.getState();
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
  }, [items]);

  const subtotal = total();
  const shipping = subtotal > 200 ? 0 : 18;
  const grandTotal = subtotal + shipping;

  return (
    <main>
      {/* Hero */}
      <section className="pt-10 md:pt-16 pb-6 md:pb-8">
        <div className="px-5 md:px-10 text-center">
          <div className="ot-eyebrow mb-4">
            Cart &middot; {items.length} {items.length === 1 ? 'item' : 'items'}
          </div>
          <h1 className="ot-display text-[56px] md:text-[88px] m-0">
            Your <span className="italic text-ot-ochre">cart</span>
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-8 md:gap-14 px-5 md:px-10 pb-16 md:pb-[100px]">
        {/* Left: items */}
        <div>
          {items.length === 0 ? (
            <div className="py-[60px] border-t border-b border-ot-line-soft text-center">
              <p className="ot-display text-[32px] italic m-0">Empty for now.</p>
              <p className="text-ot-mute mt-3 text-sm">Browse the gallery to add work.</p>
              <Link href="/photographs" className="ot-btn ot-btn--solid mt-6">
                Browse photographs &rarr;
              </Link>
            </div>
          ) : (
            <div className="border-t border-ot-line-soft">
              {items.map((item) => (
                <div
                  key={`${item.imageId}-${item.type}-${item.printSku || ''}`}
                  className="grid grid-cols-[100px_1fr] md:grid-cols-[140px_1fr_auto] gap-4 md:gap-6 py-6 border-b border-ot-line-soft items-start"
                >
                  <div className="w-[100px] md:w-[140px] aspect-square relative overflow-hidden bg-ot-paper-3">
                    <Image
                      src={`${UPLOAD_URL}/${item.thumbnailPath}`}
                      alt={item.title}
                      fill
                      sizes="140px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="ot-meta">
                      {item.type === 'print'
                        ? 'Print'
                        : item.type === 'physical_original'
                          ? 'Physical Original'
                          : 'Digital Download'}
                    </div>
                    <h3 className="font-serif italic text-2xl m-0">{item.title}</h3>
                    {item.printDescription && (
                      <div className="text-[13px] text-ot-ink-soft">{item.printDescription}</div>
                    )}
                    <button
                      onClick={() => removeItem(item.imageId, item.type, item.printSku)}
                      className="bg-transparent border-none cursor-pointer font-sans text-[11px] text-ot-terra tracking-[0.16em] uppercase self-start mt-2"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="ot-display text-[28px] hidden md:block">${item.price}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: summary */}
        <aside className="bg-ot-paper-2 p-5 md:p-7 self-start sticky top-[100px]">
          <div className="ot-eyebrow mb-4">Summary</div>
          <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-6 gap-y-2.5 text-sm">
            <dt>Subtotal</dt>
            <dd className="m-0">${subtotal}</dd>
            <dt>Shipping</dt>
            <dd className="m-0">{shipping === 0 ? 'Free' : `$${shipping}`}</dd>
            <dt className="pt-3.5 border-t border-ot-line-soft font-serif italic text-lg">Total</dt>
            <dd className="m-0 pt-3.5 border-t border-ot-line-soft font-serif text-2xl">
              ${grandTotal}
            </dd>
          </dl>
          <Link
            href="/checkout"
            className={`ot-btn ot-btn--solid w-full justify-center mt-5 ${items.length === 0 ? 'pointer-events-none opacity-50' : ''}`}
          >
            Checkout &rarr;
          </Link>
          <p className="text-[11px] text-ot-mute mt-3.5 leading-relaxed font-mono tracking-[0.04em]">
            Free domestic shipping over $200. International rates calculated at checkout.
          </p>
        </aside>
      </section>
    </main>
  );
}
