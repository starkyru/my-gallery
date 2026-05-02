'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.auth.login(username, password);
      setAuth(result.accessToken, result.role as 'admin' | 'artist', result.artistId ?? null);
      if (result.mustChangePassword) {
        router.push('/admin/change-password?required=1');
      } else {
        router.push('/admin');
      }
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const message = (err as { message?: string })?.message;
      if (status === 429) {
        setError(message || 'Too many login attempts. Please wait a moment.');
      } else {
        setError('Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.auth.forgotPassword(forgotEmail);
      setForgotSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent';

  return (
    <div className="flex items-center justify-center min-h-screen px-6 bg-gallery-black text-gallery-white">
      {showForgot ? (
        <div className="w-full max-w-sm space-y-4">
          <h1 className="font-serif text-3xl text-center mb-8">Reset Password</h1>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {forgotSent ? (
            <p className="text-green-400 text-sm text-center">
              If that email is registered, you will receive a reset link shortly.
            </p>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gallery-accent text-gallery-black font-medium rounded-lg hover:bg-gallery-accent-light transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
          <button
            onClick={() => {
              setShowForgot(false);
              setForgotSent(false);
              setError('');
            }}
            className="w-full text-sm text-gallery-gray hover:text-white transition-colors text-center"
          >
            Back to login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <h1 className="font-serif text-3xl text-center mb-8">Login</h1>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div>
            <label htmlFor="login-username" className="sr-only">
              Username
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="login-password" className="sr-only">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gallery-accent text-gallery-black font-medium rounded-lg hover:bg-gallery-accent-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForgot(true);
              setError('');
            }}
            className="w-full text-sm text-gallery-gray hover:text-white transition-colors text-center"
          >
            Forgot password?
          </button>
        </form>
      )}
    </div>
  );
}
