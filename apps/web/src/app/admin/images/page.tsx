'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Category, Project } from '@gallery/shared';

const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || 'http://localhost:4000/uploads';

interface PrintOptionRow {
  sku: string;
  description: string;
  price: number;
}

interface DroppedFile {
  file: File;
  title: string;
  price: string;
  category: string;
}

export default function AdminImagesPage() {
  const { token } = useAuthStore();
  const [images, setImages] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [editPrintOptions, setEditPrintOptions] = useState<PrintOptionRow[]>([]);
  const [aiLoading, setAiLoading] = useState<number | null>(null);
  const [availableSkus, setAvailableSkus] = useState<
    { provider: string; sku: string; description: string }[]
  >([]);

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

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkCategory, setBulkCategory] = useState('');

  useEffect(() => {
    loadData();
  }, [token]);

  useEffect(() => {
    if (artists.length > 0 && !sharedArtistId) {
      setSharedArtistId(String(artists[0].id));
    }
  }, [artists, sharedArtistId]);

  function loadData() {
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
    api.services
      .fulfillmentSkus()
      .then(setAvailableSkus)
      .catch(() => {});
    api.projects
      .list()
      .then(setProjects)
      .catch(() => {});
  }

  const filteredImages = useMemo(() => {
    let result = [...images];

    if (filterArtist) {
      result = result.filter((img) => img.artistId === Number(filterArtist));
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

  function updateDroppedFile(index: number, field: keyof DroppedFile, value: any) {
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
    loadData();
  }

  async function handleAiDescribe(imageId: number) {
    if (!token) return;
    setAiLoading(imageId);
    try {
      const { description } = await api.ai.describe(imageId, token);
      await api.images.update(imageId, { description }, token);
      loadData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAiLoading(null);
    }
  }

  async function handleToggleArchive(image: any) {
    if (!token) return;
    await api.images.update(image.id, { isArchived: !image.isArchived }, token);
    loadData();
  }

  function startEdit(image: any) {
    setEditingId(image.id);
    setEditData({
      printEnabled: image.printEnabled ?? false,
      printLimit: image.printLimit,
    });
    setEditPrintOptions(
      (image.printOptions || []).map((o: any) => ({
        sku: o.sku,
        description: o.description,
        price: Number(o.price),
      })),
    );
  }

  async function handleSaveEdit() {
    if (!token || editingId === null) return;
    await api.images.update(
      editingId,
      {
        ...editData,
        printOptions: editPrintOptions,
      },
      token,
    );
    setEditingId(null);
    loadData();
  }

  async function handleDelete(id: number) {
    if (!token || !confirm('Delete this image?')) return;
    await api.images.delete(id, token);
    loadData();
  }

  function addPrintOption() {
    setEditPrintOptions((opts) => [...opts, { sku: '', description: '', price: 0 }]);
  }

  function updatePrintOption(index: number, field: string, value: any) {
    setEditPrintOptions((opts) =>
      opts.map((o, i) => {
        if (i !== index) return o;
        if (field === 'sku') {
          const catalog = availableSkus.find((s) => s.sku === value);
          return { ...o, sku: value, description: catalog?.description || o.description };
        }
        return { ...o, [field]: value };
      }),
    );
  }

  function removePrintOption(index: number) {
    setEditPrintOptions((opts) => opts.filter((_, i) => i !== index));
  }

  function handleSortChange(value: string) {
    const [field, dir] = value.split(':');
    setSortBy(field as any);
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
    await api.images.bulkAction({ ids: Array.from(selectedIds), action, value }, token);
    setSelectedIds(new Set());
    loadData();
  }

  const inputClass =
    'w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white';
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
          onChange={(e) => setFilterArchive(e.target.value as any)}
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
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              className={`w-full h-48 object-cover ${image.isArchived ? 'opacity-50' : ''}`}
            />
            <div className="p-4">
              {editingId === image.id ? (
                <div className="space-y-2">
                  <input
                    value={editData.title ?? image.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className={inputClass}
                  />
                  <textarea
                    value={editData.description ?? image.description ?? ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={3}
                    className={inputClass}
                  />
                  <input
                    value={editData.price ?? image.price}
                    onChange={(e) => setEditData({ ...editData, price: +e.target.value })}
                    type="number"
                    step="0.01"
                    className={inputClass}
                  />

                  {/* Project */}
                  <select
                    value={editData.projectId ?? image.projectId ?? ''}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        projectId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="">No project</option>
                    {projects
                      .filter((p) => p.artistId === (editData.artistId ?? image.artistId))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>

                  {/* Print settings */}
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <label className="flex items-center gap-2 text-sm mb-2">
                      <input
                        type="checkbox"
                        checked={editData.printEnabled ?? false}
                        onChange={(e) =>
                          setEditData({ ...editData, printEnabled: e.target.checked })
                        }
                      />
                      Available as Print
                    </label>

                    {editData.printEnabled && (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-xs text-gallery-gray whitespace-nowrap">
                            Print Limit
                          </label>
                          <input
                            value={editData.printLimit ?? ''}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                printLimit: e.target.value ? +e.target.value : null,
                              })
                            }
                            type="number"
                            placeholder="Unlimited"
                            className={`${inputClass} flex-1`}
                          />
                        </div>

                        {image.printsSold > 0 && (
                          <p className="text-xs text-gallery-gray mb-2">
                            Prints sold: {image.printsSold}
                          </p>
                        )}

                        <div className="space-y-2">
                          {editPrintOptions.map((opt, idx) => (
                            <div key={idx} className="flex gap-1.5 items-center">
                              <select
                                value={opt.sku}
                                onChange={(e) => updatePrintOption(idx, 'sku', e.target.value)}
                                className={`${inputClass} flex-1`}
                              >
                                <option value="">Select SKU</option>
                                {availableSkus.map((s) => (
                                  <option key={`${s.provider}-${s.sku}`} value={s.sku}>
                                    {s.description} ({s.provider})
                                  </option>
                                ))}
                              </select>
                              <input
                                value={opt.price || ''}
                                onChange={(e) => updatePrintOption(idx, 'price', +e.target.value)}
                                type="number"
                                step="0.01"
                                placeholder="Price"
                                className={`${inputClass} w-20`}
                              />
                              <button
                                onClick={() => removePrintOption(idx)}
                                className="text-red-400 text-xs hover:text-red-300 px-1"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={addPrintOption}
                            className="text-xs text-gallery-accent hover:underline"
                          >
                            + Add print option
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-gallery-accent text-gallery-black rounded text-xs"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 border border-white/10 rounded text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
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
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => startEdit(image)}
                      className="px-3 py-1 border border-white/10 rounded text-xs hover:border-white/30"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleArchive(image)}
                      className="px-3 py-1 border border-white/10 rounded text-xs hover:border-white/30"
                    >
                      {image.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      onClick={() => handleAiDescribe(image.id)}
                      disabled={aiLoading === image.id}
                      className="px-3 py-1 border border-gallery-accent text-gallery-accent rounded text-xs hover:bg-gallery-accent hover:text-gallery-black disabled:opacity-50"
                    >
                      {aiLoading === image.id ? 'Generating...' : 'AI Describe'}
                    </button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="px-3 py-1 border border-red-500/30 text-red-400 rounded text-xs hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </>
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
          </div>
        </div>
      )}
    </div>
  );
}
