'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useNotification } from '@/hooks/useNotification';
import { UPLOAD_URL } from '@/lib/consts';

export default function AdminArtistsPage() {
  const { token } = useAuthStore();
  const notify = useNotification();
  const [artists, setArtists] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', bio: '', instagramUrl: '' });
  const [passwords, setPasswords] = useState<Record<number, string>>({});

  useEffect(() => {
    loadData();
  }, [token]);

  function loadData() {
    api.artists
      .list()
      .then(setArtists)
      .catch(() => {});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      if (editingId) {
        await api.artists.update(editingId, form, token);
      } else {
        await api.artists.create(form, token);
      }
      notify.success(editingId ? 'Artist updated' : 'Artist created');
      setForm({ name: '', bio: '', instagramUrl: '' });
      setShowForm(false);
      setEditingId(null);
      loadData();
    } catch {
      notify.error(editingId ? 'Failed to update artist' : 'Failed to create artist');
    }
  }

  async function handleDelete(id: number) {
    if (!token || !confirm('Delete this artist?')) return;
    await api.artists.delete(id, token);
    loadData();
  }

  async function handleToggleActive(id: number, isActive: boolean) {
    if (!token) return;
    try {
      await api.artists.update(id, { isActive }, token);
      notify.success('Artist updated');
      loadData();
    } catch {
      notify.error('Failed to update artist');
    }
  }

  async function handleToggleLogin(id: number, enabled: boolean) {
    if (!token) return;
    try {
      await api.auth.toggleArtistLogin(token, id, enabled);
      notify.success('Login setting updated');
      loadData();
    } catch {
      notify.error('Failed to update login setting');
    }
  }

  async function handleSetPassword(id: number) {
    if (!token) return;
    const pw = passwords[id];
    if (!pw) return;
    try {
      await api.auth.setArtistPassword(token, id, pw);
      setPasswords((p) => ({ ...p, [id]: '' }));
      notify.success('Password set');
    } catch {
      notify.error('Failed to set password');
    }
  }

  async function handlePortraitUpload(id: number, file: File) {
    if (!token) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.artists.uploadPortrait(id, formData, token);
      notify.success('Portrait uploaded');
      loadData();
    } catch {
      notify.error('Failed to upload portrait');
    }
  }

  const inputClass =
    'px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent';

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl">Artists</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm({ name: '', bio: '', instagramUrl: '' });
          }}
          className="px-4 py-2 bg-gallery-accent text-gallery-black rounded-lg text-sm font-medium hover:bg-gallery-accent-light transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Artist'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 p-6 border border-white/10 rounded-lg space-y-4"
        >
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Name"
            required
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent"
          />
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Bio"
            rows={3}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent"
          />
          <input
            value={form.instagramUrl}
            onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))}
            placeholder="Instagram URL (e.g. https://instagram.com/username)"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-gallery-accent text-gallery-black rounded-lg text-sm font-medium"
          >
            {editingId ? 'Update' : 'Create'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {artists.map((a) => (
          <div key={a.id} className="p-4 border border-white/10 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Portrait thumbnail */}
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
                  {a.portraitPath ? (
                    <img
                      src={`${UPLOAD_URL}/${a.portraitPath.replace('portraits/originals/', 'portraits/thumbnails/')}`}
                      alt={a.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gallery-gray text-xl">
                      {a.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-serif text-lg">{a.name}</h3>
                  <p className="text-gallery-gray text-sm">{a.bio || 'No bio'}</p>
                  {a.instagramUrl && a.instagramUrl.startsWith('https://') && (
                    <a
                      href={a.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gallery-gray hover:text-gallery-accent transition-colors mt-0.5"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                      Instagram
                    </a>
                  )}
                  <label className="inline-block mt-1 px-2 py-0.5 border border-white/10 rounded text-xs text-gallery-gray hover:border-white/30 cursor-pointer transition-colors">
                    {a.portraitPath ? 'Replace portrait' : 'Upload portrait'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePortraitUpload(a.id, file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(a.id);
                    setForm({ name: a.name, bio: a.bio || '', instagramUrl: a.instagramUrl || '' });
                    setShowForm(true);
                  }}
                  className="px-3 py-1 border border-white/10 rounded text-xs hover:border-white/30"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="px-3 py-1 border border-red-500/30 text-red-400 rounded text-xs hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2 border-t border-white/5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={a.isActive !== false}
                  onChange={(e) => handleToggleActive(a.id, e.target.checked)}
                  className="accent-gallery-accent"
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={a.loginEnabled || false}
                  onChange={(e) => handleToggleLogin(a.id, e.target.checked)}
                  className="accent-gallery-accent"
                />
                Login enabled
              </label>

              {a.loginEnabled && (
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={passwords[a.id] || ''}
                    onChange={(e) => setPasswords((pw) => ({ ...pw, [a.id]: e.target.value }))}
                    placeholder="New password"
                    className={inputClass}
                  />
                  <button
                    onClick={() => handleSetPassword(a.id)}
                    className="px-3 py-1.5 bg-gallery-accent text-gallery-black rounded-lg text-xs font-medium"
                  >
                    Set Password
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {artists.length === 0 && (
          <p className="text-center text-gallery-gray py-12">No artists yet.</p>
        )}
      </div>
    </div>
  );
}
