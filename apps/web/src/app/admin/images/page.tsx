'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useNotification } from '@/hooks/useNotification';
import type { Category, Project, GalleryImage, Artist } from '@gallery/shared';
import { UPLOAD_URL } from '@/config';
import { BulkActionBar } from './bulk-action-bar';
import { FilterSortBar } from './filter-sort-bar';
import { UploadForm } from './upload-form';

export default function AdminImagesPage() {
  const { token } = useAuthStore();
  const notify = useNotification();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Filters & sorting
  const [filterArtist, setFilterArtist] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterArchive, setFilterArchive] = useState<'all' | 'active' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'printsSold' | 'artistName'>(
    'createdAt',
  );
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [colsPerRow, setColsPerRow] = useState<number>(3);

  // Keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const gridRef = useRef<HTMLDivElement>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [aiProgress, setAiProgress] = useState<{ done: number; total: number } | null>(null);

  const selectedArtistId = useMemo(() => {
    if (selectedIds.size === 0) return null;
    const artistIds = new Set(
      images.filter((img) => selectedIds.has(img.id)).map((img) => img.artist?.id),
    );
    return artistIds.size === 1 ? [...artistIds][0] : null;
  }, [selectedIds, images]);

  const loadData = useCallback(() => {
    if (!token) return;
    api.images
      .listAdmin(token)
      .then(setImages)
      .catch(() => {});
    api.artists
      .list()
      .then(setArtists)
      .catch(() => {});
    api.categories
      .list()
      .then(setCategories)
      .catch(() => {});
    api.projects
      .list()
      .then(setProjects)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredImages = useMemo(() => {
    let result = [...images];

    if (filterArtist) {
      result = result.filter((img) => img.artist?.id === Number(filterArtist));
    }
    if (filterCategory) {
      result = result.filter((img) => img.category === filterCategory);
    }
    if (filterArchive === 'active') {
      result = result.filter((img) => !img.isArchived);
    } else if (filterArchive === 'archived') {
      result = result.filter((img) => img.isArchived);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'price':
          cmp = Number(a.price) - Number(b.price);
          break;
        case 'printsSold':
          cmp = (a.printsSold || 0) - (b.printsSold || 0);
          break;
        case 'artistName':
          cmp = (a.artist?.name || '').localeCompare(b.artist?.name || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [images, filterArtist, filterCategory, filterArchive, sortBy, sortDir]);

  // Reset focused index when filtered list changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [filteredImages.length]);

  // Keyboard navigation for image grid
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const count = filteredImages.length;
      if (count === 0) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < count - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + colsPerRow < count ? prev + colsPerRow : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev - colsPerRow >= 0 ? prev - colsPerRow : prev));
      } else if (e.key === ' ' && focusedIndex >= 0) {
        e.preventDefault();
        toggleSelection(filteredImages[focusedIndex].id);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredImages, focusedIndex, colsPerRow]);

  // Scroll focused card into view
  useEffect(() => {
    if (focusedIndex < 0 || !gridRef.current) return;
    const card = gridRef.current.children[focusedIndex] as HTMLElement | undefined;
    card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedIndex]);

  async function handleToggleArchive(image: GalleryImage) {
    if (!token) return;
    try {
      await api.images.update(image.id, { isArchived: !image.isArchived }, token);
      notify.success(image.isArchived ? 'Image unarchived' : 'Image archived');
      loadData();
    } catch {
      notify.error('Failed to update image');
    }
  }

  async function handleDelete(id: number) {
    if (!token || !confirm('Delete this image?')) return;
    await api.images.delete(id, token);
    loadData();
  }

  function handleSortChange(value: string) {
    const [field, dir] = value.split(':');
    setSortBy(field as typeof sortBy);
    setSortDir(dir as 'asc' | 'desc');
  }

  // Bulk selection
  function toggleSelection(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filteredImages.map((img) => img.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function handleBulkAction(action: string, value?: string) {
    if (!token || selectedIds.size === 0) return;
    try {
      await api.images.bulkAction({ ids: Array.from(selectedIds), action, value }, token);
      setSelectedIds(new Set());
      notify.success('Bulk action applied');
      loadData();
    } catch {
      notify.error('Failed to apply bulk action');
    }
  }

  async function handleBulkAiDescribe(applyTitleDesc: boolean) {
    if (!token || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    setAiProgress({ done: 0, total: ids.length });
    let failed = 0;
    for (let i = 0; i < ids.length; i++) {
      try {
        await api.ai.describe(ids[i], token, applyTitleDesc);
      } catch {
        failed++;
      }
      setAiProgress({ done: i + 1, total: ids.length });
    }
    setAiProgress(null);
    if (failed > 0) {
      notify.error(`AI describe failed for ${failed} image(s)`);
    } else {
      notify.success('AI descriptions generated');
    }
    if (applyTitleDesc) loadData();
  }

  async function handleBulkDelete() {
    if (!token || selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} image(s) permanently? This cannot be undone.`)) return;
    const ids = Array.from(selectedIds);
    let failed = 0;
    for (const id of ids) {
      try {
        await api.images.delete(id, token);
      } catch {
        failed++;
      }
    }
    setSelectedIds(new Set());
    if (failed > 0) {
      notify.error(`Failed to delete ${failed} image(s)`);
    } else {
      notify.success(`${ids.length} image(s) deleted`);
    }
    loadData();
  }

  const gridOptions = [
    { cols: 1, className: 'grid-cols-1' },
    { cols: 3, className: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' },
    { cols: 5, className: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' },
    { cols: 10, className: 'grid-cols-3 sm:grid-cols-5 lg:grid-cols-10' },
  ];

  return (
    <div className="pb-20">
      <h1 className="font-serif text-3xl mb-8">Images</h1>

      <UploadForm
        token={token}
        artists={artists}
        categories={categories}
        onUploadComplete={loadData}
      />

      <FilterSortBar
        filterArtist={filterArtist}
        onFilterArtistChange={setFilterArtist}
        filterCategory={filterCategory}
        onFilterCategoryChange={setFilterCategory}
        filterArchive={filterArchive}
        onFilterArchiveChange={setFilterArchive}
        sortValue={`${sortBy}:${sortDir}`}
        onSortChange={handleSortChange}
        colsPerRow={colsPerRow}
        onColsPerRowChange={setColsPerRow}
        imageCount={filteredImages.length}
        selectedCount={selectedIds.size}
        onToggleSelectAll={() => {
          if (selectedIds.size === filteredImages.length) {
            deselectAll();
          } else {
            selectAll();
          }
        }}
        artists={artists}
        categories={categories}
      />

      {/* Image grid */}
      <div
        ref={gridRef}
        className={`grid gap-4 ${gridOptions.find((o) => o.cols === colsPerRow)?.className ?? gridOptions[1].className}`}
      >
        {filteredImages.map((image, idx) => (
          <div
            key={image.id}
            onClick={() => setFocusedIndex(idx)}
            className={`relative border rounded-lg overflow-hidden ${
              selectedIds.has(image.id)
                ? 'ring-2 ring-gallery-accent border-gallery-accent/50'
                : focusedIndex === idx
                  ? 'ring-2 ring-white/50 border-white/30'
                  : 'border-white/10'
            }`}
          >
            {/* Selection checkbox */}
            <label className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedIds.has(image.id)}
                onChange={() => toggleSelection(image.id)}
                className="accent-gallery-accent w-4 h-4 cursor-pointer"
              />
            </label>

            {/* Archived badge */}
            {image.isArchived && (
              <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-gray-600/80 text-white text-xs rounded-full">
                Archived
              </span>
            )}

            <Link href={`/admin/images/${image.id}`} className="block relative aspect-4/3">
              <Image
                src={`${UPLOAD_URL}/${image.thumbnailPath}?v=${new Date(image.updatedAt).getTime()}`}
                alt={image.title}
                fill
                className={`object-contain ${image.isArchived ? 'opacity-50' : ''}`}
              />
            </Link>
            <div className="p-4">
              <h3 className="font-serif text-lg">{image.title}</h3>
              <p className="text-gallery-gray text-sm truncate">
                {image.description || 'No description'}
              </p>
              {image.adminNote && (
                <p className="text-yellow-500/70 text-xs truncate mt-0.5">{image.adminNote}</p>
              )}
              <p className="text-sm mt-1">
                ${image.price} &middot; {image.artist?.name} &middot;{' '}
                <span className="text-gallery-gray">{image.category.replace(/_/g, ' ')}</span>
              </p>
              {image.printEnabled && (
                <p className="text-gallery-accent text-xs mt-1">
                  Prints: {image.printOptions?.length || 0} option(s)
                  {image.printLimit && ` \u00B7 ${image.printsSold}/${image.printLimit} sold`}
                </p>
              )}

              {colsPerRow >= 5 ? (
                /* Icon buttons for compact views (5 or 10 per row) */
                <div className="flex gap-1 mt-3">
                  <Link
                    href={`/admin/images/${image.id}`}
                    title="Edit"
                    className="p-1.5 rounded hover:bg-white/10 transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleToggleArchive(image)}
                    title={image.isArchived ? 'Unarchive' : 'Archive'}
                    className="p-1.5 rounded hover:bg-white/10 transition-colors"
                  >
                    {image.isArchived ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 10h18M3 6h18m-9 8l-3 3m0 0l3 3m-3-3h12"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                        />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    title="Delete"
                    className="p-1.5 rounded hover:bg-white/10 text-red-400 transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                /* Text buttons for spacious views (1 or 3 per row) */
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link
                    href={`/admin/images/${image.id}`}
                    className="px-3 py-1 border border-white/10 rounded text-xs hover:border-white/30"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleToggleArchive(image)}
                    className="px-3 py-1 border border-white/10 rounded text-xs hover:border-white/30"
                  >
                    {image.isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="px-3 py-1 border border-red-500/30 text-red-400 rounded text-xs hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <p className="text-center text-gallery-gray py-12">
          {images.length === 0 ? 'No images uploaded yet.' : 'No images match the current filters.'}
        </p>
      )}

      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          images={images}
          categories={categories}
          projects={projects}
          artists={artists}
          selectedArtistId={selectedArtistId}
          aiProgress={aiProgress}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onBulkAction={handleBulkAction}
          onBulkAiDescribe={handleBulkAiDescribe}
          onBulkDelete={handleBulkDelete}
        />
      )}
    </div>
  );
}
