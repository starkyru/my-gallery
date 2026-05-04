'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useNotification } from '@/hooks/useNotification';
import { Modal } from '@/components/common/modal';
import { AdminUser, inputClass, btnClass } from './styles';

interface UsersTableProps {
  users: AdminUser[];
  token: string;
  onRefresh: () => void;
}

export default function UsersTable({ users, token, onRefresh }: UsersTableProps) {
  const notify = useNotification();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  async function handleDeleteUser(id: number) {
    try {
      await api.auth.deleteUser(token, id);
      setDeleteConfirm(null);
      notify.success('User deleted');
      onRefresh();
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to delete user');
      setDeleteConfirm(null);
    }
  }

  return (
    <>
      <section>
        <h2 className="text-xl font-medium mb-4">Admin Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-white/10 text-left text-gallery-gray">
                <th className="pb-2 pr-4">Username</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Created</th>
                <th className="pb-2 pr-4 text-center">Email on Order</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="py-3 pr-4">{u.username}</td>
                  <td className="py-3 pr-4 text-gallery-gray">{u.email || '\u2014'}</td>
                  <td className="py-3 pr-4 text-gallery-gray">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4 text-center">
                    <NotifyCheckbox user={u} token={token} onRefresh={onRefresh} />
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
                          onClick={() => setEditingUser(u)}
                          className="text-gallery-gray hover:text-gallery-accent transition-colors"
                        >
                          Edit
                        </button>
                        {users.length > 1 && (
                          <button
                            onClick={() => setDeleteConfirm(u.id)}
                            className="text-gallery-gray hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={editingUser !== null} onClose={() => setEditingUser(null)} title="Edit User">
        {editingUser && (
          <EditUserForm
            user={editingUser}
            token={token}
            onDone={() => {
              setEditingUser(null);
              onRefresh();
            }}
          />
        )}
      </Modal>
    </>
  );
}

function EditUserForm({
  user,
  token,
  onDone,
}: {
  user: AdminUser;
  token: string;
  onDone: () => void;
}) {
  const notify = useNotification();
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data: { username?: string; email?: string; password?: string } = {};
      if (username !== user.username) data.username = username;
      if (email !== (user.email || '')) data.email = email;
      if (password) data.password = password;

      if (Object.keys(data).length === 0) {
        onDone();
        return;
      }

      await api.auth.updateUser(token, user.id, data);
      notify.success('User updated');
      onDone();
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-gallery-gray mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs text-gallery-gray mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-xs text-gallery-gray mb-1">New Password (optional)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Leave empty to keep current"
          className={inputClass}
        />
      </div>
      <button type="submit" disabled={loading} className={btnClass}>
        {loading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}

function NotifyCheckbox({
  user,
  token,
  onRefresh,
}: {
  user: AdminUser;
  token: string;
  onRefresh: () => void;
}) {
  const notify = useNotification();

  async function toggle() {
    try {
      await api.auth.updateUser(token, user.id, { notifyOnOrder: !user.notifyOnOrder });
      onRefresh();
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to update');
    }
  }

  return (
    <input
      type="checkbox"
      checked={user.notifyOnOrder}
      onChange={toggle}
      className="accent-gallery-accent w-4 h-4 cursor-pointer"
    />
  );
}
