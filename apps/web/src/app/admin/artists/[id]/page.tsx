'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useNotification } from '@/hooks/useNotification';
import type { Artist } from '@gallery/shared';
import { UPLOAD_URL } from '@/config';

export default function AdminArtistEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const artistId = Number(id);
  const router = useRouter();
  const { token } = useAuthStore();
  const notify = useNotification();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [form, setForm] = useState({ name: '', bio: '', instagramUrl: '' });
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.artists.get(artistId).then((a) => {
      setArtist(a);
      setForm({ name: a.name, bio: a.bio || '', instagramUrl: a.instagramUrl || '' });
    });
  }, [token, artistId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await api.artists.update(artistId, form, token);
      notify.success('Artist updated');
      router.push('/admin/artists');
    } catch {
      notify.error('Failed to update artist');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(isActive: boolean) {
    if (!token) return;
    try {
      await api.artists.update(artistId, { isActive }, token);
      const a = await api.artists.get(artistId);
      setArtist(a);
      notify.success('Artist updated');
    } catch {
      notify.error('Failed to update artist');
    }
  }

  async function handleToggleLogin(enabled: boolean) {
    if (!token) return;
    try {
      await api.auth.toggleArtistLogin(token, artistId, enabled);
      const a = await api.artists.get(artistId);
      setArtist(a);
      notify.success('Login setting updated');
    } catch {
      notify.error('Failed to update login setting');
    }
  }

  async function handleSetPassword() {
    if (!token || !password) return;
    try {
      await api.auth.setArtistPassword(token, artistId, password);
      setPassword('');
      notify.success('Password set');
    } catch {
      notify.error('Failed to set password');
    }
  }

  async function handlePortraitUpload(file: File) {
    if (!token) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.artists.uploadPortrait(artistId, formData, token);
      const a = await api.artists.get(artistId);
      setArtist(a);
      notify.success('Portrait uploaded');
    } catch {
      notify.error('Failed to upload portrait');
    }
  }

  async function handleDelete() {
    if (!token || !confirm('Delete this artist permanently?')) return;
    try {
      await api.artists.delete(artistId, token);
      notify.success('Artist deleted');
      router.push('/admin/artists');
    } catch {
      notify.error('Failed to delete artist');
    }
  }

  if (!artist) {
    return <div className="py-12 text-center text-gallery-gray">Loading...</div>;
  }

  const inputClass =
    'w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:border-gallery-accent';

  return (
    <div className="pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/artists" className="text-gallery-gray hover:text-white text-sm">
          &larr; Back
        </Link>
        <h1 className="font-serif text-3xl">Edit Artist</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8">
        {/* Left: Portrait */}
        <div>
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-white/5">
            {artist.portraitPath ? (
              <img
                src={`${UPLOAD_URL}/${artist.portraitPath.replace('portraits/originals/', 'portraits/thumbnails/')}`}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gallery-gray text-4xl">
                {artist.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>
          <label className="block mt-2 text-center px-3 py-1.5 border border-white/10 rounded text-xs text-gallery-gray hover:border-white/30 cursor-pointer transition-colors">
            {artist.portraitPath ? 'Replace portrait' : 'Upload portrait'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePortraitUpload(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        {/* Right: Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={4}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gallery-gray mb-1">Instagram URL</label>
            <input
              value={form.instagramUrl}
              onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))}
              placeholder="https://instagram.com/username"
              className={inputClass}
            />
          </div>

          {/* Toggles */}
          <div className="border-t border-white/10 pt-4 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={artist.isActive !== false}
                onChange={(e) => handleToggleActive(e.target.checked)}
                className="accent-gallery-accent"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={artist.loginEnabled || false}
                onChange={(e) => handleToggleLogin(e.target.checked)}
                className="accent-gallery-accent"
              />
              Login enabled
            </label>

            {artist.loginEnabled && (
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className={`${inputClass} max-w-xs`}
                />
                <button
                  type="button"
                  onClick={handleSetPassword}
                  className="px-3 py-1.5 bg-gallery-accent text-gallery-black rounded text-xs font-medium"
                >
                  Set Password
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-gallery-accent text-gallery-black rounded-lg text-sm font-medium hover:bg-gallery-accent-light transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
