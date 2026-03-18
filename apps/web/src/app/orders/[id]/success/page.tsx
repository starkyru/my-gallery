'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function PrintItem({ item }: { item: { title?: string; printSku?: string; status?: string } }) {
  return (
    <div className="px-6 py-3 border border-white/10 rounded-lg text-left">
      <p className="font-medium">{item.title}</p>
      <p className="text-gallery-gray text-sm">{item.printSku}</p>
      <p className="text-gallery-accent text-sm mt-1">
        {item.status || 'Print order submitted — shipping updates via email'}
      </p>
    </div>
  );
}

export default function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || undefined;
  const [downloads, setDownloads] = useState<
    {
      imageId: number;
      title?: string;
      type: string;
      downloadUrl?: string;
      printSku?: string;
      status?: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.orders
      .downloads(+id, token)
      .then(setDownloads)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, token]);

  const digitalItems = downloads.filter((d) => d.type === 'original' || d.downloadUrl);
  const printItems = downloads.filter((d) => d.type === 'print');

  return (
    <div className="mx-auto max-w-lg px-6 pt-28 pb-24 text-center">
      <h1 className="font-serif text-4xl mb-4">Thank You!</h1>
      <p className="text-gallery-gray mb-8">Your order #{id} has been confirmed.</p>

      {loading ? (
        <p className="text-gallery-gray">Loading order details...</p>
      ) : (
        <>
          {digitalItems.length > 0 && (
            <div className="mb-8">
              <h2 className="font-serif text-xl mb-3">Digital Downloads</h2>
              <div className="space-y-3">
                {digitalItems.map((dl) => (
                  <a
                    key={dl.imageId}
                    href={dl.downloadUrl}
                    className="block px-6 py-3 border border-gallery-accent text-gallery-accent rounded-lg hover:bg-gallery-accent hover:text-gallery-black transition-colors"
                  >
                    Download: {dl.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {printItems.length > 0 && (
            <div className="mb-8">
              <h2 className="font-serif text-xl mb-3">Print Orders</h2>
              <div className="space-y-3">
                {printItems.map((item) => (
                  <PrintItem key={`${item.imageId}-${item.printSku}`} item={item} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Link
        href="/"
        className="inline-block mt-8 text-gallery-gray hover:text-white transition-colors"
      >
        Back to Gallery
      </Link>
    </div>
  );
}
