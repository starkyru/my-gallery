'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { AdminUser, inputClass } from './styles';

interface UsersTableProps {
  users: AdminUser[];
  token: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onRefresh: () => void;
}

export default function UsersTable({
  users,
  token,
  onSuccess,
  onError,
  onRefresh,
}: UsersTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  function startEdit(user: AdminUser) {
    setEditingId(user.id);
    setEditUsername(user.username);
    setEditEmail(user.email || '');
    setEditPassword('');
    setDeleteConfirm(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditPassword('');
  }

  async function handleSaveEdit() {
    setEditLoading(true);
    onError('');
    onSuccess('');
    try {
      const data: { username?: string; email?: string; password?: string } = {};
      const original = users.find((u) => u.id === editingId);
      if (editUsername !== original?.username) data.username = editUsername;
      if (editEmail !== (original?.email || '')) data.email = editEmail;
      if (editPassword) data.password = editPassword;

      if (Object.keys(data).length === 0) {
        cancelEdit();
        return;
      }

      await api.auth.updateUser(token, editingId!, data);
      onSuccess('User updated successfully');
      cancelEdit();
      onRefresh();
    } catch (e: any) {
      onError(e.message);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeleteUser(id: number) {
    onError('');
    onSuccess('');
    try {
      await api.auth.deleteUser(token, id);
      setDeleteConfirm(null);
      onSuccess('User deleted');
      onRefresh();
    } catch (e: any) {
      onError(e.message);
      setDeleteConfirm(null);
    }
  }

  return (
    <section>
      <h2 className="text-xl font-medium mb-4">Admin Users</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gallery-gray">
              <th className="pb-2 pr-4">Username</th>
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2 pr-4">Created</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) =>
              editingId === u.id ? (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="py-3 pr-4">
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className={inputClass}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className={inputClass}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="New password (optional)"
                      className={inputClass}
                    />
                  </td>
                  <td className="py-3 text-right space-x-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={editLoading}
                      className="text-green-400 hover:text-green-300"
                    >
                      {editLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={cancelEdit} className="text-gallery-gray hover:text-white">
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="py-3 pr-4">{u.username}</td>
                  <td className="py-3 pr-4 text-gallery-gray">{u.email || '—'}</td>
                  <td className="py-3 pr-4 text-gallery-gray">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right space-x-2">
                    {deleteConfirm === u.id ? (
                      <span className="space-x-2">
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-gallery-gray hover:text-white"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(u)}
                          className="text-gallery-gray hover:text-gallery-accent transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(u.id)}
                          className="text-gallery-gray hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
