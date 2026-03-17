'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (token) loadUsers();
  }, [token]);

  async function loadUsers() {
    try {
      const data = await api.auth.listUsers(token!);
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
    }
  }

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
