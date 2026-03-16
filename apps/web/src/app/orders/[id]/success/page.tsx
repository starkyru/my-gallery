'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.orders
      .downloads(+id)
      .then(setDownloads)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="mx-auto max-w-lg px-6 pt-28 pb-24 text-center">
      <h1 className="font-serif text-4xl mb-4">Thank You!</h1>
      <p className="text-gallery-gray mb-8">
        Your order #{id} has been confirmed. Download links are below.
      </p>

      {loading ? (
        <p className="text-gallery-gray">Loading downloads...</p>
      ) : (
        <div className="space-y-3">
          {downloads.map((dl) => (
            <a
              key={dl.imageId}
              href={dl.downloadUrl}
              className="block px-6 py-3 border border-gallery-accent text-gallery-accent rounded-lg hover:bg-gallery-accent hover:text-gallery-black transition-colors"
            >
              Download: {dl.title}
            </a>
          ))}
        </div>
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
