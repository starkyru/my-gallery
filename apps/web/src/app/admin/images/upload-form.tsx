'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useNotification } from '@/hooks/useNotification';
import type { Category, Artist } from '@gallery/shared';
import heic2any from 'heic2any';

interface DroppedFile {
  id: string;
  file: File;
  title: string;
  price: string;
  category: string;
  previewUrl: string;
  previewLoading: boolean;
}

interface UploadFormProps {
  token: string | null;
  artists: Artist[];
  categories: Category[];
  onUploadComplete: () => void;
}

const selectClass =
  'px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gallery-accent';

function isHeicFile(file: File) {
  return /\.hei[cf]$/i.test(file.name) || file.type === 'image/heic' || file.type === 'image/heif';
}

export function UploadForm({ token, artists, categories, onUploadComplete }: UploadFormProps) {
  const notify = useNotification();
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [aiProgress, setAiProgress] = useState<{ done: number; total: number } | null>(null);
  const [sharedArtistId, setSharedArtistId] = useState('');
  const [autoDescribe, setAutoDescribe] = useState(false);
  const sharedCategory = 'other';

  useEffect(() => {
    if (artists.length > 0 && !sharedArtistId) {
      setSharedArtistId(String(artists[0].id));
    }
  }, [artists, sharedArtistId]);

  function addFiles(files: File[]) {
    let fileIdCounter = Date.now();
    const newFiles: DroppedFile[] = files.map((file) => ({
      id: String(fileIdCounter++),
      file,
      title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      price: '',
      category: sharedCategory,
      previewUrl: isHeicFile(file) ? '' : URL.createObjectURL(file),
      previewLoading: isHeicFile(file),
    }));
    setDroppedFiles((prev) => [...prev, ...newFiles]);

    const heicFiles = newFiles.filter((df) => df.previewLoading);
    (async () => {
      for (const df of heicFiles) {
        try {
          const result = await heic2any({ blob: df.file, toType: 'image/jpeg', quality: 0.5 });
          const blob = Array.isArray(result) ? result[0] : result;
          const previewUrl = URL.createObjectURL(blob);
          setDroppedFiles((prev) =>
            prev.map((f) => (f.id === df.id ? { ...f, previewUrl, previewLoading: false } : f)),
          );
        } catch {
          setDroppedFiles((prev) =>
            prev.map((f) => (f.id === df.id ? { ...f, previewLoading: false } : f)),
          );
        }
      }
    })();
  }

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
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith('image/') || /\.hei[cf]$/i.test(f.name),
    );
    addFiles(files);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function updateDroppedFile(index: number, field: keyof DroppedFile, value: string | File) {
    setDroppedFiles((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  }

  function removeDroppedFile(index: number) {
    setDroppedFiles((prev) => {
      if (prev[index]?.previewUrl) URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleUploadAll() {
    if (!token || droppedFiles.length === 0 || !sharedArtistId) return;

    const uploadedIds: number[] = [];
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
        const result = (await api.images.upload(formData, token)) as { id: number };
        uploadedIds.push(result.id);
      } catch {
        // continue with remaining files
      }
      setUploadProgress({ done: i + 1, total: droppedFiles.length });
    }
    setUploadProgress(null);
    droppedFiles.forEach((df) => {
      if (df.previewUrl) URL.revokeObjectURL(df.previewUrl);
    });
    setDroppedFiles([]);

    if (autoDescribe && uploadedIds.length > 0) {
      setAiProgress({ done: 0, total: uploadedIds.length });
      for (let i = 0; i < uploadedIds.length; i++) {
        try {
          await api.ai.describe(uploadedIds[i], token, true);
        } catch {
          // continue with remaining
        }
        setAiProgress({ done: i + 1, total: uploadedIds.length });
      }
      setAiProgress(null);
    }

    notify.success('Upload complete');
    onUploadComplete();
  }

  return (
    <>
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
        <p className="text-gallery-gray">
          Drop images here or click to browse (JPEG, PNG, WebP, TIFF, HEIC)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Metadata form */}
      {droppedFiles.length > 0 && (
        <div className="mb-8 p-4 sm:p-6 border border-white/10 rounded-lg space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
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
            <label className="flex items-center gap-1.5 text-sm text-gallery-gray cursor-pointer pb-1">
              <input
                type="checkbox"
                checked={autoDescribe}
                onChange={(e) => setAutoDescribe(e.target.checked)}
                className="accent-gallery-accent"
              />
              Auto-generate descriptions
            </label>
          </div>

          <div className="space-y-3">
            {droppedFiles.map((df, idx) => (
              <div key={df.id} className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
                <div className="w-12 h-12 shrink-0 rounded overflow-hidden bg-white/5">
                  {df.previewLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-gallery-accent rounded-full animate-spin" />
                    </div>
                  ) : df.previewUrl ? (
                    <Image
                      src={df.previewUrl}
                      alt={df.title}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gallery-gray">
                      HEIC
                    </div>
                  )}
                </div>
                <input
                  value={df.title}
                  onChange={(e) => updateDroppedFile(idx, 'title', e.target.value)}
                  disabled={autoDescribe}
                  placeholder={autoDescribe ? 'AI will generate' : 'Title'}
                  className={`flex-1 min-w-0 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white ${autoDescribe ? 'opacity-40' : ''}`}
                />
                <input
                  value={df.price}
                  onChange={(e) => updateDroppedFile(idx, 'price', e.target.value)}
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  className="w-20 sm:w-24 shrink-0 px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
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
            disabled={uploadProgress !== null || aiProgress !== null || !sharedArtistId}
            className="px-6 py-2 bg-gallery-accent text-gallery-black rounded-lg text-sm font-medium hover:bg-gallery-accent-light transition-colors disabled:opacity-50"
          >
            {uploadProgress
              ? `Uploading ${uploadProgress.done}/${uploadProgress.total}...`
              : aiProgress
                ? `AI Describing ${aiProgress.done}/${aiProgress.total}...`
                : `Upload ${droppedFiles.length} Image${droppedFiles.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </>
  );
}
