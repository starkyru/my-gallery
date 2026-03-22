'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useNotification } from '@/hooks/useNotification';
import { inputClass, btnClass } from './styles';

interface AddUserFormProps {
  token: string;
  onDone: () => void;
}

export default function AddUserForm({ token, onDone }: AddUserFormProps) {
  const notify = useNotification();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.createUser(token, username, email, password);
      notify.success('User created');
      onDone();
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        required
        className={inputClass}
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        className={inputClass}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password (min 8 characters)"
        required
        minLength={8}
        className={inputClass}
      />
      <button type="submit" disabled={loading} className={btnClass}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
