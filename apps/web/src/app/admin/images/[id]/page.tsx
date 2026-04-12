'use client';

import { useEffect, useState, useRef, useCallback, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useNotification } from '@/hooks/useNotification';
import type { Artist, Category, Project, Tag, MediaType, PaintType } from '@gallery/shared';
import { UPLOAD_URL } from '@/config';
import CreatableSelect from 'react-select/creatable';
import { darkSelectStyles } from '@/lib/select-styles';
import { CalendarIcon } from '@/components/icons/calendar-icon';
import { ChevronRightIcon } from '@/components/icons/chevron-right-icon';

interface PrintOptionRow {
  sku: string;
  description: string;
  price: number;
  widthCm: number;
  heightCm: number;
  printLimit: number | null;
  soldCount: number;
}

const cmToInch = (cm: number) => (cm ? +(cm / 2.54).toFixed(2) : 0);
const inchToCm = (inch: number) => (inch ? +(inch * 2.54).toFixed(1) : 0);

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
  perOptionLimits: boolean;
  printOptions: PrintOptionRow[];
  isArchived: boolean;
  thumbnailPath: string;
  watermarkPath: string;
  filePath: string;
  width: number;
  height: number;
  artist: { id: number; name: string };
  tags?: { id: number; name: string; slug: string }[];
  mediaTypes?: { id: number; name: string; slug: string }[];
  paintTypes?: { id: number; name: string; slug: string }[];
  adminNote?: string | null;
  aiDescription?: string | null;
  shotDate?: string | null;
  place?: string | null;
  originalFileName?: string | null;
  sizeWidthCm?: number | null;
  sizeHeightCm?: number | null;
  originalAvailable?: boolean;
  weightGrams?: number | null;
  updatedAt: string;
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
    artistId: number;
    projectId: number | null;
    allowDownloadOriginal: boolean;
    originalAvailable: boolean;
    weightGrams: number | null;
    printEnabled: boolean;
    printLimit: number | null;
    perOptionLimits: boolean;
    adminNote: string;
    shotDate: string;
    place: string;
    sizeWidthCm: number | null;
    sizeHeightCm: number | null;
  }>({
    title: '',
    description: '',
    category: '',
    price: 0,
    artistId: 0,
    projectId: null,
    allowDownloadOriginal: false,
    originalAvailable: false,
    weightGrams: null,
    printEnabled: false,
    printLimit: null,
    perOptionLimits: false,
    adminNote: '',
    shotDate: '',
    place: '',
    sizeWidthCm: null,
    sizeHeightCm: null,
  });
  const [printOptions, setPrintOptions] = useState<PrintOptionRow[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableSkus, setAvailableSkus] = useState<
    { provider: string; sku: string; description: string; widthCm?: number; heightCm?: number }[]
  >([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [allMediaTypes, setAllMediaTypes] = useState<MediaType[]>([]);
  const [selectedMediaTypeIds, setSelectedMediaTypeIds] = useState<number[]>([]);
  const [allPaintTypes, setAllPaintTypes] = useState<PaintType[]>([]);
  const [selectedPaintTypeIds, setSelectedPaintTypeIds] = useState<number[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiKeywordsLoading, setAiKeywordsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [reuploading, setReuploading] = useState(false);
  const reuploadInputRef = useRef<HTMLInputElement>(null);
  const initialState = useRef<string>('');

  const isDirty = useCallback(() => {
    if (!initialState.current) return false;
    const current = JSON.stringify({
      editData,
      tagIds: selectedTagIds,
      mediaTypeIds: selectedMediaTypeIds,
      paintTypeIds: selectedPaintTypeIds,
    });
    return current !== initialState.current;
  }, [editData, selectedTagIds, selectedMediaTypeIds, selectedPaintTypeIds]);

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
        artistId: data.artist.id,
        projectId: data.projectId,
        allowDownloadOriginal: data.allowDownloadOriginal ?? false,
        originalAvailable: data.originalAvailable ?? false,
        weightGrams: data.weightGrams != null ? Number(data.weightGrams) : null,
        printEnabled: data.printEnabled ?? false,
        printLimit: data.printLimit,
        perOptionLimits: data.perOptionLimits ?? false,
        adminNote: data.adminNote ?? '',
        shotDate: data.shotDate ?? '',
        place: data.place ?? '',
        sizeWidthCm: data.sizeWidthCm ? Number(data.sizeWidthCm) : null,
        sizeHeightCm: data.sizeHeightCm ? Number(data.sizeHeightCm) : null,
      });
      setPrintOptions(
        (data.printOptions || []).map((o) => ({
          sku: o.sku,
          description: o.description,
          price: Number(o.price),
          widthCm: Number(o.widthCm) || 0,
          heightCm: Number(o.heightCm) || 0,
          printLimit: o.printLimit ?? null,
          soldCount: o.soldCount ?? 0,
        })),
      );
      const tagIds = (data.tags || []).map((t) => t.id);
      setSelectedTagIds(tagIds);
      const mediaTypeIds = (data.mediaTypes || []).map((mt) => mt.id);
      setSelectedMediaTypeIds(mediaTypeIds);
      const paintTypeIds = (data.paintTypes || []).map((pt) => pt.id);
      setSelectedPaintTypeIds(paintTypeIds);
      // Snapshot initial state for dirty checking
      initialState.current = JSON.stringify({
        editData: {
          title: data.title,
          description: data.description ?? '',
          category: data.category ?? '',
          price: data.price,
          artistId: data.artist.id,
          projectId: data.projectId,
          allowDownloadOriginal: data.allowDownloadOriginal ?? false,
          printEnabled: data.printEnabled ?? false,
          printLimit: data.printLimit,
          perOptionLimits: data.perOptionLimits ?? false,
          adminNote: data.adminNote ?? '',
          shotDate: data.shotDate ?? '',
          place: data.place ?? '',
        },
        tagIds,
        mediaTypeIds,
        paintTypeIds,
      });
    });
    api.artists.list().then(setArtists);
    api.categories.list().then(setCategories);
    api.projects.list().then(setProjects);
    api.services.fulfillmentSkus().then(setAvailableSkus);
    api.tags.list().then(setAllTags);
    api.mediaTypes.list().then(setAllMediaTypes);
    api.paintTypes.list().then(setAllPaintTypes);
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
    const missingSku = printOptions.some((o) => !o.sku);
    if (missingSku) {
      setShowErrors(true);
      notify.error('All print options must have a SKU selected');
      return;
    }
    setShowErrors(false);
    setSaving(true);
    try {
      await api.images.update(
        imageId,
        {
          ...editData,
          shotDate: editData.shotDate || null,
          sizeWidthCm: editData.sizeWidthCm || null,
          sizeHeightCm: editData.sizeHeightCm || null,
          printOptions,
          tagIds: selectedTagIds,
          mediaTypeIds: selectedMediaTypeIds,
          paintTypeIds: selectedPaintTypeIds,
        } as Record<string, unknown>,
        token,
      );
      notify.success('Image updated');
      // Refresh image data and tags list
      const [img, tags, mediaTypes, paintTypes] = await Promise.all([
        api.images.getAdmin(imageId, token) as Promise<unknown>,
        api.tags.list(),
        api.mediaTypes.list(),
        api.paintTypes.list(),
      ]);
      const refreshed = img as ImageData;
      setImage(refreshed);
      const newTagIds = (refreshed.tags || []).map((t) => t.id);
      setSelectedTagIds(newTagIds);
      setAllTags(tags);
      const newMediaTypeIds = (refreshed.mediaTypes || []).map((mt) => mt.id);
      setSelectedMediaTypeIds(newMediaTypeIds);
      setAllMediaTypes(mediaTypes);
      const newPaintTypeIds = (refreshed.paintTypes || []).map((pt) => pt.id);
      setSelectedPaintTypeIds(newPaintTypeIds);
      setAllPaintTypes(paintTypes);
      // Reset dirty tracking
      initialState.current = JSON.stringify({
        editData,
        tagIds: newTagIds,
        mediaTypeIds: newMediaTypeIds,
        paintTypeIds: newPaintTypeIds,
      });
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

  async function handleAiKeywords() {
    if (!token || !image) return;
    setAiKeywordsLoading(true);
    try {
      await api.ai.describe(imageId, token);
      const refreshed = await api.images.getAdmin(imageId, token);
      setImage(refreshed as unknown as ImageData);
      notify.success('AI keywords generated');
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to generate keywords');
    } finally {
      setAiKeywordsLoading(false);
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

  async function handleReupload(selectedFile: File) {
    if (!token || !image) return;
    if (!confirm('Replace image file with this new version?')) return;
    setReuploading(true);
    try {
      let fileToUpload = selectedFile;
      if (
        /\.hei[cf]$/i.test(selectedFile.name) ||
        selectedFile.type === 'image/heic' ||
        selectedFile.type === 'image/heif'
      ) {
        const heic2any = (await import('heic2any')).default;
        const blob = await heic2any({ blob: selectedFile, toType: 'image/jpeg', quality: 0.95 });
        const converted = Array.isArray(blob) ? blob[0] : blob;
        fileToUpload = new File([converted], selectedFile.name.replace(/\.hei[cf]$/i, '.jpg'), {
          type: 'image/jpeg',
        });
      }
      const formData = new FormData();
      formData.append('file', fileToUpload);
      const updated = (await api.images.reupload(imageId, formData, token)) as unknown as ImageData;
      setImage((prev) =>
        prev
          ? { ...prev, width: updated.width, height: updated.height, updatedAt: updated.updatedAt }
          : prev,
      );
      notify.success('Image replaced');
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to re-upload image');
    } finally {
      setReuploading(false);
      if (reuploadInputRef.current) reuploadInputRef.current.value = '';
    }
  }

  function addPrintOption() {
    setPrintOptions((opts) => [
      ...opts,
      {
        sku: '',
        description: '',
        price: 0,
        widthCm: 0,
        heightCm: 0,
        printLimit: null,
        soldCount: 0,
      },
    ]);
  }

  function updatePrintOption(index: number, field: string, value: string | number | null) {
    setPrintOptions((opts) =>
      opts.map((o, i) => {
        if (i !== index) return o;
        if (field === 'sku') {
          const catalog = availableSkus.find((s) => s.sku === value);
          return {
            ...o,
            sku: String(value),
            description: catalog?.description || o.description,
            ...(catalog?.widthCm != null ? { widthCm: catalog.widthCm } : {}),
            ...(catalog?.heightCm != null ? { heightCm: catalog.heightCm } : {}),
          };
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

  const filteredProjects = projects.filter((p) => p.artistId === editData.artistId);

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
              src={`${UPLOAD_URL}/${image.thumbnailPath}?v=${new Date(image.updatedAt).getTime()}`}
              alt={image.title}
              width={360}
              height={360}
              className="w-full h-auto rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity"
            />
          </button>
          <p className="text-xs text-gallery-gray mt-2">
            {image.artist?.name} &middot; {image.width}&times;{image.height} &middot; ID: {image.id}
          </p>
          <input
            ref={reuploadInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/tiff,image/heic,image/heif,.heic,.heif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleReupload(file);
            }}
          />
          <button
            onClick={() => reuploadInputRef.current?.click()}
            disabled={reuploading}
            className="mt-2 w-full px-3 py-1.5 border border-white/10 rounded text-xs text-gallery-gray hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
          >
            {reuploading ? 'Uploading...' : 'Re-upload Image'}
          </button>
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
          {image.aiDescription ? (
            <details className="group">
              <summary className="flex items-center gap-1 text-xs text-gallery-gray cursor-pointer select-none list-none">
                <ChevronRightIcon className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                AI Keywords (auto-generated, used by chat search)
              </summary>
              <p className="mt-1 px-3 py-1.5 bg-white/5 border border-white/5 rounded text-sm text-white/60 whitespace-pre-wrap">
                {image.aiDescription}
              </p>
            </details>
          ) : (
            <button
              onClick={handleAiKeywords}
              disabled={aiKeywordsLoading}
              className="px-3 py-1 border border-gallery-accent text-gallery-accent rounded text-xs hover:bg-gallery-accent hover:text-gallery-black disabled:opacity-50 transition-colors"
            >
              {aiKeywordsLoading ? 'Generating...' : 'Generate AI Keywords'}
            </button>
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

          {/* Place */}
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Place</label>
            <input
              value={editData.place}
              onChange={(e) => setEditData({ ...editData, place: e.target.value })}
              placeholder="Where the work was created"
              className={inputClass}
            />
          </div>

          {/* 2-column grid for metadata fields */}
          <div className="grid grid-cols-2 gap-4">
            {/* Artist */}
            <div>
              <label className="block text-xs text-gallery-gray mb-1">Artist</label>
              <select
                value={editData.artistId}
                onChange={(e) =>
                  setEditData({ ...editData, artistId: Number(e.target.value), projectId: null })
                }
                className={inputClass}
              >
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
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

            {/* Shot Date */}
            <div>
              <label className="block text-xs text-gallery-gray mb-1">
                Date (YYYY, YYYY-MM, or YYYY-MM-DD)
              </label>
              <div className="relative">
                <input
                  value={editData.shotDate}
                  onChange={(e) => setEditData({ ...editData, shotDate: e.target.value })}
                  placeholder="e.g. 2024 or 2024-03 or 2024-03-15"
                  className={inputClass}
                />
                <input
                  type="date"
                  onChange={(e) => {
                    if (e.target.value) {
                      setEditData({ ...editData, shotDate: e.target.value });
                    }
                  }}
                  className="absolute right-0 top-0 h-full w-10 cursor-pointer opacity-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  title="Pick a date"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gallery-gray">
                  <CalendarIcon size={16} />
                </span>
              </div>
            </div>

            {/* Original File Name (read-only) */}
            <div>
              <label className="block text-xs text-gallery-gray mb-1">Original File Name</label>
              <input
                value={image.originalFileName ?? ''}
                readOnly
                className={`${inputClass} opacity-60 cursor-default`}
              />
            </div>

            {/* Physical Size (inches input, stored as cm) */}
            <div>
              <label className="block text-xs text-gallery-gray mb-1">Physical Size (inches)</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  value={editData.sizeWidthCm ? cmToInch(editData.sizeWidthCm) : ''}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      sizeWidthCm: e.target.value ? inchToCm(+e.target.value) : null,
                    })
                  }
                  type="number"
                  step="0.01"
                  placeholder="Width"
                  className={inputClass}
                />
                <input
                  value={editData.sizeHeightCm ? cmToInch(editData.sizeHeightCm) : ''}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      sizeHeightCm: e.target.value ? inchToCm(+e.target.value) : null,
                    })
                  }
                  type="number"
                  step="0.01"
                  placeholder="Height"
                  className={inputClass}
                />
              </div>
            </div>
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

          {/* Media Types */}
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Media Types</label>
            <CreatableSelect
              isMulti
              options={allMediaTypes.map((mt) => ({ value: mt.id, label: mt.name }))}
              value={selectedMediaTypeIds.map((id) => {
                const mt = allMediaTypes.find((m) => m.id === id);
                return { value: id, label: mt?.name ?? String(id) };
              })}
              onChange={(opts) => setSelectedMediaTypeIds(opts.map((o) => o.value))}
              onCreateOption={async (name) => {
                if (!token) return;
                const slug = name
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]+/g, '_')
                  .replace(/^_|_$/g, '');
                try {
                  const created = await api.mediaTypes.create({ name, slug }, token);
                  setAllMediaTypes((prev) => [...prev, created]);
                  setSelectedMediaTypeIds((prev) => [...prev, created.id]);
                } catch {
                  /* may already exist */
                }
              }}
              placeholder="Select or create media types..."
              styles={darkSelectStyles<{ value: number; label: string }>()}
            />
          </div>

          {/* Paint Types */}
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Paint Types</label>
            <CreatableSelect
              isMulti
              options={allPaintTypes.map((pt) => ({ value: pt.id, label: pt.name }))}
              value={selectedPaintTypeIds.map((id) => {
                const pt = allPaintTypes.find((p) => p.id === id);
                return { value: id, label: pt?.name ?? String(id) };
              })}
              onChange={(opts) => setSelectedPaintTypeIds(opts.map((o) => o.value))}
              onCreateOption={async (name) => {
                if (!token) return;
                const slug = name
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]+/g, '_')
                  .replace(/^_|_$/g, '');
                try {
                  const created = await api.paintTypes.create({ name, slug }, token);
                  setAllPaintTypes((prev) => [...prev, created]);
                  setSelectedPaintTypeIds((prev) => [...prev, created.id]);
                } catch {
                  /* may already exist */
                }
              }}
              placeholder="Select or create paint types..."
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
                checked={editData.originalAvailable}
                onChange={(e) => setEditData({ ...editData, originalAvailable: e.target.checked })}
                className="accent-gallery-accent"
              />
              Available as Physical Original
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

          {/* Physical original settings */}
          {editData.originalAvailable && (
            <div className="border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gallery-gray whitespace-nowrap">
                  Weight (grams)
                </label>
                <input
                  value={editData.weightGrams ?? ''}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      weightGrams: e.target.value ? +e.target.value : null,
                    })
                  }
                  type="number"
                  placeholder="Leave empty to auto-estimate"
                  className={`${inputClass} flex-1`}
                />
              </div>
              <p className="text-xs text-gallery-gray">
                Uses the artwork price (${editData.price}). Shipping calculated at checkout.
              </p>
            </div>
          )}

          {/* Print settings */}
          {editData.printEnabled && (
            <div className="border border-white/10 rounded-lg p-4 space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editData.perOptionLimits}
                  onChange={(e) => setEditData({ ...editData, perOptionLimits: e.target.checked })}
                  className="accent-gallery-accent"
                />
                Track limits per print option
              </label>

              {!editData.perOptionLimits && (
                <>
                  <div className="flex items-center gap-2">
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
                  {editData.printLimit !== null && (
                    <p className="text-xs text-gallery-gray">
                      Prints sold: {image.printsSold} / {editData.printLimit}
                    </p>
                  )}
                </>
              )}

              <div className="space-y-2">
                <label className="text-xs text-gallery-gray">Print Options</label>
                {printOptions.map((opt, idx) => {
                  const catalogSku = availableSkus.find((s) => s.sku === opt.sku);
                  const dimsLocked = catalogSku?.widthCm != null && catalogSku?.heightCm != null;
                  return (
                    <div key={idx} className="border border-white/5 rounded p-2 space-y-1.5">
                      {/* Row 1: SKU dropdown (2/3), price (1/3), remove */}
                      <div className="flex gap-1.5 items-center">
                        <select
                          value={opt.sku}
                          onChange={(e) => updatePrintOption(idx, 'sku', e.target.value)}
                          required
                          className={`${inputClass} flex-[2] ${showErrors && !opt.sku ? '!border-red-500' : ''}`}
                        >
                          <option value="">Select SKU *</option>
                          {availableSkus.map((s) => (
                            <option key={`${s.provider}-${s.sku}`} value={s.sku}>
                              {s.description} ({s.sku})
                            </option>
                          ))}
                        </select>
                        <input
                          value={opt.price || ''}
                          onChange={(e) => updatePrintOption(idx, 'price', +e.target.value)}
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          className={`${inputClass} flex-1`}
                        />
                        <button
                          onClick={() => removePrintOption(idx)}
                          className="text-red-400 text-xs hover:text-red-300 px-1"
                        >
                          &times;
                        </button>
                      </div>
                      {/* Row 2: Dimensions cm + inches (2-column grid) */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          value={opt.widthCm || ''}
                          onChange={(e) => updatePrintOption(idx, 'widthCm', +e.target.value)}
                          type="number"
                          step="0.1"
                          placeholder="W cm"
                          readOnly={dimsLocked}
                          className={`${inputClass} ${dimsLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <input
                          value={opt.heightCm || ''}
                          onChange={(e) => updatePrintOption(idx, 'heightCm', +e.target.value)}
                          type="number"
                          step="0.1"
                          placeholder="H cm"
                          readOnly={dimsLocked}
                          className={`${inputClass} ${dimsLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <input
                          value={opt.widthCm ? cmToInch(opt.widthCm) : ''}
                          onChange={(e) =>
                            updatePrintOption(idx, 'widthCm', inchToCm(+e.target.value))
                          }
                          type="number"
                          step="0.01"
                          placeholder="W in"
                          readOnly={dimsLocked}
                          className={`${inputClass} ${dimsLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <input
                          value={opt.heightCm ? cmToInch(opt.heightCm) : ''}
                          onChange={(e) =>
                            updatePrintOption(idx, 'heightCm', inchToCm(+e.target.value))
                          }
                          type="number"
                          step="0.01"
                          placeholder="H in"
                          readOnly={dimsLocked}
                          className={`${inputClass} ${dimsLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      </div>
                      {/* Per-option limit */}
                      {editData.perOptionLimits && (
                        <div className="flex gap-1.5 items-center">
                          <input
                            value={opt.printLimit ?? ''}
                            onChange={(e) =>
                              updatePrintOption(
                                idx,
                                'printLimit',
                                e.target.value ? +e.target.value : null,
                              )
                            }
                            type="number"
                            placeholder="Limit"
                            className={`${inputClass} w-20`}
                          />
                          {opt.printLimit !== null && (
                            <span className="text-xs text-gallery-gray whitespace-nowrap">
                              {opt.soldCount} sold
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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
