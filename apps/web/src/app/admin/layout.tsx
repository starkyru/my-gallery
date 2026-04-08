'use client';

import Link from 'next/link';
import { usePathname, useRouter, redirect } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { api } from '@/lib/api';

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/artists', label: 'Artists' },
  { href: '/admin/images', label: 'Images' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/contacts', label: 'Contacts' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/tags', label: 'Tags' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/protected-galleries', label: 'Galleries' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/walls', label: 'Walls' },
  { href: '/admin/settings', label: 'Settings' },
];

const ARTIST_NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/profile', label: 'My Profile' },
];

const ADMIN_ONLY_ROUTES = [
  '/admin/images',
  '/admin/orders',
  '/admin/artists',
  '/admin/categories',
  '/admin/tags',
  '/admin/contacts',
  '/admin/projects',
  '/admin/protected-galleries',
  '/admin/settings',
  '/admin/users',
  '/admin/walls',
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, role, hydrated, setAuth } = useAuthStore();
  const [encryptionKeyMissing, setEncryptionKeyMissing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (token && role === 'artist' && ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
      router.push('/admin');
    }
  }, [token, role, pathname, router]);

  useEffect(() => {
    if (token && role === 'admin') {
      api.services
        .status(token)
        .then((s) => setEncryptionKeyMissing(!s.encryptionKeySet))
        .catch(() => {});
    }
  }, [token, role]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (pathname === '/admin/login' || pathname === '/admin/reset-password') return <>{children}</>;

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gallery-gray text-sm">Loading...</div>
      </div>
    );
  }

  if (!token) {
    redirect('/admin/login');
  }

  const navItems = role === 'admin' ? ADMIN_NAV : ARTIST_NAV;

  return (
    <div className="pt-20 min-h-screen">
      <nav className="border-b border-white/10 px-4 sm:px-6 py-3">
        <div className="mx-auto max-w-7xl flex items-center gap-6">
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 flex-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors whitespace-nowrap ${
                  pathname === item.href
                    ? 'text-gallery-accent'
                    : 'text-gallery-gray hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 text-gallery-gray hover:text-white"
            aria-label="Toggle menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {mobileMenuOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <button
            onClick={() => {
              setAuth(null);
              router.push('/admin/login');
            }}
            className="ml-auto text-sm text-gallery-gray hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm py-2 px-3 rounded transition-colors ${
                  pathname === item.href
                    ? 'text-gallery-accent bg-white/5'
                    : 'text-gallery-gray hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
      {encryptionKeyMissing && (
        <div className="bg-red-900/80 border border-red-500/50 px-4 sm:px-6 py-3">
          <div className="mx-auto max-w-7xl text-sm text-red-200">
            SERVICE_ENCRYPTION_KEY is not set. Payment and fulfillment services cannot be enabled.
            See PLUGINS.md for setup instructions.
          </div>
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">{children}</div>
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}
