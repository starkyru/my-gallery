'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export default function UsersPage() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add user form
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

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

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.auth.createUser(token!, newUsername, newEmail, newPassword);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setSuccess('User created successfully');
      loadUsers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDeleteUser(id: number) {
    setError('');
    setSuccess('');
    try {
      await api.auth.deleteUser(token!, id);
      setDeleteConfirm(null);
      setSuccess('User deleted');
      loadUsers();
    } catch (e: any) {
      setError(e.message);
      setDeleteConfirm(null);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setError('Passwords do not match');
      return;
    }
    setPwLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.auth.changePassword(token!, currentPassword, newPw);
      setCurrentPassword('');
      setNewPw('');
      setConfirmPw('');
      setSuccess('Password changed successfully');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPwLoading(false);
    }
  }

  const inputClass =
    'w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent';
  const btnClass =
    'px-4 py-2 bg-gallery-accent text-gallery-black font-medium rounded-lg hover:bg-gallery-accent-light transition-colors disabled:opacity-50';

  return (
    <div className="space-y-10">
      <h1 className="font-serif text-3xl">User Management</h1>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}

      {/* Users Table */}
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
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="py-3 pr-4">{u.username}</td>
                  <td className="py-3 pr-4 text-gallery-gray">{u.email || '—'}</td>
                  <td className="py-3 pr-4 text-gallery-gray">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
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
                      <button
                        onClick={() => setDeleteConfirm(u.id)}
                        className="text-gallery-gray hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add User */}
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

      {/* Change Password */}
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
    </div>
  );
}
