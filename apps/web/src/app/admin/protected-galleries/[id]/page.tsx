'use client';

import { useEffect, useState, useCallback, useRef, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRequest } from '@/hooks/useRequest';
import type { GalleryImage } from '@gallery/shared';
import { UPLOAD_URL } from '@/lib/consts';

export default function AdminProtectedGalleryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const galleryId = Number(id);
  const { token } = useAuthStore();
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [allImages, setAllImages] = useState<GalleryImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const toggleDownloadRequest = useRequest(
    useCallback(
      (imageId: number, allow: boolean) =>
        api.images.update(imageId, { allowDownloadOriginal: allow }, token!),
      [token],
    ),
  );

  const removeRequest = useRequest(
    useCallback(
      (imageId: number) => api.protectedGalleries.removeImage(galleryId, imageId, token!),
      [galleryId, token],
    ),
  );

  const addRequest = useRequest(
    useCallback(
      (imageIds: number[]) => api.protectedGalleries.addImages(galleryId, imageIds, token!),
      [galleryId, token],
    ),
  );

  useEffect(() => {
    loadGalleryImages();
  }, [token, galleryId]);

  function loadGalleryImages() {
    if (!token) return;
    api.protectedGalleries
      .getImages(galleryId, token)
      .then(setGalleryImages)
      .catch(() => {});
  }

  function loadAllImages() {
    if (!token) return;
    api.images
      .listAdmin(token)
      .then(setAllImages)
      .catch(() => {});
  }

  function openAddPanel() {
    setShowAddPanel(true);
    setSelectedIds(new Set());
    setSearch('');
    loadAllImages();
  }

  async function handleAddImages() {
    if (!token || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const addedIdSet = new Set(ids);

    // Optimistic: append selected images to gallery and close panel
    const imagesToAdd = allImages.filter((img) => addedIdSet.has(img.id));
    setGalleryImages((prev) => [...prev, ...imagesToAdd]);
    setShowAddPanel(false);
    setSelectedIds(new Set());

    const result = await addRequest.fetch(ids);
    if (result === null) {
      // Rollback: remove optimistically added images
      setGalleryImages((prev) => prev.filter((img) => !addedIdSet.has(img.id)));
    } else {
      // Refresh to get accurate server state
      loadGalleryImages();
    }
  }

  async function handleRemoveImage(imageId: number) {
    if (!token) return;

    // Optimistic: remove image immediately
    const snapshot = galleryImages;
    setGalleryImages((prev) => prev.filter((img) => img.id !== imageId));

    const result = await removeRequest.fetch(imageId);
    if (result === null) {
      // Rollback on error
      setGalleryImages(snapshot);
    }
  }

  function toggleSelect(imageId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) next.delete(imageId);
      else next.add(imageId);
      return next;
    });
  }

  function copyLink() {
    const origin = window.location.origin;
    navigator.clipboard.writeText(`${origin}/g/${galleryId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    setVisibleCount(20);
  }, [galleryImages]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 20);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [galleryImages]);

  async function handleToggleDownload(imageId: number, currentValue: boolean) {
    const newValue = !currentValue;
    // Optimistic update
    setGalleryImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, allowDownloadOriginal: newValue } : img)),
    );
    const result = await toggleDownloadRequest.fetch(imageId, newValue);
    if (result === null) {
      // Rollback
      setGalleryImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, allowDownloadOriginal: currentValue } : img,
        ),
      );
    }
  }

  const visibleImages = galleryImages.slice(0, visibleCount);

  const galleryImageIds = new Set(galleryImages.map((img) => img.id));
  const availableImages = allImages.filter((img) => !galleryImageIds.has(img.id));
  const filteredAvailable = search
    ? availableImages.filter(
        (img) =>
          img.title.toLowerCase().includes(search.toLowerCase()) ||
          img.artist?.name?.toLowerCase().includes(search.toLowerCase()),
      )
    : availableImages;

  const inputClass =
    'px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent';

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/protected-galleries"
          className="text-gallery-gray hover:text-white text-sm"
        >
          &larr; Back
        </Link>
        <h1 className="font-serif text-3xl">Gallery Images</h1>
        <button
          onClick={copyLink}
          className="ml-auto px-3 py-1.5 border border-white/10 rounded text-xs hover:border-white/30"
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      {/* Current images */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg text-gallery-gray">Assigned Images ({galleryImages.length})</h2>
          <button
            onClick={openAddPanel}
            className="px-3 py-1 bg-gallery-accent text-gallery-black rounded text-xs font-medium hover:bg-gallery-accent-light transition-colors"
          >
            + Add Images
          </button>
        </div>

        {galleryImages.length === 0 ? (
          <p className="text-gallery-gray text-sm py-8 text-center">
            No images assigned to this gallery yet.
          </p>
        ) : (
          <>
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5">
              {visibleImages.map((img) => (
                <div
                  key={img.id}
                  className="relative group rounded-lg overflow-hidden bg-white/5 break-inside-avoid mb-3"
                >
                  <Image
                    src={`${UPLOAD_URL}/${img.thumbnailPath}`}
                    alt={img.title}
                    width={400}
                    height={Math.round((400 * img.height) / img.width)}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleRemoveImage(img.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  <label className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 rounded px-1.5 py-0.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={img.allowDownloadOriginal}
                      onChange={() => handleToggleDownload(img.id, img.allowDownloadOriginal)}
                      className="accent-gallery-accent w-3 h-3"
                    />
                    <span className="text-[10px] text-white">DL</span>
                  </label>
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/50 text-xs truncate">
                    {img.title}
                  </div>
                </div>
              ))}
            </div>
            {visibleCount < galleryImages.length && <div ref={sentinelRef} className="h-10" />}
          </>
        )}
      </div>

      {/* Add images panel */}
      {showAddPanel && (
        <div className="border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg">Add Images</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or artist..."
              className={`${inputClass} flex-1`}
            />
            <button
              onClick={handleAddImages}
              disabled={selectedIds.size === 0 || addRequest.isLoading}
              className="px-4 py-1.5 bg-gallery-accent text-gallery-black rounded text-sm font-medium hover:bg-gallery-accent-light transition-colors disabled:opacity-30"
            >
              Add {selectedIds.size} Selected
            </button>
            <button
              onClick={() => setShowAddPanel(false)}
              className="px-3 py-1.5 border border-white/10 rounded text-sm"
            >
              Cancel
            </button>
          </div>

          {filteredAvailable.length === 0 ? (
            <p className="text-gallery-gray text-sm py-4 text-center">
              No available images to add.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-96 overflow-y-auto">
              {filteredAvailable.map((img) => (
                <button
                  key={img.id}
                  onClick={() => toggleSelect(img.id)}
                  className={`relative rounded-lg overflow-hidden bg-white/5 ring-2 transition-all ${
                    selectedIds.has(img.id)
                      ? 'ring-gallery-accent'
                      : 'ring-transparent hover:ring-white/20'
                  }`}
                >
                  <Image
                    src={`${UPLOAD_URL}/${img.thumbnailPath}`}
                    alt={img.title}
                    width={200}
                    height={Math.round((200 * img.height) / img.width)}
                    className="w-full h-auto"
                  />
                  {selectedIds.has(img.id) && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-gallery-accent rounded-full flex items-center justify-center text-xs text-gallery-black font-bold">
                      +
                    </div>
                  )}
                  <div className="px-1 py-0.5 text-xs truncate">{img.title}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
