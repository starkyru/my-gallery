'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { inputClass, btnClass } from './styles';

interface AddUserFormProps {
  token: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onRefresh: () => void;
}

export default function AddUserForm({ token, onSuccess, onError, onRefresh }: AddUserFormProps) {
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    onError('');
    onSuccess('');
    try {
      await api.auth.createUser(token, newUsername, newEmail, newPassword);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      onSuccess('User created successfully');
      onRefresh();
    } catch (e: any) {
      onError(e.message);
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <section>
      <h2 className="text-xl font-medium mb-4">Add User</h2>
      <form onSubmit={handleAddUser} className="space-y-3 max-w-md">
        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          placeholder="Username"
          required
          className={inputClass}
        />
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Email"
          required
          className={inputClass}
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Password"
          required
          className={inputClass}
        />
        <button type="submit" disabled={addLoading} className={btnClass}>
          {addLoading ? 'Adding...' : 'Add User'}
        </button>
      </form>
    </section>
  );
}
