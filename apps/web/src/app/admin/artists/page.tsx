'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function AdminArtistsPage() {
  const { token } = useAuthStore();
  const [artists, setArtists] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', bio: '' });
  const [passwords, setPasswords] = useState<Record<number, string>>({});
  const [passwordMsg, setPasswordMsg] = useState<Record<number, string>>({});

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
    if (editingId) {
      await api.artists.update(editingId, form, token);
    } else {
      await api.artists.create(form, token);
    }
    setForm({ name: '', bio: '' });
    setShowForm(false);
    setEditingId(null);
    loadData();
  }

  async function handleDelete(id: number) {
    if (!token || !confirm('Delete this artist?')) return;
    await api.artists.delete(id, token);
    loadData();
  }

  async function handleToggleLogin(id: number, enabled: boolean) {
    if (!token) return;
    await api.auth.toggleArtistLogin(token, id, enabled);
    loadData();
  }

  async function handleSetPassword(id: number) {
    if (!token) return;
    const pw = passwords[id];
    if (!pw) return;
    try {
      await api.auth.setArtistPassword(token, id, pw);
      setPasswords((p) => ({ ...p, [id]: '' }));
      setPasswordMsg((m) => ({ ...m, [id]: 'Password set' }));
      setTimeout(() => setPasswordMsg((m) => ({ ...m, [id]: '' })), 3000);
    } catch {
      setPasswordMsg((m) => ({ ...m, [id]: 'Failed to set password' }));
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
            setForm({ name: '', bio: '' });
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
              <div>
                <h3 className="font-serif text-lg">{a.name}</h3>
                <p className="text-gallery-gray text-sm">{a.bio || 'No bio'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(a.id);
                    setForm({ name: a.name, bio: a.bio || '' });
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
                  {passwordMsg[a.id] && (
                    <span className="text-xs text-green-400">{passwordMsg[a.id]}</span>
                  )}
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
