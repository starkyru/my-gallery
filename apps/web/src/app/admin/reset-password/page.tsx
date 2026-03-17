'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.auth.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => router.push('/admin/login'), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <p className="text-red-400">Invalid or missing reset token.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="font-serif text-3xl text-center mb-8">Reset Password</h1>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        {success ? (
          <p className="text-green-400 text-sm text-center">
            Password reset successfully. Redirecting to login...
          </p>
        ) : (
          <>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gallery-accent text-gallery-black font-medium rounded-lg hover:bg-gallery-accent-light transition-colors disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
