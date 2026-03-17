'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { inputClass, btnClass } from './styles';

interface ChangePasswordFormProps {
  token: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function ChangePasswordForm({ token, onSuccess, onError }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      onError('Passwords do not match');
      return;
    }
    setPwLoading(true);
    onError('');
    onSuccess('');
    try {
      await api.auth.changePassword(token, currentPassword, newPw);
      setCurrentPassword('');
      setNewPw('');
      setConfirmPw('');
      onSuccess('Password changed successfully');
    } catch (e: any) {
      onError(e.message);
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <section>
      <h2 className="text-xl font-medium mb-4">Change Your Password</h2>
      <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
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
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          placeholder="New password"
          required
          className={inputClass}
        />
        <input
          type="password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          placeholder="Confirm new password"
          required
          className={inputClass}
        />
        <button type="submit" disabled={pwLoading} className={btnClass}>
          {pwLoading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </section>
  );
}
