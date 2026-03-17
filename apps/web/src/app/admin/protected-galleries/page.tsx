'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { ProtectedGallery } from '@gallery/shared';

export default function AdminProtectedGalleriesPage() {
  const { token } = useAuthStore();
  const [galleries, setGalleries] = useState<ProtectedGallery[]>([]);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteWithImages, setDeleteWithImages] = useState(false);

  useEffect(() => {
    loadData();
  }, [token]);

  function loadData() {
    if (!token) return;
    api.protectedGalleries
      .listAdmin(token)
      .then(setGalleries)
      .catch(() => {});
  }

  function deriveSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newName.trim() || !newPassword) return;
    await api.protectedGalleries.create(
      { name: newName.trim(), slug: deriveSlug(newName), password: newPassword },
      token,
    );
    setNewName('');
    setNewPassword('');
    loadData();
  }

  async function handleSaveEdit(id: number) {
    if (!token || !editName.trim()) return;
    const data: { name: string; slug: string; password?: string } = {
      name: editName.trim(),
      slug: deriveSlug(editName),
    };
    if (editPassword) data.password = editPassword;
    await api.protectedGalleries.update(id, data, token);
    setEditingId(null);
    setEditPassword('');
    loadData();
  }

  async function handleDelete(id: number) {
    if (!token) return;
    await api.protectedGalleries.delete(id, deleteWithImages, token);
    setDeleteConfirmId(null);
    setDeleteWithImages(false);
    loadData();
  }

  async function handleToggleActive(g: ProtectedGallery) {
    if (!token) return;
    await api.protectedGalleries.update(g.id, { isActive: !g.isActive }, token);
    loadData();
  }

  const inputClass =
    'px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent';

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Protected Galleries</h1>

      {/* Create form */}
      <form onSubmit={handleCreate} className="mb-8 flex gap-3 items-end flex-wrap">
        <div className="flex-1">
          <label className="block text-xs text-gallery-gray mb-1">Gallery Name</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Gallery name"
            className={`${inputClass} w-full`}
          />
        </div>
        <div>
          <label className="block text-xs text-gallery-gray mb-1">Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Set password"
            className={inputClass}
          />
        </div>
        {newName.trim() && (
          <span className="text-xs text-gallery-gray pb-2">slug: {deriveSlug(newName)}</span>
        )}
        <button
          type="submit"
          disabled={!newName.trim() || !newPassword}
          className="px-4 py-1.5 bg-gallery-accent text-gallery-black rounded text-sm font-medium hover:bg-gallery-accent-light transition-colors disabled:opacity-30"
        >
          Create
        </button>
      </form>

      {/* Table */}
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gallery-gray">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium text-center">Active</th>
              <th className="px-4 py-3 font-medium text-center">Images</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {galleries.map((g) => (
              <tr key={g.id} className="border-b border-white/5">
                <td className="px-4 py-3">
                  {editingId === g.id ? (
                    <div className="flex flex-col gap-1">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(g.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className={inputClass}
                        autoFocus
                      />
                      <input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="New password (leave blank to keep)"
                        className={`${inputClass} text-xs`}
                      />
                    </div>
                  ) : (
                    g.name
                  )}
                </td>
                <td className="px-4 py-3 text-gallery-gray font-mono text-xs">{g.slug}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggleActive(g)}
                    className={`px-2 py-0.5 rounded text-xs ${
                      g.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {g.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">{g.imageCount ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    {editingId === g.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(g.id)}
                          className="px-2 py-1 bg-gallery-accent text-gallery-black rounded text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditPassword('');
                          }}
                          className="px-2 py-1 border border-white/10 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </>
                    ) : deleteConfirmId === g.id ? (
                      <div className="flex flex-col gap-1 items-end">
                        <label className="flex items-center gap-1 text-xs text-red-400">
                          <input
                            type="checkbox"
                            checked={deleteWithImages}
                            onChange={(e) => setDeleteWithImages(e.target.checked)}
                          />
                          Also delete images permanently
                        </label>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(g.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                          >
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmId(null);
                              setDeleteWithImages(false);
                            }}
                            className="px-2 py-1 border border-white/10 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Link
                          href={`/admin/protected-galleries/${g.id}`}
                          className="px-2 py-1 border border-white/10 rounded text-xs hover:border-white/30"
                        >
                          Manage Images
                        </Link>
                        <button
                          onClick={() => {
                            setEditingId(g.id);
                            setEditName(g.name);
                            setEditPassword('');
                          }}
                          className="px-2 py-1 border border-white/10 rounded text-xs hover:border-white/30"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(g.id)}
                          className="px-2 py-1 border border-red-500/30 text-red-400 rounded text-xs hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {galleries.length === 0 && (
          <p className="text-center text-gallery-gray py-8">No protected galleries yet.</p>
        )}
      </div>
    </div>
  );
}
