'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { ImageCategory } from '@gallery/shared';

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
  category: ImageCategory;
}

export default function AdminImagesPage() {
  const { token } = useAuthStore();
  const [images, setImages] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
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

  // Shared upload controls (persist between uploads)
  const [sharedArtistId, setSharedArtistId] = useState('');
  const [sharedCategory, setSharedCategory] = useState<ImageCategory>(ImageCategory.Other);

  // Filters & sorting
  const [filterArtist, setFilterArtist] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'printsSold' | 'artistName'>(
    'createdAt',
  );
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, [token]);

  // Default sharedArtistId to first artist when artists load
  useEffect(() => {
    if (artists.length > 0 && !sharedArtistId) {
      setSharedArtistId(String(artists[0].id));
    }
  }, [artists, sharedArtistId]);

  function loadData() {
    if (!token) return;
    api.images
      .list()
      .then(setImages)
      .catch(() => {});
    api.artists
      .list()
      .then(setArtists)
      .catch(() => {});
    api.services
      .fulfillmentSkus()
      .then(setAvailableSkus)
      .catch(() => {});
  }

  // Filtered & sorted images
  const filteredImages = useMemo(() => {
    let result = [...images];

    if (filterArtist) {
      result = result.filter((img) => img.artistId === Number(filterArtist));
    }
    if (filterCategory) {
      result = result.filter((img) => img.category === filterCategory);
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
  }, [images, filterArtist, filterCategory, sortBy, sortDir]);

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

  // Apply shared category to all files
  function handleSharedCategoryChange(cat: ImageCategory) {
    setSharedCategory(cat);
    setDroppedFiles((prev) => prev.map((f) => ({ ...f, category: cat })));
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

  const inputClass =
    'w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white';
  const selectClass =
    'px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gallery-accent';

  return (
    <div>
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

      {/* Metadata form (shown when files selected) */}
      {droppedFiles.length > 0 && (
        <div className="mb-8 p-6 border border-white/10 rounded-lg space-y-4">
          {/* Shared controls */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
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
            <div className="flex-1">
              <label className="block text-xs text-gallery-gray mb-1">Category (all images)</label>
              <select
                value={sharedCategory}
                onChange={(e) => handleSharedCategoryChange(e.target.value as ImageCategory)}
                className={`${selectClass} w-full`}
              >
                {Object.values(ImageCategory).map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Per-image rows */}
          <div className="space-y-3">
            {droppedFiles.map((df, idx) => (
              <div key={idx} className="flex gap-3 items-center">
                <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-white/5">
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
                  className={`${inputClass} flex-1`}
                />
                <input
                  value={df.price}
                  onChange={(e) => updateDroppedFile(idx, 'price', e.target.value)}
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  className={`${inputClass} w-24`}
                />
                <select
                  value={df.category}
                  onChange={(e) =>
                    updateDroppedFile(idx, 'category', e.target.value as ImageCategory)
                  }
                  className={`${selectClass}`}
                >
                  {Object.values(ImageCategory).map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, ' ')}
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
          {Object.values(ImageCategory).map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          value={`${sortBy}:${sortDir}`}
          onChange={(e) => handleSortChange(e.target.value)}
          className={selectClass}
        >
          <option value="createdAt:desc">Date (newest)</option>
          <option value="createdAt:asc">Date (oldest)</option>
          <option value="price:desc">Price (high→low)</option>
          <option value="price:asc">Price (low→high)</option>
          <option value="artistName:asc">Artist (A→Z)</option>
          <option value="artistName:desc">Artist (Z→A)</option>
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
          <div key={image.id} className="border border-white/10 rounded-lg overflow-hidden">
            <Image
              src={`${UPLOAD_URL}/${image.thumbnailPath}`}
              alt={image.title}
              width={400}
              height={300}
              className="w-full h-48 object-cover"
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
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => startEdit(image)}
                      className="px-3 py-1 border border-white/10 rounded text-xs hover:border-white/30"
                    >
                      Edit
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
    </div>
  );
}
