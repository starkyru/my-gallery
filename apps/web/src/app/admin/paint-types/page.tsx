'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useNotification } from '@/hooks/useNotification';
import type { PaintType } from '@gallery/shared';

export default function AdminPaintTypesPage() {
  const { token } = useAuthStore();
  const notify = useNotification();
  const [items, setItems] = useState<PaintType[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadData();
  }, [token]);

  function loadData() {
    api.paintTypes
      .list()
      .then(setItems)
      .catch(() => {});
  }

  function deriveSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newName.trim()) return;
    try {
      await api.paintTypes.create({ name: newName.trim(), slug: deriveSlug(newName) }, token);
      setNewName('');
      notify.success('Paint type created');
      loadData();
    } catch {
      notify.error('Failed to create paint type');
    }
  }

  async function handleSaveEdit(id: number) {
    if (!token || !editName.trim()) return;
    try {
      await api.paintTypes.update(id, { name: editName.trim(), slug: deriveSlug(editName) }, token);
      setEditingId(null);
      notify.success('Paint type updated');
      loadData();
    } catch {
      notify.error('Failed to update paint type');
    }
  }

  async function handleDelete(id: number) {
    if (!token || !confirm('Delete this paint type?')) return;
    try {
      await api.paintTypes.delete(id, token);
      loadData();
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to delete paint type');
    }
  }

  const inputClass =
    'px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent';

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Paint Types</h1>

      <form onSubmit={handleCreate} className="mb-8 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gallery-gray mb-1">New Paint Type</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Paint type name"
            className={`${inputClass} w-full`}
          />
        </div>
        {newName.trim() && (
          <span className="text-xs text-gallery-gray pb-2">slug: {deriveSlug(newName)}</span>
        )}
        <button
          type="submit"
          className="px-4 py-1.5 bg-gallery-accent text-gallery-black rounded text-sm font-medium hover:bg-gallery-accent-light transition-colors"
        >
          Create
        </button>
      </form>

      <div className="border border-white/10 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-white/10 text-left text-gallery-gray">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium text-center">Images</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-white/5">
                <td className="px-4 py-3">
                  {editingId === item.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(item.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className={inputClass}
                      autoFocus
                    />
                  ) : (
                    item.name
                  )}
                </td>
                <td className="px-4 py-3 text-gallery-gray font-mono text-xs">{item.slug}</td>
                <td className="px-4 py-3 text-center">{item.imageCount ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    {editingId === item.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-2 py-1 bg-gallery-accent text-gallery-black rounded text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 border border-white/10 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditName(item.name);
                          }}
                          className="px-2 py-1 border border-white/10 rounded text-xs hover:border-white/30"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={(item.imageCount ?? 0) > 0}
                          className="px-2 py-1 border border-red-500/30 text-red-400 rounded text-xs hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={
                            (item.imageCount ?? 0) > 0 ? 'Has images — cannot delete' : 'Delete'
                          }
                        >
                          Delete{(item.imageCount ?? 0) > 0 ? ' (has images)' : ''}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="text-center text-gallery-gray py-8">No paint types yet.</p>
        )}
      </div>
    </div>
  );
}
