'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useNotification } from '@/hooks/useNotification';
import { inputClass, btnClass } from './styles';

interface ChangePasswordFormProps {
  token: string;
  onDone: () => void;
}

export default function ChangePasswordForm({ token, onDone }: ChangePasswordFormProps) {
  const notify = useNotification();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      notify.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.auth.changePassword(token, currentPassword, newPw);
      notify.success('Password changed');
      onDone();
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
        minLength={8}
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
      <button type="submit" disabled={loading} className={btnClass}>
        {loading ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );
}
