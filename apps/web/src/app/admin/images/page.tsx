'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useNotification } from '@/hooks/useNotification';
import type { Category, Project, GalleryImage, Artist } from '@gallery/shared';
import { UPLOAD_URL } from '@/config';

interface DroppedFile {
  file: File;
  title: string;
  price: string;
  category: string;
}

export default function AdminImagesPage() {
  const { token } = useAuthStore();
  const notify = useNotification();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Drop zone state
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(
    null,
  );

  // Shared upload controls
  const [sharedArtistId, setSharedArtistId] = useState('');
  const sharedCategory = 'other';

  // Filters & sorting
  const [filterArtist, setFilterArtist] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterArchive, setFilterArchive] = useState<'all' | 'active' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'printsSold' | 'artistName'>(
    'createdAt',
  );
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [colsPerRow, setColsPerRow] = useState<number>(3);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkProject, setBulkProject] = useState('');

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

  useEffect(() => {
    if (artists.length > 0 && !sharedArtistId) {
      setSharedArtistId(String(artists[0].id));
    }
  }, [artists, sharedArtistId]);

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

  // Drop zone handlers
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    addFiles(files);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function addFiles(files: File[]) {
    const newFiles: DroppedFile[] = files.map((file) => ({
      file,
      title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      price: '',
      category: sharedCategory,
    }));
    setDroppedFiles((prev) => [...prev, ...newFiles]);
  }

  function updateDroppedFile(index: number, field: keyof DroppedFile, value: string | File) {
    setDroppedFiles((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  }

  function removeDroppedFile(index: number) {
    setDroppedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUploadAll() {
    if (!token || droppedFiles.length === 0 || !sharedArtistId) return;

    setUploadProgress({ done: 0, total: droppedFiles.length });
    for (let i = 0; i < droppedFiles.length; i++) {
      const df = droppedFiles[i];
      const formData = new FormData();
      formData.append('file', df.file);
      formData.append('title', df.title);
      formData.append('price', df.price || '0');
      formData.append('artistId', sharedArtistId);
      formData.append('category', df.category);
      try {
        await api.images.upload(formData, token);
      } catch {
        // continue with remaining files
      }
      setUploadProgress({ done: i + 1, total: droppedFiles.length });
    }
    setUploadProgress(null);
    setDroppedFiles([]);
    notify.success('Upload complete');
    loadData();
  }

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

  const gridOptions = [
    { cols: 1, label: '1 per row', className: 'grid-cols-1' },
    { cols: 3, label: '3 per row', className: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' },
    { cols: 5, label: '5 per row', className: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' },
    { cols: 10, label: '10 per row', className: 'grid-cols-3 sm:grid-cols-5 lg:grid-cols-10' },
  ];

  const selectClass =
    'px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gallery-accent';

  return (
    <div className="pb-20">
      <h1 className="font-serif text-3xl mb-8">Images</h1>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-6 p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-gallery-accent bg-gallery-accent/10'
            : 'border-white/20 hover:border-white/40'
        }`}
      >
        <p className="text-gallery-gray">Drop images here or click to browse</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Metadata form */}
      {droppedFiles.length > 0 && (
        <div className="mb-8 p-6 border border-white/10 rounded-lg space-y-4">
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Artist (all images)</label>
            <select
              value={sharedArtistId}
              onChange={(e) => setSharedArtistId(e.target.value)}
              className={`${selectClass} w-full`}
            >
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {droppedFiles.map((df, idx) => (
              <div key={idx} className="flex gap-3 items-center">
                <div className="w-12 h-12 shrink-0 rounded overflow-hidden bg-white/5">
                  <Image
                    src={URL.createObjectURL(df.file)}
                    alt={df.title}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <input
                  value={df.title}
                  onChange={(e) => updateDroppedFile(idx, 'title', e.target.value)}
                  placeholder="Title"
                  className="flex-1 min-w-0 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
                />
                <input
                  value={df.price}
                  onChange={(e) => updateDroppedFile(idx, 'price', e.target.value)}
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  className="w-24 shrink-0 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
                />
                <select
                  value={df.category}
                  onChange={(e) => updateDroppedFile(idx, 'category', e.target.value)}
                  className={`${selectClass} shrink-0`}
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeDroppedFile(idx)}
                  className="text-red-400 hover:text-red-300 text-lg px-1"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleUploadAll}
            disabled={uploadProgress !== null || !sharedArtistId}
            className="px-6 py-2 bg-gallery-accent text-gallery-black rounded-lg text-sm font-medium hover:bg-gallery-accent-light transition-colors disabled:opacity-50"
          >
            {uploadProgress
              ? `Uploading ${uploadProgress.done}/${uploadProgress.total}...`
              : `Upload ${droppedFiles.length} Image${droppedFiles.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Filter / Sort bar */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <select
          value={filterArtist}
          onChange={(e) => setFilterArtist(e.target.value)}
          className={selectClass}
        >
          <option value="">All Artists</option>
          {artists.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className={selectClass}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filterArchive}
          onChange={(e) => setFilterArchive(e.target.value as typeof filterArchive)}
          className={selectClass}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={`${sortBy}:${sortDir}`}
          onChange={(e) => handleSortChange(e.target.value)}
          className={selectClass}
        >
          <option value="createdAt:desc">Date (newest)</option>
          <option value="createdAt:asc">Date (oldest)</option>
          <option value="price:desc">Price (high-low)</option>
          <option value="price:asc">Price (low-high)</option>
          <option value="artistName:asc">Artist (A-Z)</option>
          <option value="artistName:desc">Artist (Z-A)</option>
          <option value="printsSold:desc">Sales (most)</option>
          <option value="printsSold:asc">Sales (least)</option>
        </select>
        <span className="text-xs text-gallery-gray ml-auto">
          {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''}
        </span>
        <select
          value={colsPerRow}
          onChange={(e) => setColsPerRow(Number(e.target.value))}
          className={selectClass}
        >
          {gridOptions.map((opt) => (
            <option key={opt.cols} value={opt.cols}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Image grid */}
      <div
        className={`grid gap-4 ${gridOptions.find((o) => o.cols === colsPerRow)?.className ?? gridOptions[1].className}`}
      >
        {filteredImages.map((image) => (
          <div
            key={image.id}
            className={`relative border rounded-lg overflow-hidden ${
              selectedIds.has(image.id)
                ? 'ring-2 ring-gallery-accent border-gallery-accent/50'
                : 'border-white/10'
            }`}
          >
            {/* Selection checkbox */}
            <label className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedIds.has(image.id)}
                onChange={() => toggleSelection(image.id)}
                className="accent-gallery-accent w-4 h-4 cursor-pointer"
              />
            </label>

            {/* Archived badge */}
            {image.isArchived && (
              <span className="absolute top-2 right-2 z-10 px-2 py-0.5 bg-gray-600/80 text-white text-xs rounded-full">
                Archived
              </span>
            )}

            <Image
              src={`${UPLOAD_URL}/${image.thumbnailPath}`}
              alt={image.title}
              width={400}
              height={300}
              className={`w-full h-auto ${image.isArchived ? 'opacity-50' : ''}`}
            />
            <div className="p-4">
              <h3 className="font-serif text-lg">{image.title}</h3>
              <p className="text-gallery-gray text-sm truncate">
                {image.description || 'No description'}
              </p>
              <p className="text-sm mt-1">
                ${image.price} &middot; {image.artist?.name}
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

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gallery-black/95 backdrop-blur-md border-t border-white/10 px-6 py-3 z-50">
          <div className="mx-auto max-w-7xl flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <button onClick={selectAll} className="text-xs text-gallery-accent hover:underline">
              Select All
            </button>
            <button onClick={deselectAll} className="text-xs text-gallery-gray hover:text-white">
              Deselect All
            </button>
            <div className="border-l border-white/10 h-6" />
            <button
              onClick={() => handleBulkAction('archive')}
              className="px-3 py-1.5 border border-white/10 rounded text-xs hover:border-white/30"
            >
              Archive
            </button>
            <button
              onClick={() => handleBulkAction('unarchive')}
              className="px-3 py-1.5 border border-white/10 rounded text-xs hover:border-white/30"
            >
              Unarchive
            </button>
            <div className="border-l border-white/10 h-6" />
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className={`${selectClass} text-xs`}
            >
              <option value="">Set category...</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            {bulkCategory && (
              <button
                onClick={() => {
                  handleBulkAction('setCategory', bulkCategory);
                  setBulkCategory('');
                }}
                className="px-3 py-1.5 bg-gallery-accent text-gallery-black rounded text-xs font-medium"
              >
                Apply
              </button>
            )}
            <div className="border-l border-white/10 h-6" />
            <select
              value={bulkProject}
              onChange={(e) => setBulkProject(e.target.value)}
              disabled={selectedArtistId === null}
              className={`${selectClass} text-xs`}
            >
              <option value="">
                {selectedArtistId === null ? 'Set project (same artist only)' : 'Set project...'}
              </option>
              {projects
                .filter((p) => p.artistId === selectedArtistId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            {bulkProject && (
              <button
                onClick={() => {
                  handleBulkAction('setProject', bulkProject);
                  setBulkProject('');
                }}
                className="px-3 py-1.5 bg-gallery-accent text-gallery-black rounded text-xs font-medium"
              >
                Apply
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
