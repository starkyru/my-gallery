'use client';

import { useEffect, useState, useRef } from 'react';
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

export default function AdminImagesPage() {
  const { token } = useAuthStore();
  const [images, setImages] = useState<any[]>([]);
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [editPrintOptions, setEditPrintOptions] = useState<PrintOptionRow[]>([]);
  const [aiLoading, setAiLoading] = useState<number | null>(null);
  const [availableSkus, setAvailableSkus] = useState<{ sku: string; description: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploadForm, setUploadForm] = useState({
    title: '',
    price: '',
    photographerId: '',
    category: ImageCategory.Other,
  });

  useEffect(() => {
    loadData();
  }, [token]);

  function loadData() {
    if (!token) return;
    api.images
      .list()
      .then(setImages)
      .catch(() => {});
    api.photographers
      .list()
      .then(setPhotographers)
      .catch(() => {});
    api.prodigi
      .skus(token)
      .then(setAvailableSkus)
      .catch(() => {});
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !fileRef.current?.files?.[0]) return;

    const formData = new FormData();
    formData.append('file', fileRef.current.files[0]);
    formData.append('title', uploadForm.title);
    formData.append('price', uploadForm.price);
    formData.append('photographerId', uploadForm.photographerId);
    formData.append('category', uploadForm.category);

    await api.images.upload(formData, token);
    setShowUpload(false);
    setUploadForm({ title: '', price: '', photographerId: '', category: ImageCategory.Other });
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

  const inputClass =
    'w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white';

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl">Images</h1>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 bg-gallery-accent text-gallery-black rounded-lg text-sm font-medium hover:bg-gallery-accent-light transition-colors"
        >
          {showUpload ? 'Cancel' : 'Upload Image'}
        </button>
      </div>

      {showUpload && (
        <form
          onSubmit={handleUpload}
          className="mb-8 p-6 border border-white/10 rounded-lg space-y-4"
        >
          <input ref={fileRef} type="file" accept="image/*" required className="text-sm" />
          <div className="grid grid-cols-2 gap-4">
            <input
              value={uploadForm.title}
              onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Title"
              required
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent"
            />
            <input
              value={uploadForm.price}
              onChange={(e) => setUploadForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="Price"
              type="number"
              step="0.01"
              required
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent"
            />
            <select
              value={uploadForm.photographerId}
              onChange={(e) => setUploadForm((f) => ({ ...f, photographerId: e.target.value }))}
              required
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gallery-accent"
            >
              <option value="">Select photographer</option>
              {photographers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={uploadForm.category}
              onChange={(e) =>
                setUploadForm((f) => ({ ...f, category: e.target.value as ImageCategory }))
              }
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-gallery-accent"
            >
              {Object.values(ImageCategory).map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-gallery-accent text-gallery-black rounded-lg text-sm font-medium hover:bg-gallery-accent-light transition-colors"
          >
            Upload
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
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
                                  <option key={s.sku} value={s.sku}>
                                    {s.description}
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
                    ${image.price} &middot; {image.photographer?.name}
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

      {images.length === 0 && (
        <p className="text-center text-gallery-gray py-12">No images uploaded yet.</p>
      )}
    </div>
  );
}
