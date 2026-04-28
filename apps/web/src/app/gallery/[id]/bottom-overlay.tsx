'use client';

import { forwardRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon } from '@/components/icons/chevron-down-icon';

interface BottomOverlayImage {
  title: string;
  description: string | null;
  category: string;
  artist: { id: number; name: string; slug: string; bio: string | null };
  tags?: { id: number; name: string; slug: string }[];
  mediaTypes?: { id: number; name: string; slug: string }[];
  paintTypes?: { id: number; name: string; slug: string }[];
  shotDate?: string | null;
  place?: string | null;
  sizeWidthCm?: number | null;
  sizeHeightCm?: number | null;
  type?: string;
  project?: { id: number; name: string; slug: string } | null;
  allowDownloadOriginal: boolean;
  printEnabled: boolean;
  originalAvailable?: boolean;
}

interface BottomOverlayProps {
  image: BottomOverlayImage;
}

export const BottomOverlay = forwardRef<HTMLDivElement, BottomOverlayProps>(function BottomOverlay(
  { image },
  ref,
) {
  const [infoOpen, setInfoOpen] = useState(false);
  const typeMemo = [
    image.type === 'painting' && 'Painting',
    image.type === 'photograph' && 'Photograph',
    // (image.allowDownloadOriginal || image.originalAvailable) && 'Original',
    // image.printEnabled && 'Print',
  ]
    .filter(Boolean)
    .join(', ');
  return (
    <div
      ref={ref}
      className="absolute bottom-0 left-0 right-0 z-10"
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
            <p className="text-white/80 text-sm leading-relaxed mb-3">{image.description}</p>
          )}

          <div className="text-sm text-white/70 space-y-1 mb-3">
            {image.place && (
              <p>
                <span className="text-gallery-gray">Place:</span> {image.place}
              </p>
            )}
            {image.shotDate && (
              <p>
                <span className="text-gallery-gray">Date:</span> {image.shotDate}
              </p>
            )}
            {image.sizeWidthCm && image.sizeHeightCm && (
              <p>
                <span className="text-gallery-gray">Physical Size:</span>{' '}
                {+(Number(image.sizeWidthCm) / 2.54).toFixed(1)}&Prime;&times;
                {+(Number(image.sizeHeightCm) / 2.54).toFixed(1)}&Prime;
              </p>
            )}
            {image.mediaTypes && image.mediaTypes.length > 0 && (
              <p>
                <span className="text-gallery-gray">Media:</span>{' '}
                {image.mediaTypes.map((m) => m.name).join(', ')}
              </p>
            )}
            {image.paintTypes && image.paintTypes.length > 0 && (
              <p>
                <span className="text-gallery-gray">Paint:</span>{' '}
                {image.paintTypes.map((p) => p.name).join(', ')}
              </p>
            )}
            {image.project && (
              <p>
                <span className="text-gallery-gray">Project:</span>{' '}
                <Link
                  href={`/artists/${image.artist.slug}?project=${image.project.id}`}
                  className="hover:text-gallery-accent transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {image.project.name}
                </Link>
              </p>
            )}
            {typeMemo && (
              <p>
                <span className="text-gallery-gray">Type:</span> {typeMemo}
              </p>
            )}
          </div>

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
  );
});
