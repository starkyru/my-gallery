'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { ImageCategory } from '@gallery/shared';

const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || 'http://localhost:4000/uploads';

export default function AdminImagesPage() {
  const { token } = useAuthStore();
  const [images, setImages] = useState<any[]>([]);
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [aiLoading, setAiLoading] = useState<number | null>(null);
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

  async function handleSaveEdit() {
    if (!token || editingId === null) return;
    await api.images.update(editingId, editData, token);
    setEditingId(null);
    loadData();
  }

  async function handleDelete(id: number) {
    if (!token || !confirm('Delete this image?')) return;
    await api.images.delete(id, token);
    loadData();
  }

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
                    className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
                  />
                  <textarea
                    value={editData.description ?? image.description ?? ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
                  />
                  <input
                    value={editData.price ?? image.price}
                    onChange={(e) => setEditData({ ...editData, price: +e.target.value })}
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white"
                  />
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
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        setEditingId(image.id);
                        setEditData({});
                      }}
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
