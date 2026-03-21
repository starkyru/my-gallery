'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { AdminUser } from './styles';
import UsersTable from './UsersTable';
import AddUserForm from './AddUserForm';
import ChangePasswordForm from './ChangePasswordForm';

export default function UsersPage() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      const data = await api.auth.listUsers(token!);
      setUsers(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    }
  }, [token]);

  useEffect(() => {
    if (token) loadUsers();
  }, [token, loadUsers]);

  return (
    <div className="space-y-10">
      <h1 className="font-serif text-3xl">User Management</h1>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}

      <UsersTable
        users={users}
        token={token!}
        onSuccess={setSuccess}
        onError={setError}
        onRefresh={loadUsers}
      />
      <AddUserForm token={token!} onSuccess={setSuccess} onError={setError} onRefresh={loadUsers} />
      <ChangePasswordForm token={token!} onSuccess={setSuccess} onError={setError} />
    </div>
  );
}
