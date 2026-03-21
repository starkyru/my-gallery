'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { DownloadIcon } from '@/components/icons/download-icon';
import type { GalleryImage } from '@gallery/shared';
import { UPLOAD_URL } from '@/config';

type BackdropColor = 'black' | 'white' | 'gray';

const backdropClasses: Record<BackdropColor, string> = {
  black: 'bg-black/90',
  white: 'bg-white',
  gray: 'bg-neutral-500',
};

export default function ProtectedGalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [accessToken, setAccessToken] = useState('');
  const [password, setPassword] = useState('');
  const [galleryName, setGalleryName] = useState('');
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [backdropColor, setBackdropColor] = useState<BackdropColor>('black');

  const closeLightbox = useCallback(() => setSelectedImage(null), []);

  const loadGallery = useCallback(
    async (token: string) => {
      try {
        const data = await api.protectedGalleries.getPublic(slug, token);
        setAccessToken(token);
        setGalleryName(data.name);
        setImages(data.images);
        setUnlocked(true);
        sessionStorage.setItem(`gallery-token-${slug}`, token);
      } catch {
        sessionStorage.removeItem(`gallery-token-${slug}`);
      } finally {
        setChecking(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    const stored = sessionStorage.getItem(`gallery-token-${slug}`);
    if (stored) {
      loadGallery(stored);
    } else {
      setChecking(false);
    }
  }, [slug, loadGallery]);

  useEffect(() => {
    if (!selectedImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, closeLightbox]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');
    try {
      const { accessToken: token } = await api.protectedGalleries.authenticate(slug, password);
      await loadGallery(token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gallery-gray text-sm">Loading...</div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-3xl text-center mb-8">Private Gallery</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gallery-gray mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gallery-accent"
                placeholder="Enter gallery password"
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-2.5 bg-gallery-accent text-gallery-black rounded-lg font-medium hover:bg-gallery-accent-light transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Enter Gallery'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-serif text-3xl">{galleryName}</h1>
          <a
            href={api.protectedGalleries.downloadUrl(slug, accessToken)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gallery-accent text-gallery-black rounded-lg text-sm font-medium hover:bg-gallery-accent-light transition-colors"
          >
            Download All
          </a>
        </div>

        <p className="text-gallery-gray text-sm mb-8">
          {images.length} {images.length === 1 ? 'photo' : 'photos'}
        </p>

        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
          {images.map((image) => (
            <div
              key={image.id}
              className="break-inside-avoid rounded-lg overflow-hidden bg-white/5 relative group cursor-pointer"
              onClick={() => setSelectedImage(image)}
            >
              <Image
                src={`${UPLOAD_URL}/${image.watermarkPath}`}
                alt={image.title}
                width={image.width}
                height={image.height}
                className="w-full h-auto"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              {image.allowDownloadOriginal && (
                <a
                  href={api.protectedGalleries.imageDownloadUrl(slug, image.id, accessToken)}
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 hover:bg-black/90 text-white rounded-full p-2"
                  title="Download original"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DownloadIcon />
                </a>
              )}
            </div>
          ))}
        </div>

        {images.length === 0 && (
          <p className="text-center text-gallery-gray py-24">No images in this gallery.</p>
        )}
      </div>

      {selectedImage && (
        <div
          className={`fixed inset-0 z-50 ${backdropClasses[backdropColor]} flex items-center justify-center cursor-pointer`}
          onClick={closeLightbox}
        >
          {/* Backdrop color picker */}
          <div
            className="absolute top-4 right-4 flex gap-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {(
              [
                ['black', 'bg-black'],
                ['white', 'bg-white'],
                ['gray', 'bg-neutral-500'],
              ] as const
            ).map(([value, bg]) => (
              <button
                key={value}
                className={`w-6 h-6 rounded border border-white/30 ${bg} ${
                  backdropColor === value ? 'ring-2 ring-white' : ''
                }`}
                onClick={() => setBackdropColor(value)}
              />
            ))}
          </div>

          <Image
            src={`${UPLOAD_URL}/${selectedImage.watermarkPath}`}
            alt={selectedImage.title}
            width={selectedImage.width}
            height={selectedImage.height}
            className="max-w-full max-h-full object-contain"
            sizes="100vw"
            priority
          />

          {selectedImage.allowDownloadOriginal && (
            <a
              href={api.protectedGalleries.imageDownloadUrl(slug, selectedImage.id, accessToken)}
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 bg-black/70 hover:bg-black/90 text-white rounded-full p-3"
              title="Download original"
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
