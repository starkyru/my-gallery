'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function AdminPhotographersPage() {
  const { token } = useAuthStore();
  const [photographers, setPhotographers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', bio: '' });
  const [passwords, setPasswords] = useState<Record<number, string>>({});
  const [passwordMsg, setPasswordMsg] = useState<Record<number, string>>({});

  useEffect(() => {
    loadData();
  }, [token]);

  function loadData() {
    api.photographers
      .list()
      .then(setPhotographers)
      .catch(() => {});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (editingId) {
      await api.photographers.update(editingId, form, token);
    } else {
      await api.photographers.create(form, token);
    }
    setForm({ name: '', bio: '' });
    setShowForm(false);
    setEditingId(null);
    loadData();
  }

  async function handleDelete(id: number) {
    if (!token || !confirm('Delete this photographer?')) return;
    await api.photographers.delete(id, token);
    loadData();
  }

  async function handleToggleLogin(id: number, enabled: boolean) {
    if (!token) return;
    await api.auth.togglePhotographerLogin(token, id, enabled);
    loadData();
  }

  async function handleSetPassword(id: number) {
    if (!token) return;
    const pw = passwords[id];
    if (!pw) return;
    try {
      await api.auth.setPhotographerPassword(token, id, pw);
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
        <h1 className="font-serif text-3xl">Photographers</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm({ name: '', bio: '' });
          }}
          className="px-4 py-2 bg-gallery-accent text-gallery-black rounded-lg text-sm font-medium hover:bg-gallery-accent-light transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Photographer'}
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
        {photographers.map((p) => (
          <div key={p.id} className="p-4 border border-white/10 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg">{p.name}</h3>
                <p className="text-gallery-gray text-sm">{p.bio || 'No bio'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(p.id);
                    setForm({ name: p.name, bio: p.bio || '' });
                    setShowForm(true);
                  }}
                  className="px-3 py-1 border border-white/10 rounded text-xs hover:border-white/30"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
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
                  checked={p.loginEnabled || false}
                  onChange={(e) => handleToggleLogin(p.id, e.target.checked)}
                  className="accent-gallery-accent"
                />
                Login enabled
              </label>

              {p.loginEnabled && (
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={passwords[p.id] || ''}
                    onChange={(e) => setPasswords((pw) => ({ ...pw, [p.id]: e.target.value }))}
                    placeholder="New password"
                    className={inputClass}
                  />
                  <button
                    onClick={() => handleSetPassword(p.id)}
                    className="px-3 py-1.5 bg-gallery-accent text-gallery-black rounded-lg text-xs font-medium"
                  >
                    Set Password
                  </button>
                  {passwordMsg[p.id] && (
                    <span className="text-xs text-green-400">{passwordMsg[p.id]}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {photographers.length === 0 && (
          <p className="text-center text-gallery-gray py-12">No photographers yet.</p>
        )}
      </div>
    </div>
  );
}
