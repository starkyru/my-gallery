'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Modal } from '@/components/modal';
import { AdminUser } from './styles';
import UsersTable from './UsersTable';
import AddUserForm from './AddUserForm';
import ChangePasswordForm from './ChangePasswordForm';

export default function UsersPage() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.auth.listUsers(token);
      setUsers(data);
    } catch {
      /* handled by table */
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">User Management</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowChangePassword(true)}
            className="px-4 py-2 border border-white/10 rounded-lg text-sm hover:border-white/30 transition-colors"
          >
            Change Password
          </button>
          <button
            onClick={() => setShowAddUser(true)}
            className="px-4 py-2 bg-gallery-accent text-gallery-black rounded-lg text-sm font-medium hover:bg-gallery-accent-light transition-colors"
          >
            Add User
          </button>
        </div>
      </div>

      <UsersTable users={users} token={token!} onRefresh={loadUsers} />

      <Modal open={showAddUser} onClose={() => setShowAddUser(false)} title="Add User">
        <AddUserForm
          token={token!}
          onDone={() => {
            setShowAddUser(false);
            loadUsers();
          }}
        />
      </Modal>

      <Modal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        title="Change Password"
      >
        <ChangePasswordForm token={token!} onDone={() => setShowChangePassword(false)} />
      </Modal>
    </div>
  );
}
