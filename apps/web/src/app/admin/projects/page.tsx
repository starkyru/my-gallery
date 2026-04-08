'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useNotification } from '@/hooks/useNotification';
import { useRequest } from '@/hooks/useRequest';
import type { Project, Artist } from '@gallery/shared';

export default function AdminProjectsPage() {
  const { token } = useAuthStore();
  const notify = useNotification();
  const [projects, setProjects] = useState<Project[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filterArtistId, setFilterArtistId] = useState('');
  const [newName, setNewName] = useState('');
  const [newArtistId, setNewArtistId] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const createRequest = useRequest(
    useCallback(
      (data: { artistId: number; name: string; slug: string }) => api.projects.create(data, token!),
      [token],
    ),
  );

  const updateRequest = useRequest(
    useCallback(
      (id: number, data: { name: string; slug: string }) => api.projects.update(id, data, token!),
      [token],
    ),
  );

  const deleteRequest = useRequest(
    useCallback((id: number) => api.projects.delete(id, token!), [token]),
  );

  const loadData = useCallback(() => {
    const artistId = filterArtistId ? Number(filterArtistId) : undefined;
    api.projects
      .list(artistId)
      .then(setProjects)
      .catch(() => {});
  }, [filterArtistId]);

  useEffect(() => {
    api.artists
      .list()
      .then((a) => {
        setArtists(a);
        setNewArtistId((prev) => prev || (a.length > 0 ? String(a[0].id) : ''));
      })
      .catch(() => {});
    loadData();
  }, [token, loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function deriveSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newName.trim() || !newArtistId) return;
    const result = await createRequest.fetch({
      artistId: Number(newArtistId),
      name: newName.trim(),
      slug: deriveSlug(newName),
    });
    if (result !== null) {
      setNewName('');
      notify.success('Project created');
      loadData();
    }
  }

  async function handleSaveEdit(id: number) {
    if (!token || !editName.trim()) return;
    const result = await updateRequest.fetch(id, {
      name: editName.trim(),
      slug: deriveSlug(editName),
    });
    if (result !== null) {
      setEditingId(null);
      notify.success('Project updated');
      loadData();
    }
  }

  async function handleDelete(id: number) {
    if (!token || !confirm('Delete this project?')) return;
    const result = await deleteRequest.fetch(id);
    if (result !== null) {
      notify.success('Project deleted');
      loadData();
    }
  }

  const inputClass =
    'px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent';
  const selectClass =
    'px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gallery-accent';

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Projects</h1>

      {/* Filter by artist */}
      <div className="mb-6">
        <select
          value={filterArtistId}
          onChange={(e) => setFilterArtistId(e.target.value)}
          className={selectClass}
        >
          <option value="">All Artists</option>
          {artists.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="mb-8 flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-xs text-gallery-gray mb-1">Artist</label>
          <select
            value={newArtistId}
            onChange={(e) => setNewArtistId(e.target.value)}
            className={`${selectClass} w-48`}
          >
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gallery-gray mb-1">Project Name</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            className={`${inputClass} w-full`}
          />
        </div>
        {newName.trim() && (
          <span className="text-xs text-gallery-gray pb-2">slug: {deriveSlug(newName)}</span>
        )}
        <button
          type="submit"
          disabled={createRequest.isLoading}
          className="px-4 py-1.5 bg-gallery-accent text-gallery-black rounded text-sm font-medium hover:bg-gallery-accent-light transition-colors disabled:opacity-30"
        >
          Create
        </button>
      </form>

      {/* Table */}
      <div className="border border-white/10 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-white/10 text-left text-gallery-gray">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Artist</th>
              <th className="px-4 py-3 font-medium text-center">Images</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((proj) => (
              <tr key={proj.id} className="border-b border-white/5">
                <td className="px-4 py-3">
                  {editingId === proj.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(proj.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className={inputClass}
                      autoFocus
                    />
                  ) : (
                    proj.name
                  )}
                </td>
                <td className="px-4 py-3 text-gallery-gray font-mono text-xs">{proj.slug}</td>
                <td className="px-4 py-3 text-gallery-gray">
                  {artists.find((a) => a.id === proj.artistId)?.name ?? proj.artistId}
                </td>
                <td className="px-4 py-3 text-center">{proj.imageCount ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    {editingId === proj.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(proj.id)}
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
                            setEditingId(proj.id);
                            setEditName(proj.name);
                          }}
                          className="px-2 py-1 border border-white/10 rounded text-xs hover:border-white/30"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(proj.id)}
                          disabled={(proj.imageCount ?? 0) > 0}
                          className="px-2 py-1 border border-red-500/30 text-red-400 rounded text-xs hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={
                            (proj.imageCount ?? 0) > 0 ? 'Has images — cannot delete' : 'Delete'
                          }
                        >
                          Delete{(proj.imageCount ?? 0) > 0 ? ' (has images)' : ''}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && (
          <p className="text-center text-gallery-gray py-8">No projects yet.</p>
        )}
      </div>
    </div>
  );
}
