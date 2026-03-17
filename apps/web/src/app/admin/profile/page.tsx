'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function ArtistProfilePage() {
  const { token, role, artistId } = useAuthStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
      });
    }
  }, [role, artistId, token, router]);

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
