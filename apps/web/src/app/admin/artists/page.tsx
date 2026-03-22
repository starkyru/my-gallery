'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Artist } from '@gallery/shared';
import { useNotification } from '@/hooks/useNotification';
import { UPLOAD_URL } from '@/config';

export default function AdminArtistsPage() {
  const { token } = useAuthStore();
  const notify = useNotification();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', instagramUrl: '' });

  useEffect(() => {
    api.artists
      .list()
      .then(setArtists)
      .catch(() => {});
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      await api.artists.create(form, token);
      notify.success('Artist created');
      setShowForm(false);
      setForm({ name: '', bio: '', instagramUrl: '' });
      const data = await api.artists.list();
      setArtists(data);
    } catch {
      notify.error('Failed to create artist');
    }
  }

  const inputClass =
    'w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent';

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl">Artists</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setForm({ name: '', bio: '', instagramUrl: '' });
          }}
          className="px-4 py-2 bg-gallery-accent text-gallery-black rounded-lg text-sm font-medium hover:bg-gallery-accent-light transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Artist'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 p-6 border border-white/10 rounded-lg space-y-4"
        >
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Name"
            required
            className={inputClass}
          />
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Bio"
            rows={3}
            className={inputClass}
          />
          <input
            value={form.instagramUrl}
            onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))}
            placeholder="Instagram URL (e.g. https://instagram.com/username)"
            className={inputClass}
          />
          <button
            type="submit"
            className="px-6 py-2 bg-gallery-accent text-gallery-black rounded-lg text-sm font-medium"
          >
            Create
          </button>
        </form>
      )}

      <div className="space-y-4">
        {artists.map((a) => (
          <Link
            key={a.id}
            href={`/admin/artists/${a.id}`}
            className="block p-4 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
                {a.portraitPath ? (
                  <img
                    src={`${UPLOAD_URL}/${a.portraitPath.replace('portraits/originals/', 'portraits/thumbnails/')}`}
                    alt={a.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gallery-gray text-lg">
                    {a.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-lg">{a.name}</h3>
                <p className="text-gallery-gray text-sm truncate">{a.bio || 'No bio'}</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {a.isActive === false && (
                  <span className="px-2 py-0.5 bg-gray-600/80 text-white rounded-full">
                    Inactive
                  </span>
                )}
                {a.loginEnabled && (
                  <span className="px-2 py-0.5 bg-gallery-accent/20 text-gallery-accent rounded-full">
                    Login
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
        {artists.length === 0 && (
          <p className="text-center text-gallery-gray py-12">No artists yet.</p>
        )}
      </div>
    </div>
  );
}
