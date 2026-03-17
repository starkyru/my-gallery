'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || 'http://localhost:4000/uploads';

export default function ArtistProfilePage() {
  const { token, role, artistId } = useAuthStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [portraitPath, setPortraitPath] = useState<string | null>(null);
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (role !== 'artist') {
      router.push('/admin');
      return;
    }
    if (artistId && token) {
      api.artists.get(artistId).then((p: any) => {
        setName(p.name);
        setBio(p.bio || '');
        setPortraitPath(p.portraitPath || null);
      });
    }
  }, [role, artistId, token, router]);

  async function handlePortraitUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token || !artistId) return;
    setUploadingPortrait(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.artists.uploadPortrait(artistId, formData, token);
      setPortraitPath(result.portraitPath);
    } catch {
      setMessage('Failed to upload portrait');
    } finally {
      setUploadingPortrait(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSaveBio(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !artistId) return;
    setSaving(true);
    setMessage('');
    try {
      await api.artists.update(artistId, { bio }, token);
      setMessage('Profile updated');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (newPassword !== confirmPassword) {
      setPwMessage('Passwords do not match');
      return;
    }
    setPwSaving(true);
    setPwMessage('');
    try {
      await api.auth.changePassword(token, currentPassword, newPassword);
      setPwMessage('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwMessage(''), 3000);
    } catch {
      setPwMessage('Failed to change password');
    } finally {
      setPwSaving(false);
    }
  }

  if (role !== 'artist') return null;

  const inputClass =
    'w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent';

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="font-serif text-3xl">My Profile</h1>

      <div className="flex items-center gap-6">
        {portraitPath ? (
          <img
            src={`${UPLOAD_URL}/${portraitPath}`}
            alt={name}
            className="w-24 h-24 rounded-full object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
            <span className="text-3xl text-gallery-gray">
              {name ? name.charAt(0).toUpperCase() : '?'}
            </span>
          </div>
        )}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePortraitUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPortrait}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {uploadingPortrait
              ? 'Uploading...'
              : portraitPath
                ? 'Change Portrait'
                : 'Upload Portrait'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveBio} className="space-y-4">
        <div>
          <label className="block text-sm text-gallery-gray mb-1">Name</label>
          <input value={name} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
        </div>
        <div>
          <label className="block text-sm text-gallery-gray mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className={inputClass}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-gallery-accent text-gallery-black rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {message && <span className="text-sm text-green-400">{message}</span>}
        </div>
      </form>

      <div className="border-t border-white/10 pt-8">
        <h2 className="font-serif text-xl mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            required
            className={inputClass}
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            required
            className={inputClass}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            className={inputClass}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pwSaving}
              className="px-6 py-2 bg-gallery-accent text-gallery-black rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {pwSaving ? 'Changing...' : 'Change Password'}
            </button>
            {pwMessage && (
              <span
                className={`text-sm ${pwMessage.includes('Failed') || pwMessage.includes('match') ? 'text-red-400' : 'text-green-400'}`}
              >
                {pwMessage}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
