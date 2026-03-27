'use client';

import { useEffect, useState, useRef, useCallback, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useNotification } from '@/hooks/useNotification';
import type { Category, Project, Tag } from '@gallery/shared';
import { UPLOAD_URL } from '@/config';
import CreatableSelect from 'react-select/creatable';
import { darkSelectStyles } from '@/lib/select-styles';

interface PrintOptionRow {
  sku: string;
  description: string;
  price: number;
}

interface ImageData {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  projectId: number | null;
  allowDownloadOriginal: boolean;
  printEnabled: boolean;
  printLimit: number | null;
  printsSold: number;
  printOptions: PrintOptionRow[];
  isArchived: boolean;
  thumbnailPath: string;
  watermarkPath: string;
  filePath: string;
  width: number;
  height: number;
  artist: { id: number; name: string };
  tags?: { id: number; name: string; slug: string }[];
  adminNote?: string | null;
  aiDescription?: string | null;
}

export default function AdminImageEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const imageId = Number(id);
  const router = useRouter();
  const { token } = useAuthStore();
  const notify = useNotification();

  const [image, setImage] = useState<ImageData | null>(null);
  const [editData, setEditData] = useState<{
    title: string;
    description: string;
    category: string;
    price: number;
    projectId: number | null;
    allowDownloadOriginal: boolean;
    printEnabled: boolean;
    printLimit: number | null;
    adminNote: string;
  }>({
    title: '',
    description: '',
    category: '',
    price: 0,
    projectId: null,
    allowDownloadOriginal: false,
    printEnabled: false,
    printLimit: null,
    adminNote: '',
  });
  const [printOptions, setPrintOptions] = useState<PrintOptionRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableSkus, setAvailableSkus] = useState<
    { provider: string; sku: string; description: string }[]
  >([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialState = useRef<string>('');

  const isDirty = useCallback(() => {
    if (!initialState.current) return false;
    const current = JSON.stringify({ editData, tagIds: selectedTagIds });
    return current !== initialState.current;
  }, [editData, selectedTagIds]);

  useEffect(() => {
    if (!token) return;
    api.images.getAdmin(imageId, token).then((img) => {
      const data = img as unknown as ImageData;
      setImage(data);
      setEditData({
        title: data.title,
        description: data.description ?? '',
        category: data.category ?? '',
        price: data.price,
        projectId: data.projectId,
        allowDownloadOriginal: data.allowDownloadOriginal ?? false,
        printEnabled: data.printEnabled ?? false,
        printLimit: data.printLimit,
        adminNote: data.adminNote ?? '',
      });
      setPrintOptions(
        (data.printOptions || []).map((o) => ({
          sku: o.sku,
          description: o.description,
          price: Number(o.price),
        })),
      );
      const tagIds = (data.tags || []).map((t) => t.id);
      setSelectedTagIds(tagIds);
      // Snapshot initial state for dirty checking
      initialState.current = JSON.stringify({
        editData: {
          title: data.title,
          description: data.description ?? '',
          category: data.category ?? '',
          price: data.price,
          projectId: data.projectId,
          allowDownloadOriginal: data.allowDownloadOriginal ?? false,
          printEnabled: data.printEnabled ?? false,
          printLimit: data.printLimit,
          adminNote: data.adminNote ?? '',
        },
        tagIds,
      });
    });
    api.categories.list().then(setCategories);
    api.projects.list().then(setProjects);
    api.services.fulfillmentSkus().then(setAvailableSkus);
    api.tags.list().then(setAllTags);
  }, [token, imageId]);

  // Warn on browser back/refresh with unsaved changes
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty()) {
        e.preventDefault();
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  async function handleSave() {
    if (!token || !image) return;
    setSaving(true);
    try {
      await api.images.update(
        imageId,
        { ...editData, printOptions, tagIds: selectedTagIds } as Record<string, unknown>,
        token,
      );
      notify.success('Image updated');
      // Refresh image data and tags list
      const [img, tags] = await Promise.all([
        api.images.getAdmin(imageId, token) as Promise<unknown>,
        api.tags.list(),
      ]);
      const refreshed = img as ImageData;
      setImage(refreshed);
      const newTagIds = (refreshed.tags || []).map((t) => t.id);
      setSelectedTagIds(newTagIds);
      setAllTags(tags);
      // Reset dirty tracking
      initialState.current = JSON.stringify({ editData, tagIds: newTagIds });
    } catch {
      notify.error('Failed to update image');
    } finally {
      setSaving(false);
    }
  }

  async function handleAiDescribe() {
    if (!token) return;
    setAiLoading(true);
    try {
      const result = await api.ai.describe(imageId, token);
      setEditData((prev) => ({
        ...prev,
        description: result.description,
        ...(result.title ? { title: result.title } : {}),
      }));
      notify.success('Title and description generated');
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to generate description');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleToggleArchive() {
    if (!token || !image) return;
    try {
      await api.images.update(imageId, { isArchived: !image.isArchived }, token);
      notify.success(image.isArchived ? 'Image unarchived' : 'Image archived');
      setImage({ ...image, isArchived: !image.isArchived });
    } catch {
      notify.error('Failed to update image');
    }
  }

  async function handleDelete() {
    if (!token || !confirm('Delete this image permanently?')) return;
    try {
      await api.images.delete(imageId, token);
      notify.success('Image deleted');
      router.push('/admin/images');
    } catch {
      notify.error('Failed to delete image');
    }
  }

  function addPrintOption() {
    setPrintOptions((opts) => [...opts, { sku: '', description: '', price: 0 }]);
  }

  function updatePrintOption(index: number, field: string, value: string | number) {
    setPrintOptions((opts) =>
      opts.map((o, i) => {
        if (i !== index) return o;
        if (field === 'sku') {
          const catalog = availableSkus.find((s) => s.sku === value);
          return { ...o, sku: String(value), description: catalog?.description || o.description };
        }
        return { ...o, [field]: value };
      }),
    );
  }

  function removePrintOption(index: number) {
    setPrintOptions((opts) => opts.filter((_, i) => i !== index));
  }

  if (!image) {
    return <div className="py-12 text-center text-gallery-gray">Loading...</div>;
  }

  const inputClass =
    'w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent';

  const filteredProjects = projects.filter((p) => p.artistId === image.artist.id);

  return (
    <div className="pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => {
            if (isDirty() && !confirm('You have unsaved changes. Leave anyway?')) return;
            router.push('/admin/images');
          }}
          className="text-gallery-gray hover:text-white text-sm"
        >
          &larr; Back
        </button>
        <h1 className="font-serif text-3xl">Edit Image</h1>
        {image.isArchived && (
          <span className="px-2 py-0.5 bg-gray-600/80 text-white text-xs rounded-full">
            Archived
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
        {/* Left: Image preview */}
        <div>
          <button onClick={() => setLightboxOpen(true)} className="w-full text-left">
            <Image
              src={`${UPLOAD_URL}/${image.thumbnailPath}`}
              alt={image.title}
              width={360}
              height={360}
              className="w-full h-auto rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity"
            />
          </button>
          <p className="text-xs text-gallery-gray mt-2">
            {image.artist?.name} &middot; {image.width}&times;{image.height} &middot; ID: {image.id}
          </p>
        </div>

        {/* Right: Edit form */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Title</label>
            <input
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Description</label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              rows={4}
              className={inputClass}
            />
            <button
              onClick={handleAiDescribe}
              disabled={aiLoading}
              className="mt-1 px-3 py-1 border border-gallery-accent text-gallery-accent rounded text-xs hover:bg-gallery-accent hover:text-gallery-black disabled:opacity-50 transition-colors"
            >
              {aiLoading ? 'Generating...' : 'AI Describe'}
            </button>
          </div>

          {/* AI Description (read-only, used by chat search) */}
          {image.aiDescription && (
            <div>
              <label className="block text-xs text-gallery-gray mb-1">
                AI Description (auto-generated, used by chat search)
              </label>
              <p className="px-3 py-1.5 bg-white/5 border border-white/5 rounded text-sm text-white/60 whitespace-pre-wrap">
                {image.aiDescription}
              </p>
            </div>
          )}

          {/* Admin Note */}
          <div>
            <label className="block text-xs text-gallery-gray mb-1">
              Admin Note (internal only)
            </label>
            <textarea
              value={editData.adminNote}
              onChange={(e) => setEditData({ ...editData, adminNote: e.target.value })}
              rows={2}
              placeholder="Internal note, not visible to visitors"
              className={inputClass}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Category</label>
            <select
              value={editData.category}
              onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              className={inputClass}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Price</label>
            <input
              value={editData.price}
              onChange={(e) => setEditData({ ...editData, price: +e.target.value })}
              type="number"
              step="0.01"
              className={inputClass}
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Project</label>
            <select
              value={editData.projectId ?? ''}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  projectId: e.target.value ? Number(e.target.value) : null,
                })
              }
              className={inputClass}
            >
              <option value="">No project</option>
              {filteredProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Tags</label>
            <CreatableSelect
              isMulti
              options={allTags.map((t) => ({ value: t.id, label: t.name }))}
              value={selectedTagIds.map((id) => {
                const tag = allTags.find((t) => t.id === id);
                return { value: id, label: tag?.name ?? String(id) };
              })}
              onChange={(opts) => setSelectedTagIds(opts.map((o) => o.value))}
              onCreateOption={async (name) => {
                if (!token) return;
                const slug = name
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]+/g, '_')
                  .replace(/^_|_$/g, '');
                try {
                  const newTag = await api.tags.create({ name, slug }, token);
                  setAllTags((prev) => [...prev, newTag]);
                  setSelectedTagIds((prev) => [...prev, newTag.id]);
                } catch {
                  /* tag may already exist */
                }
              }}
              placeholder="Select or create tags..."
              styles={darkSelectStyles<{ value: number; label: string }>()}
            />
          </div>

          {/* Checkboxes */}
          <div className="border-t border-white/10 pt-4 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editData.allowDownloadOriginal}
                onChange={(e) =>
                  setEditData({ ...editData, allowDownloadOriginal: e.target.checked })
                }
                className="accent-gallery-accent"
              />
              Allow full resolution download
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editData.printEnabled}
                onChange={(e) => setEditData({ ...editData, printEnabled: e.target.checked })}
                className="accent-gallery-accent"
              />
              Available as Print
            </label>
          </div>

          {/* Print settings */}
          {editData.printEnabled && (
            <div className="border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gallery-gray whitespace-nowrap">Print Limit</label>
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
                <p className="text-xs text-gallery-gray">Prints sold: {image.printsSold}</p>
              )}

              <div className="space-y-2">
                <label className="text-xs text-gallery-gray">Print Options</label>
                {printOptions.map((opt, idx) => (
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
                      className={`${inputClass} w-24`}
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
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-gallery-accent text-gallery-black rounded-lg text-sm font-medium hover:bg-gallery-accent-light transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleToggleArchive}
              className="px-4 py-2 border border-white/10 rounded-lg text-sm hover:border-white/30 transition-colors"
            >
              {image.isArchived ? 'Unarchive' : 'Archive'}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 cursor-zoom-out"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={`${UPLOAD_URL}/${image.filePath}`}
            alt={image.title}
            className="max-w-[95vw] max-h-[95vh] object-contain"
          />
        </div>
      )}
    </div>
  );
}
